import React from 'react';
import {
  FileText,
  Folder,
  Database,
  MessageSquare,
  Bot,
} from 'lucide-react';

const PageIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'DOCUMENT':
      return <FileText className="h-4 w-4" />;
    case 'FOLDER':
      return <Folder className="h-4 w-4" />;
    case 'DATABASE':
      return <Database className="h-4 w-4" />;
    case 'CHANNEL':
      return <MessageSquare className="h-4 w-4" />;
    case 'AI_CHAT':
      return <Bot className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default PageIcon;