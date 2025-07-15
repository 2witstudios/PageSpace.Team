import { streamText, CoreMessage } from 'ai';
import { db, and, eq, gte } from '@pagespace/db';
import { assistantConversations, assistantMessages } from '@pagespace/db';
import { z } from 'zod';
import { decodeToken } from '@pagespace/lib';
import { extractMentionContexts } from '@/lib/mention-context';
import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import { resolveModel, createModelInstance, handleModelError } from '@/app/api/ai/shared/models';

export const maxDuration = 30;

const postSchema = z.object({
  assistantConversationId: z.string().optional().nullable(),
  driveId: z.string(),
  model: z.string(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant']),
      content: z.union([z.string(), z.object({ type: z.string() }).passthrough()]), // Can be string or Tiptap JSON
      createdAt: z.string().datetime().optional(),
    })
  ),
  pageContext: z.object({
    pageId: z.string(),
    pageTitle: z.string(),
    pageContent: z.string().optional(),
  }),
  isEdit: z.boolean().optional(),
  editedMessageCreatedAt: z.string().datetime().optional(),
  isRegenerate: z.boolean().optional(),
  regeneratedMessageCreatedAt: z.string().datetime().optional(),
});


export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    const body = await req.json();
    const {
      assistantConversationId,
      driveId,
      model,
      messages,
      pageContext,
      isEdit,
      editedMessageCreatedAt,
      isRegenerate,
      regeneratedMessageCreatedAt,
    } = postSchema.parse(body);

    let conversationId = assistantConversationId;

    // If no conversation ID is provided, create a new one
    if (!conversationId) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      
      const getTitleFromMessage = (content: string | Record<string, unknown>): string => {
        if (typeof content === 'string') {
          return content.substring(0, 50);
        }
        if (typeof content === 'object' && content !== null && 'content' in content && Array.isArray(content.content)) {
          // Extract text from Tiptap JSON structure
          const extractText = (nodes: Array<Record<string, unknown>>): string => {
            return nodes.map(node => {
              if (node.type === 'text') return (node.text as string) || '';
              if (node.content && Array.isArray(node.content)) return extractText(node.content);
              return '';
            }).join('');
          };
          const text = extractText(content.content as Array<Record<string, unknown>>);
          return text.substring(0, 50) || 'New Conversation';
        }
        return 'New Conversation';
      }

      const [provider] = model.split(':');
      const newConversation = await db.insert(assistantConversations).values({
        userId,
        driveId,
        title: firstUserMessage ? getTitleFromMessage(firstUserMessage.content) : 'New Conversation',
        model,
        providerOverride: provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: assistantConversations.id });
      conversationId = newConversation[0].id;
    }

    if (isEdit && editedMessageCreatedAt) {
      await db.update(assistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(assistantMessages.conversationId, conversationId!),
          gte(assistantMessages.createdAt, new Date(editedMessageCreatedAt))
        )
      );
    }

    if (isRegenerate && regeneratedMessageCreatedAt) {
      await db.update(assistantMessages).set({
        isActive: false,
        editedAt: new Date(),
      }).where(
        and(
          eq(assistantMessages.conversationId, conversationId!),
          gte(assistantMessages.createdAt, new Date(regeneratedMessageCreatedAt))
        )
      );
    }

    const lastUserMessage = messages[messages.length - 1];

    // --- Enhanced Mention Processing Logic ---
    let mentionedContent = '';
    if (typeof lastUserMessage.content === 'string' || (typeof lastUserMessage.content === 'object' && lastUserMessage.content !== null)) {
      try {
        mentionedContent = await extractMentionContexts(lastUserMessage.content as string | Record<string, unknown>, userId);
      } catch (error) {
        console.warn('Failed to extract mention contexts:', error);
        mentionedContent = '';
      }
    }
    // --- End of Mention Processing Logic ---

    const systemPrompt = `You are an AI assistant. The user is currently viewing a page titled "${pageContext.pageTitle}".
    Here is the content of the page:
    ---
    ${pageContext.pageContent || 'No content available.'}
    ---
    ${mentionedContent ? `\nThe user has mentioned the following in their message:\n${mentionedContent}` : ''}
    Keep your answers concise and relevant to the user's query and the provided page context.`;

    // Resolve the model and API key using the new unified system
    let modelInstance;
    try {
      const { apiKey } = await resolveModel(userId, model);
      modelInstance = createModelInstance(model, apiKey);
    } catch (error) {
      return handleModelError(error);
    }

    const result = await streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: messages.map(m => {
        let contentText = '';
        if (typeof m.content === 'string') {
          try {
            const parsed = JSON.parse(m.content);
            if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
              contentText = parsed.content.map((node: { content?: { text: string }[] }) =>
                node.content?.map((leaf) => leaf.text).join('') || ''
              ).join('\n');
            } else {
              contentText = m.content;
            }
          } catch {
            contentText = m.content;
          }
        } else {
          // Fallback for non-string content
          contentText = 'Unsupported content type';
        }
        return {...m, content: contentText};
      }) as CoreMessage[],
      onFinish: async ({ text, toolCalls, toolResults }) => {
        // Use transaction to ensure both messages are saved atomically
        await db.transaction(async (tx) => {
          await tx.insert(assistantMessages).values([
            {
              conversationId: conversationId!,
              role: 'user',
              content: typeof lastUserMessage.content === 'string' ? lastUserMessage.content : JSON.stringify(lastUserMessage.content),
              isActive: true,
              createdAt: new Date(),
            },
            {
              conversationId: conversationId!,
              role: 'assistant',
              content: text,
              toolCalls: toolCalls,
              toolResults: toolResults,
              isActive: true,
              createdAt: new Date(),
            }
          ]);
        });
      },
    });

    // Respond with the streaming response and the conversation ID
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-Id', conversationId);
    return response;

  } catch (error) {
    console.error('Error in AI assistant chat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}