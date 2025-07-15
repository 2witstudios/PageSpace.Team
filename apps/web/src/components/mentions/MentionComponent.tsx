import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useRouter } from 'next/navigation';
import { useDriveStore } from '@/hooks/useDrive';
import { MentionType } from '@/types/mentions';
import { Users, MessageSquare, Bot, Hash, FileText } from 'lucide-react';

const MentionComponent: React.FC<NodeViewProps> = ({ node }) => {
  const { drives, currentDriveId } = useDriveStore();
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Safely extract attributes with defaults
  const id = node.attrs.id as string;
  const label = node.attrs.label as string;
  const type = (node.attrs.type as MentionType) || 'page';
  const data = node.attrs.data as Record<string, unknown> || {};
  const currentDrive = drives.find(d => d.id === currentDriveId);

  const getMentionIcon = (mentionType: MentionType) => {
    switch (mentionType) {
      case 'page':
        return <FileText className="w-3 h-3" />;
      case 'user':
        return <Users className="w-3 h-3" />;
      case 'ai-page':
        return <Bot className="w-3 h-3" />;
      case 'ai-assistant':
        return <MessageSquare className="w-3 h-3" />;
      case 'channel':
        return <Hash className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getMentionUrl = () => {
    if (!currentDrive) return '#';
    
    switch (type) {
      case 'page':
      case 'ai-page':
      case 'channel':
        return `/dashboard/${currentDrive.slug}/${id}`;
      case 'user':
        // Could link to user profile or just show as text
        return '#';
      case 'ai-assistant':
        // Could open assistant sidebar with conversation
        return '#';
      default:
        return '#';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = getMentionUrl();
    
    if (url === '#') {
      // For non-navigable mentions like users or assistant conversations
      return;
    }
    
    router.push(url);
  };

  const getMentionClassName = () => {
    const baseClass = 'mention-pill';
    const typeClass = `mention-${type}`;
    const isClickable = getMentionUrl() !== '#';
    const disabledClass = !isClickable ? 'is-disabled' : '';
    return `${baseClass} ${typeClass} ${disabledClass}`.trim();
  };

  const getTooltipContent = () => {
    switch (type) {
      case 'page':
        return `Page: ${label}\n${data.pageType ? `Type: ${data.pageType}` : ''}`;
      case 'user':
        return `User: ${label}\n${data.email ? `Email: ${data.email}` : ''}`;
      case 'ai-page':
        return `AI Chat: ${label}\nClick to view conversation`;
      case 'ai-assistant':
        return `Assistant Conversation: ${label}\nClick to open in sidebar`;
      case 'channel':
        return `Channel: ${label}\nClick to view messages`;
      default:
        return `${type}: ${label}`;
    }
  };

  if (!currentDrive) {
    return (
      <NodeViewWrapper as="span" className="mention-pill is-loading">
        {getMentionIcon(type)}
        @{label}
      </NodeViewWrapper>
    );
  }

  const isClickable = getMentionUrl() !== '#';

  return (
    <NodeViewWrapper
      as={isClickable ? "a" : "span"}
      className={getMentionClassName()}
      onClick={isClickable ? handleClick : undefined}
      href={isClickable ? getMentionUrl() : undefined}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative' }}
    >
      {getMentionIcon(type)}
      @{label}
      
      {showTooltip && (
        <div
          className="mention-tooltip"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '4px',
            whiteSpace: 'pre-line'
          }}
        >
          {getTooltipContent()}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default MentionComponent;