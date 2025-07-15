# How to Add a New AI Provider

This guide explains how to add a new AI provider to the pagespace application, leveraging the Vercel AI SDK. We will use OpenAI as an example.

## Prerequisites

- You will need an API key from the provider you want to add. For this example, you'll need an [OpenAI API key](https://platform.openai.com/api-keys).

## Step 1: Install the Provider's SDK

First, install the official Vercel AI SDK package for the desired provider.

```bash
pnpm add @ai-sdk/openai
```

## Step 2: Update the Model Factory

The `createModelInstance` function in [`apps/web/src/app/api/ai/shared/models.ts`](apps/web/src/app/api/ai/shared/models.ts:9) is a factory that creates model instances based on a string identifier. You need to add a new case for the `openai` provider.

```typescript
// apps/web/src/app/api/ai/shared/models.ts
import { createOllama } from 'ollama-ai-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai'; // 1. Import the new provider
import { NextResponse } from 'next/server';

export function createModelInstance(model: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'google') {
    // ... existing google provider logic
  } else if (providerName === 'ollama') {
    // ... existing ollama provider logic
  } else if (providerName === 'openai') { // 2. Add the new provider case
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured.');
    }
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(modelName);
  } else {
    throw new Error('Invalid model provider');
  }
}
```

## Step 3: Configure Environment Variables

Add the new provider's API key to your environment variables file.

```.env
# .env
OPENAI_API_KEY=your-openai-api-key
```

## Step 4: Update Error Handling

To ensure consistent error handling, add a case for the new provider in the `handleModelError` function in the same file.

```typescript
// apps/web/src/app/api/ai/shared/models.ts

export function handleModelError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Google API key')) {
      return NextResponse.json({ error: 'Google API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('OpenAI API key')) { // Add error handling for the new provider
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }
    if (error.message.includes('Invalid model provider')) {
      return NextResponse.json({ error: 'Invalid model provider' }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'Failed to initialize AI model' }, { status: 500 });
}
```

## Step 5: Usage

You can now use the new provider in any API route by passing the correct model string (e.g., `"openai:gpt-4o"`) to the `createModelInstance` function.

```typescript
// Example usage in an API route
import { createModelInstance, handleModelError } from '../shared/models';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json(); // e.g., model = "openai:gpt-4o"
    const aiModel = createModelInstance(model);
    
    const result = await streamText({
      model: aiModel,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleModelError(error);
  }
}