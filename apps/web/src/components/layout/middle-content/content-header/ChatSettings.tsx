'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';
import Link from 'next/link';

interface ChatSettingsProps {
  // Available models to choose from
  availableModels: Array<{ value: string; label: string; provider: string }>;
  // Currently selected model
  currentModel: string;
  // Called when user selects a different model
  onModelChange: (model: string) => void;
  // Loading state
  isLoading?: boolean;
}

export function ChatSettings({ availableModels, currentModel, onModelChange, isLoading = false }: ChatSettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Parse current model to get provider and model ID
  useEffect(() => {
    if (currentModel) {
      const [provider] = currentModel.split(':');
      setSelectedProvider(provider);
    }
  }, [currentModel]);

  // Group models by provider for the provider dropdown
  const availableProviders = Array.from(new Set(availableModels.map(m => m.provider)))
    .map(provider => ({
      id: provider,
      name: provider.charAt(0).toUpperCase() + provider.slice(1)
    }));

  // Get available models for the selected provider
  const modelsForProvider = availableModels.filter(m => m.provider === selectedProvider);

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    const firstModel = availableModels.find(m => m.provider === newProvider);
    if (firstModel) {
      onModelChange(firstModel.value);
    }
  };

  const handleModelChange = (newModelValue: string) => {
    onModelChange(newModelValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-[120px] h-8 bg-gray-200 animate-pulse rounded" />
        <div className="w-[160px] h-8 bg-gray-200 animate-pulse rounded" />
        <Button variant="ghost" size="sm" disabled>
          <Cog className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-[120px] text-xs">
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map(provider => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedProvider && (
        <Select value={currentModel} onValueChange={handleModelChange}>
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {modelsForProvider.map(model => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/settings/ai">
          <Cog className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}