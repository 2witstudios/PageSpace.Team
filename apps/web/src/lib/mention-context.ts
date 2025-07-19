import { db, eq, and } from '@pagespace/db';
import { pages, chatMessages, assistantMessages, assistantConversations, channelMessages } from '@pagespace/db';
import { getUserAccessLevel, getPageContentForAI } from '@pagespace/lib';
import type { Page } from '@pagespace/lib';

interface MentionContext {
  id: string;
  type: string;
  content: string;
  label: string;
}

export async function extractMentionContexts(
  content: string | string[],
  userId: string
): Promise<string> {
  const mentionContexts: MentionContext[] = [];
  
  // Extract all mentions from content
  const mentions = extractMentions(content);
  
  for (const mention of mentions) {
    const context = await getMentionContext(mention, userId);
    if (context) {
      mentionContexts.push(context);
    }
  }
  
  if (mentionContexts.length === 0) {
    return '';
  }
  
  // Format contexts for AI
  return mentionContexts.map(ctx => {
    switch (ctx.type) {
      case 'page':
        return `Page "${ctx.label}":\n${ctx.content}`;
      case 'ai-page':
        return `AI Chat "${ctx.label}":\n${ctx.content}`;
      case 'ai-assistant':
        return `Assistant Conversation "${ctx.label}":\n${ctx.content}`;
      case 'channel':
        return `Channel "${ctx.label}":\n${ctx.content}`;
      case 'user':
        return `User "${ctx.label}" was mentioned`;
      default:
        return `"${ctx.label}":\n${ctx.content}`;
    }
  }).join('\n\n');
}

function extractMentions(content: string | string[]): Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> {
  const mentions: Array<{id: string, type: string, label: string, data?: Record<string, unknown>}> = [];
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  const lines = Array.isArray(content) ? content : [content];
  
  for (const line of lines) {
    if (typeof line === 'string') {
      let match;
      while ((match = mentionRegex.exec(line)) !== null) {
        mentions.push({
          id: match[2],
          type: 'page', // Default type
          label: match[1],
        });
      }
    }
  }
  
  return mentions;
}

async function getMentionContext(
  mention: {id: string, type: string, label: string, data?: Record<string, unknown>},
  userId: string
): Promise<MentionContext | null> {
  switch (mention.type) {
    case 'page':
      return await getPageContext(mention.id, userId, mention.label);
    
    case 'page-ai':
      return await getPageAIContext(mention.id, userId, mention.label);
    
    case 'ai-assistant':
      return await getAssistantAIContext(mention.id, userId, mention.label);
    
    case 'channel':
      return await getChannelContext(mention.id, userId, mention.label);
    
    case 'user':
      // Users don't have content context, just acknowledge the mention
      return {
        id: mention.id,
        type: 'user',
        content: '',
        label: mention.label
      };
    
    default:
      return null;
  }
}

async function getPageContext(pageId: string, userId: string, label: string): Promise<MentionContext | null> {
  const accessLevel = await getUserAccessLevel(userId, pageId);
  if (!accessLevel) return null;
  
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  });
  
  if (!page || page.isTrashed) return null;
  
  const content = await getPageContentForAI(page as unknown as Page);
  return {
    id: pageId,
    type: 'page',
    content,
    label
  };
}

async function getPageAIContext(pageId: string, userId: string, label: string): Promise<MentionContext | null> {
  const accessLevel = await getUserAccessLevel(userId, pageId);
  if (!accessLevel) return null;
  
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.type, 'AI_CHAT')),
  });
  
  if (!page || page.isTrashed) return null;
  
  // Get recent chat messages from this AI chat
  const messages = await db.query.chatMessages.findMany({
    where: and(eq(chatMessages.pageId, pageId), eq(chatMessages.isActive, true)),
    orderBy: chatMessages.createdAt,
    limit: 10,
    with: {
      user: true
    }
  });
  
  const chatContent = messages.map(msg => 
    `${msg.user?.name || 'User'}: ${msg.content}`
  ).join('\n');
  
  return {
    id: pageId,
    type: 'ai-page',
    content: chatContent || 'No conversation history yet.',
    label
  };
}

async function getAssistantAIContext(conversationId: string, userId: string, label: string): Promise<MentionContext | null> {
  // Verify user owns this conversation
  const conversation = await db.query.assistantConversations.findFirst({
    where: and(eq(assistantConversations.id, conversationId), eq(assistantConversations.userId, userId)),
  });
  
  if (!conversation) return null;
  
  // Get recent messages from this assistant conversation
  const messages = await db.query.assistantMessages.findMany({
    where: and(eq(assistantMessages.conversationId, conversationId), eq(assistantMessages.isActive, true)),
    orderBy: assistantMessages.createdAt,
    limit: 10
  });
  
  const chatContent = messages.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
  
  return {
    id: conversationId,
    type: 'ai-assistant',
    content: chatContent || 'No conversation history yet.',
    label
  };
}

async function getChannelContext(pageId: string, userId: string, label: string): Promise<MentionContext | null> {
  const accessLevel = await getUserAccessLevel(userId, pageId);
  if (!accessLevel) return null;
  
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.type, 'CHANNEL')),
  });
  
  if (!page || page.isTrashed) return null;
  
  // Get recent channel messages
  const messages = await db.query.channelMessages.findMany({
    where: eq(channelMessages.pageId, pageId),
    orderBy: channelMessages.createdAt,
    limit: 10,
    with: {
      user: true
    }
  });
  
  const channelContent = messages.map(msg => 
    `${msg.user?.name || 'User'}: ${msg.content}`
  ).join('\n');
  
  return {
    id: pageId,
    type: 'channel',
    content: channelContent || 'No messages in this channel yet.',
    label
  };
}