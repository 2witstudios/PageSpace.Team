import React from 'react';
import TiptapRenderer from '@/components/rich-text/TiptapRenderer';

// Define the structure for message parts
export interface MessagePart {
  type: 'text' | 'rich-text' | 'tool-invocation';
  text?: string;
  content?: string | Record<string, unknown>;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

interface MessagePartRendererProps {
  part: MessagePart;
  index: number;
  context?: 'message';
}

const MessagePartRenderer: React.FC<MessagePartRendererProps> = ({ part, index, context }) => {
  switch (part.type) {
    case 'text':
      return <span key={index}>{part.text}</span>;
    
    case 'rich-text':
      return <TiptapRenderer key={index} content={part.content || ''} context={context} />;
    
    case 'tool-invocation':
      return (
        <div
          key={index}
          className="mt-2 p-2 border rounded-lg bg-muted"
        >
          <div className="font-semibold">
            {part.toolInvocation?.toolName}
          </div>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(part.toolInvocation?.args, null, 2)}
          </pre>
        </div>
      );
    
    default:
      console.warn('Unknown message part type:', part);
      return null;
  }
};

// Utility function to convert message content to parts format
export const convertToMessageParts = (content: string | Record<string, unknown>): MessagePart[] => {
  if (typeof content === 'string') {
    if (content.startsWith('{"type":"doc"')) {
      try {
        const parsedContent = JSON.parse(content);
        return [{
          type: 'rich-text',
          content: parsedContent
        }];
      } catch {
        return [{
          type: 'text',
          text: content
        }];
      }
    } else {
      return [{
        type: 'text',
        text: content
      }];
    }
  } else {
    return [{
      type: 'rich-text',
      content: content
    }];
  }
};

// Utility function to render all parts of a message
export const renderMessageParts = (parts: MessagePart[], context?: 'message'): React.ReactNode => {
  return parts.map((part, index) => (
    <MessagePartRenderer key={index} part={part} index={index} context={context} />
  ));
};

export default MessagePartRenderer;