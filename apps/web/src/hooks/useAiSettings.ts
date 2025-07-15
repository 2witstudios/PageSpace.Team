import { useState, useCallback } from 'react';
import useSWR from 'swr';

export interface AiProvider {
  id: string;
  provider: string;
  updatedAt: Date;
  isApiKeySet: boolean;
}

export interface AiChatSettings {
  model: string;
  providerOverride?: string;
  temperature?: number;
  systemPrompt?: string;
}

interface UseAiSettingsProps {
  // For page-specific settings
  pageId?: string;
  // For assistant settings
  conversationId?: string;
  // Context type to help differentiate behavior
  context: 'page' | 'assistant';
}

interface UseAiSettingsResult {
  // Available providers and their API key status
  providers: AiProvider[];
  providersLoading: boolean;
  providersError: unknown;
  
  // Current settings for this context
  currentSettings: AiChatSettings | null;
  settingsLoading: boolean;
  settingsError: unknown;
  
  // Actions
  updateModel: (model: string) => Promise<void>;
  updateProvider: (provider: string, apiKey?: string) => Promise<void>;
  deleteProvider: (provider: string) => Promise<void>;
  
  // Computed values
  availableModels: Array<{ value: string; label: string; provider: string }>;
  currentProvider: string | null;
}

const MODELS_BY_PROVIDER = {
  google: [
    { value: 'google:gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'google:gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  openai: [
    { value: 'openai:gpt-4o', label: 'GPT-4o' },
    { value: 'openai:gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai:gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'anthropic:claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic:claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'anthropic:claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  openrouter: [
    { value: 'openrouter:anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)' },
    { value: 'openrouter:openai/gpt-4o', label: 'GPT-4o (OpenRouter)' },
    { value: 'openrouter:google/gemini-pro-1.5', label: 'Gemini Pro 1.5 (OpenRouter)' },
    { value: 'openrouter:meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B (OpenRouter)' },
    { value: 'openrouter:mistralai/mistral-large', label: 'Mistral Large (OpenRouter)' },
  ],
  ollama: [
    { value: 'ollama:llama3', label: 'Llama 3' },
    { value: 'ollama:mistral', label: 'Mistral' },
    { value: 'ollama:codellama', label: 'Code Llama' },
  ],
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};

export function useAiSettings({ pageId, conversationId, context }: UseAiSettingsProps): UseAiSettingsResult {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch available providers
  const { data: providers = [], error: providersError, isLoading: providersLoading, mutate: mutateProviders } = useSWR<AiProvider[]>(
    '/api/ai/user-settings',
    fetcher
  );

  // Fetch current settings based on context
  const settingsUrl = context === 'page' && pageId 
    ? `/api/ai/ai-page/settings/${pageId}`
    : context === 'assistant' && conversationId
    ? `/api/ai/ai-assistant/conversations/${conversationId}`
    : null;

  const { data: currentSettings, error: settingsError, isLoading: settingsLoading, mutate: mutateSettings } = useSWR<AiChatSettings>(
    settingsUrl,
    fetcher
  );

  // Compute available models based on providers with API keys
  const availableModels = providers
    .filter(p => p.isApiKeySet)
    .flatMap(p => MODELS_BY_PROVIDER[p.provider as keyof typeof MODELS_BY_PROVIDER] || [])
    .map(model => ({ ...model, provider: model.value.split(':')[0] }));

  // Get current provider from current model
  const currentProvider = currentSettings?.model ? currentSettings.model.split(':')[0] : null;

  // Update model for current context
  const updateModel = useCallback(async (model: string) => {
    if (!settingsUrl) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(settingsUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update model');
      }
      
      await mutateSettings();
    } finally {
      setIsUpdating(false);
    }
  }, [settingsUrl, mutateSettings]);

  // Update provider (add/update API key)
  const updateProvider = useCallback(async (provider: string, apiKey?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update provider');
      }
      
      await mutateProviders();
    } finally {
      setIsUpdating(false);
    }
  }, [mutateProviders]);

  // Delete provider API key
  const deleteProvider = useCallback(async (provider: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/ai/user-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete provider');
      }
      
      await mutateProviders();
    } finally {
      setIsUpdating(false);
    }
  }, [mutateProviders]);

  return {
    providers,
    providersLoading: providersLoading || isUpdating,
    providersError,
    
    currentSettings: currentSettings ?? null,
    settingsLoading: settingsLoading || isUpdating,
    settingsError,
    
    updateModel,
    updateProvider,
    deleteProvider,
    
    availableModels,
    currentProvider,
  };
}