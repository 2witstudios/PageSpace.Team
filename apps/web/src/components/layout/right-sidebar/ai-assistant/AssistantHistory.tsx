'use client';

import { useEffect, useState } from 'react';
import { useAssistantStore, AssistantConversation } from '@/stores/useAssistantStore';
import { useDriveStore } from '@/hooks/useDrive';
import { Message } from 'ai/react';
import { ScrollArea } from '@/components/ui/scroll-area';
interface AssistantHistoryProps {
  setMessages: (messages: Message[]) => void;
  setActiveTab: (tab: string) => void;
}

export default function AssistantHistory({ setMessages, setActiveTab }: AssistantHistoryProps) {
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const { drives, currentDriveId } = useDriveStore();
  const currentDrive = drives.find(d => d.id === currentDriveId);
  const { setActiveConversation } = useAssistantStore();

  useEffect(() => {
    if (currentDrive) {
      fetch(`/api/ai/ai-assistant/conversations?driveId=${currentDrive.id}`)
        .then(res => res.json())
        .then(data => setConversations(data));
    }
  }, [currentDrive]);

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    const response = await fetch(`/api/ai/ai-assistant/conversations/${id}`);
    const data = await response.json();
    if (data.messages) {
      setMessages(data.messages);
      setActiveTab('assistant');
    }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b">
            <h3 className="font-semibold">History</h3>
        </div>
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-2">
            {conversations.map(convo => (
                <div 
                    key={convo.id} 
                    className="p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectConversation(convo.id)}
                >
                    <p className="text-sm font-medium truncate">{convo.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(convo.updatedAt).toLocaleDateString()}
                    </p>
                </div>
            ))}
            </div>
        </ScrollArea>
    </div>
  );
}