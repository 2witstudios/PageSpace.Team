'use client';

import { Message, UseChatHelpers } from 'ai/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { usePageStore } from '@/hooks/usePage';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import { PlusSquare, Edit2, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useDriveStore } from '@/hooks/useDrive';
import { useState } from 'react';
import { renderMessageParts, convertToMessageParts, MessagePart } from '@/components/messages/MessagePartRenderer';
import { useAuth } from '@/hooks/use-auth';

interface AssistantChatProps {
  chat: UseChatHelpers;
}

export default function AssistantChat({ chat }: AssistantChatProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { drives, currentDriveId } = useDriveStore();
  const currentDrive = drives.find((d) => d.id === currentDriveId);
  const pageId = usePageStore((state) => state.pageId);
  const { tree } = usePageTree(currentDrive?.slug);
  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;
  const { activeConversationId } = useAssistantStore();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  const {
    messages,
    reload,
    setMessages,
  } = chat;


  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId) return;

    const messageIndex = messages.findIndex((m) => m.id === editingMessageId);
    if (messageIndex === -1) return;

    const editedMessage = messages[messageIndex];
    if (!editedMessage.createdAt) return;

    const newMessages = messages.slice(0, messageIndex);
    newMessages.push({
      ...editedMessage,
      content: typeof editedContent === 'string' ? editedContent : JSON.stringify(editedContent),
    });

    setMessages(newMessages);
    reload({
      body: {
        isEdit: true,
        editedMessageCreatedAt: editedMessage.createdAt.toISOString(),
      },
    });

    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleRegenerate = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const messageToRegenerate = messages[messageIndex];
    if (
      messageToRegenerate.role !== 'assistant' ||
      !messageToRegenerate.createdAt
    )
      return;

    const userMessageIndex = messages
      .slice(0, messageIndex)
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (userMessageIndex === -1) return;

    const originalUserIndex = messageIndex - 1 - userMessageIndex;
    const newMessages = messages.slice(0, originalUserIndex + 1);

    setMessages(newMessages);
    reload({
      body: {
        isRegenerate: true,
        regeneratedMessageCreatedAt:
          messageToRegenerate.createdAt.toISOString(),
      },
    });
  };

  const handlePromote = async () => {
    if (!activeConversationId || !page || !currentDrive) {
      toast.warning('Cannot promote an empty or uninitialized conversation.');
      return;
    }

    const promise = fetch('/api/ai/ai-assistant/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistantConversationId: activeConversationId,
        parentPageId: page.id,
        driveId: currentDrive.id,
      }),
    });

    toast.promise(promise, {
      loading: 'Promoting conversation to page...',
      success: async (res) => {
        const { pageId, driveSlug } = await res.json();
        useAssistantStore.getState().clearConversation();
        router.push(`/dashboard/${driveSlug}/${pageId}`);
        return 'Conversation promoted successfully!';
      },
      error: 'Failed to promote conversation.',
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area - takes remaining space and creates scroll when needed */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 divide-y divide-border">
            {messages.map((m) => {
              const isEditing = editingMessageId === m.id;
              const isLastAssistantMessage =
                m.role === 'assistant' &&
                messages[messages.length - 1].id === m.id;
              const lastUserMessage = messages
                .filter((m) => m.role === 'user')
                .slice(-1)[0];
              const isLastUserMessage = m.id === lastUserMessage?.id;
              const senderName =
                m.role === 'assistant' ? 'Assistant' : user?.name ?? 'You';

              return (
                <div key={m.id} className="group relative py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">{senderName}:</span>
                      <span className="text-xs text-muted-foreground">
                        {m.createdAt &&
                          new Date(m.createdAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            Save & Submit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-foreground/80 mt-1 pr-10">
                          {(() => {
                            // Convert message to standardized parts format
                            let parts: MessagePart[];
                            
                            if (m.role === 'assistant' && m.parts) {
                              // AI message with existing parts structure
                              parts = m.parts.map(part => {
                                if (part.type === 'text') {
                                  return {
                                    type: 'text' as const,
                                    text: (part as { text: string }).text
                                  };
                                } else if (part.type === 'tool-invocation') {
                                  return {
                                    type: 'tool-invocation' as const,
                                    toolInvocation: (part as { toolInvocation: { toolName: string; args: Record<string, unknown> } }).toolInvocation
                                  };
                                } else {
                                  // Skip unknown part types (like step-start, step-end, etc.)
                                  return null;
                                }
                              }).filter(part => part !== null) as MessagePart[];
                            } else if (m.role === 'user') {
                              // User message - treat as rich text for mention support
                              parts = convertToMessageParts(m.content);
                            } else {
                              // AI message without parts - treat as plain text
                              parts = convertToMessageParts(m.content);
                            }
                            
                            return renderMessageParts(parts, 'message');
                          })()}
                        </div>
                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center">
                          {m.role === 'user' && isLastUserMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditClick(m)}
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {isLastAssistantMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRegenerate(m.id)}
                            >
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              navigator.clipboard.writeText(m.content)
                            }
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePromote}
            disabled={!activeConversationId}
          >
            <PlusSquare className="h-5 w-5" />
          </Button>
          <textarea
            value={chat.input}
            onChange={chat.handleInputChange}
            placeholder="Ask the AI..."
            className="flex-1 w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );
}