'use client';

import { useAiSettings } from '@/hooks/useAiSettings';
import { useAssistantStore } from '@/stores/useAssistantStore';
import { ChatSettings } from '../../middle-content/content-header/ChatSettings';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AssistantSettings() {
  const { activeConversationId, model, setModel } = useAssistantStore();
  
  const aiSettings = useAiSettings({
    conversationId: activeConversationId || undefined,
    context: 'assistant',
  });

  const handleModelChange = async (newModel: string) => {
    try {
      // Update the store immediately for UI responsiveness
      setModel(newModel);
      
      // If there's an active conversation, persist the model to the backend
      if (activeConversationId) {
        await aiSettings.updateModel(newModel);
        toast.success('Model updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model.');
      // Revert the store change if backend update failed
      if (activeConversationId) {
        setModel(aiSettings.currentSettings?.model || 'google:gemini-1.5-pro');
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">AI Settings</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <ChatSettings
          availableModels={aiSettings.availableModels}
          currentModel={model}
          onModelChange={handleModelChange}
          isLoading={aiSettings.settingsLoading}
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">
          Manage API keys and provider settings
        </p>
        <Link href="/dashboard/settings/ai">
          <Button variant="outline" size="sm">
            AI Provider Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}