import { createOllama } from 'ollama-ai-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';
import { db, userAiSettings, eq, and } from '@pagespace/db';
import { decrypt } from '@pagespace/lib';

export async function resolveModel(userId: string, model: string) {
  console.log('🔍 resolveModel called for userId:', userId, 'model:', model);

  const [provider] = model.split(':');
  if (!provider) {
    throw new Error('Invalid model format. Expected "provider:model"');
  }

  // Get the API key for the specified provider
  let apiKey: string | undefined;
  
  const setting = await db.query.userAiSettings.findFirst({
    where: and(eq(userAiSettings.userId, userId), eq(userAiSettings.provider, provider)),
  });
  
  console.log('🔑 API key setting found:', setting ? { id: setting.id, provider: setting.provider, hasKey: !!setting.encryptedApiKey } : null);
  
  if (setting?.encryptedApiKey) {
    try {
      apiKey = await decrypt(setting.encryptedApiKey);
      console.log('✅ API key decrypted successfully');
    } catch (error) {
      console.error("❌ Failed to decrypt API key for user", userId, "and provider", provider, error);
      throw new Error(`Failed to decrypt API key for ${provider}`);
    }
  } else {
    console.log('⚠️ No user API key found for provider:', provider, '- checking environment');
    // If no user key, try environment variables
    if (provider === 'google' && process.env.GOOGLE_API_KEY) {
      apiKey = process.env.GOOGLE_API_KEY;
    } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
    } else if (provider === 'ollama') {
      // Ollama doesn't need an API key
      apiKey = undefined;
    } else {
      throw new Error(`No API key configured for ${provider}`);
    }
  }

  console.log('🎯 Final resolved model:', { provider, hasApiKey: !!apiKey, model });
  return { provider, apiKey, model };
}


/**
 * Creates an AI model instance based on the model string format "provider:model"
 * Extracted from existing working AI routes
 */
export function createModelInstance(model: string, apiKey?: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'google') {
    const finalApiKey = apiKey || process.env.GOOGLE_API_KEY;
    if (!finalApiKey) {
      throw new Error('Google API key is not configured.');
    }
    const google = createGoogleGenerativeAI({
      apiKey: finalApiKey,
    });
    return google(modelName);
  } else if (providerName === 'ollama') {
    const ollama = createOllama();
    return ollama(modelName);
  } else if (providerName === 'openai') {
    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalApiKey) {
        throw new Error('OpenAI API key is not configured.');
    }
    const openai = createOpenAI({
        apiKey: finalApiKey,
    });
    return openai(modelName);
  } else if (providerName === 'anthropic') {
    const finalApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!finalApiKey) {
        throw new Error('Anthropic API key is not configured.');
    }
    const anthropic = createAnthropic({
        apiKey: finalApiKey,
    });
    return anthropic(modelName);
  } else if (providerName === 'openrouter') {
    const finalApiKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!finalApiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }
    const openrouter = createOpenRouter({
        apiKey: finalApiKey,
    });
    return openrouter.chat(modelName);
  } else {
    throw new Error('Invalid model provider');
  }
}

/**
 * Handles model creation errors consistently across AI routes
 */
export function handleModelError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Invalid model provider')) {
      return NextResponse.json({ error: 'Invalid model provider' }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'Failed to initialize AI model' }, { status: 500 });
}