# Integration: Ollama

This document outlines how pagespace integrates with Ollama for self-hosted, local AI models.

## Overview

Ollama is a powerful tool that allows us to download and run open-source large language models (LLMs) directly on our local machines. This is a critical component of our local-first development strategy, ensuring that core AI features can be developed and tested without any reliance on cloud-based, proprietary services.

Our backend communicates with the Ollama server via the Vercel AI SDK and the `ollama-ai-provider` library.

## Current Status: Manual Setup Required

**Important:** The Ollama server is **not yet integrated** into our primary `docker-compose.yml` file. To use AI features that rely on local models, you must download and run the Ollama application on your host machine separately.

1.  **Download and Install:** Get the Ollama application for your operating system from the [official Ollama website](https://ollama.com/).
2.  **Run Ollama:** Ensure the Ollama application is running in the background.
3.  **Pull a Model:** To use a model like Llama 3, you must first pull it from the Ollama library. Open your terminal and run:
    ```bash
    ollama pull llama3
    ```

The Ollama server will then be running at its default address, `http://localhost:11434`.

## How It's Used in Our Code

Our application is designed to seamlessly switch between different AI providers (like Google) and our local Ollama instance.

### Model Selection

We use a simple string format, `"provider:model"`, to specify which AI model to use. To use a local Ollama model, you would use a string like:

-   `"ollama:llama3"`
-   `"ollama:codellama"`

### Backend Integration

Our API routes use a shared helper function, [`createModelInstance`](apps/web/src/app/api/ai/shared/models.ts:9), to get the correct AI model provider. When this function receives a model string starting with `"ollama:"`, it uses the `createOllama` function from the `ollama-ai-provider` library.

```typescript
// apps/web/src/app/api/ai/shared/models.ts
import { createOllama } from 'ollama-ai-provider';

export function createModelInstance(model: string) {
  const [providerName, modelName] = model.split(':');

  if (providerName === 'ollama') {
    // This assumes Ollama is running at its default address
    const ollama = createOllama();
    return ollama(modelName);
  }
  // ... other providers
}
```

The `createOllama()` function automatically defaults to connecting to `http://localhost:11434`, which is why the manual setup is currently required.

## Future Work

A key planned enhancement is to add Ollama as a service within our [`docker-compose.yml`](docker-compose.yml:1) file. This will remove the need for manual setup and ensure that the Ollama server starts automatically with the rest of the application stack, further streamlining the local development experience.