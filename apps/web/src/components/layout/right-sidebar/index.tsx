'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssistantChat from './ai-assistant/AssistantChat';
import AssistantHistory from './ai-assistant/AssistantHistory';
import AssistantSettings from './ai-assistant/AssistantSettings';
import { useChat } from 'ai/react';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { usePageStore } from '@/hooks/usePage';
import { useDriveStore } from '@/hooks/useDrive';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RightPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('assistant');
  const { activeConversationId, setActiveConversation, model, clearConversation } = useAssistantStore();
  const pageId = usePageStore((state) => state.pageId);
  const { drives, currentDriveId } = useDriveStore();
  const currentDrive = drives.find((d) => d.id === currentDriveId);
  const { tree } = usePageTree(currentDrive?.slug);
  const pageResult = pageId ? findNodeAndParent(tree, pageId) : null;
  const page = pageResult?.node;

  const chat = useChat({
    api: '/api/ai/ai-assistant/messages',
    maxSteps: 5,
    body: {
      assistantConversationId: activeConversationId,
      driveId: currentDrive?.id,
      model: model,
      pageContext: page
        ? {
            pageId: page.id,
            pageTitle: page.title,
            pageContent:
              typeof page.content === 'string'
                ? page.content
                : JSON.stringify(page.content),
          }
        : undefined,
    },
    onResponse: (response) => {
      if (!activeConversationId) {
        const newConversationId = response.headers.get('X-Conversation-Id');
        if (newConversationId) {
          setActiveConversation(newConversationId);
        }
      }
    },
    onError: (error) => {
      console.error('Assistant chat error:', error);
      
      // Check if it's an API key error
      if (error.message && error.message.includes('API key')) {
        const providerMatch = error.message.match(/(Google|OpenAI|Anthropic|OpenRouter)/i);
        const provider = providerMatch ? providerMatch[1] : 'AI provider';
        
        toast.error(`${provider} API key not configured`, {
          description: 'Click here to go to settings',
          action: {
            label: 'Settings',
            onClick: () => router.push('/dashboard/settings'),
          },
        });
      } else {
        toast.error('An error occurred: ' + error.message);
      }
    },
  });

  const handleNewConversation = () => {
    clearConversation();
    chat.setMessages([]);
    setActiveTab('assistant');
  };

  return (
    <aside className="hidden sm:flex w-80 border-l bg-sidebar text-sidebar-foreground flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <Button variant="ghost" size="icon" onClick={handleNewConversation}>
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-grow min-h-0 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="assistant">Chat</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent
          value="assistant"
          className="flex-grow min-h-0 flex flex-col"
        >
          <AssistantChat chat={chat} />
        </TabsContent>
        <TabsContent value="history" className="flex-grow min-h-0">
          <AssistantHistory setMessages={chat.setMessages} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="settings" className="flex-grow min-h-0">
          <AssistantSettings />
        </TabsContent>
      </Tabs>
    </aside>
  );
}