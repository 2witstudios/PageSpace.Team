'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

export type Setting = {
  id: string;
  provider: string;
  isApiKeySet: boolean;
  updatedAt: Date;
};

interface ProviderSettingsProps {
  initialSettings: Setting[];
}

const ALL_PROVIDERS = ['google', 'openai', 'anthropic', 'openrouter', 'ollama'];

const PROVIDER_LABELS = {
  google: 'Google',
  openai: 'OpenAI', 
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  ollama: 'Ollama'
};

export function ProviderSettings({ initialSettings }: ProviderSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { mutate } = useSWRConfig();

  const handleUpdate = (updatedSetting: Setting) => {
    setSettings(currentSettings => {
      const index = currentSettings.findIndex(s => s.provider === updatedSetting.provider);
      if (index > -1) {
        const newSettings = [...currentSettings];
        newSettings[index] = updatedSetting;
        return newSettings;
      }
      return [...currentSettings, updatedSetting];
    });
  };

  const handleSave = async (provider: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) return;

    setLoadingStates(prev => ({ ...prev, [provider]: true }));
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const updatedSetting = await response.json();
      if (!response.ok) {
        throw new Error(updatedSetting.error?.message || 'Failed to save API key.');
      }
      handleUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS]} API key saved successfully.`);
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemove = async (provider: string) => {
    setLoadingStates(prev => ({ ...prev, [provider]: true }));
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const updatedSetting = await response.json();
      if (!response.ok) {
        throw new Error(updatedSetting.error?.message || 'Failed to remove API key.');
      }
      handleUpdate(updatedSetting);
      mutate('/api/ai/user-settings');
      toast.success(`${PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS]} API key removed successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const mergedSettings = ALL_PROVIDERS.map(provider => {
    const existingSetting = settings.find(s => s.provider === provider);
    return existingSetting || {
      id: '',
      provider,
      isApiKeySet: false,
      updatedAt: new Date(),
    };
  });

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mergedSettings.map(setting => (
            <TableRow key={setting.provider}>
              <TableCell className="font-medium">
                {PROVIDER_LABELS[setting.provider as keyof typeof PROVIDER_LABELS]}
              </TableCell>
              <TableCell>
                <Badge variant={setting.isApiKeySet ? 'default' : 'secondary'}>
                  {setting.isApiKeySet ? 'Configured' : 'Not Set'}
                </Badge>
              </TableCell>
              <TableCell>
                <Input
                  type="password"
                  value={apiKeys[setting.provider] || ''}
                  onChange={(e) => setApiKeys(prev => ({ 
                    ...prev, 
                    [setting.provider]: e.target.value 
                  }))}
                  placeholder="Enter API key"
                  className="max-w-xs"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.provider)}
                    disabled={loadingStates[setting.provider] || !apiKeys[setting.provider]}
                  >
                    {loadingStates[setting.provider] ? 'Saving...' : 'Save'}
                  </Button>
                  {setting.isApiKeySet && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(setting.provider)}
                      disabled={loadingStates[setting.provider]}
                    >
                      {loadingStates[setting.provider] ? 'Removing...' : 'Remove'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}