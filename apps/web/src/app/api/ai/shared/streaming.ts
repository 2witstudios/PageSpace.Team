import { streamText, CoreMessage, tool, LanguageModelV1, ToolSet } from 'ai';
import { z } from 'zod';

/**
 * Common system prompt builder for different AI contexts
 */
export function buildSystemPrompt(context: {
  pageTitle?: string;
  pageContent?: string;
  mentionedPagesContent?: string;
  isAssistant?: boolean;
}) {
  if (context.isAssistant && context.pageTitle) {
    // Assistant AI system prompt with page context
    return `You are an AI assistant. The user is currently viewing a page titled "${context.pageTitle}".
    Here is the content of the page:
    ---
    ${context.pageContent || 'No content available.'}
    ---
    ${context.mentionedPagesContent ? `\nThe user has also mentioned the following pages, here is their content:\n${context.mentionedPagesContent}` : ''}
    Keep your answers concise and relevant to the user's query and the provided page context.`;
  }

  // Page AI system prompt with optional customization
  return context.pageContent || 'You are a helpful and friendly AI assistant. Answer the questions in a concise and accurate manner.';
}

/**
 * Common tools available across AI implementations
 * Currently includes weather tool - can be extended
 */
export const commonTools = {
  getWeather: tool({
    description: 'Get the weather in a location',
    parameters: z.object({
      location: z.string().describe('The location to get the weather for'),
    }),
    execute: async ({ location }) => {
      // Simulate fetching weather data
      const temperature = Math.round(Math.random() * (90 - 32) + 32);
      return {
        location,
        temperature,
        message: `The weather in ${location} is currently ${temperature}°F.`,
      };
    },
  }),
};

/**
 * Common streaming configuration
 * Extracted from existing working implementations
 */
export function createStreamConfig(params: {
  model: LanguageModelV1;
  systemPrompt: string;
  messages: CoreMessage[];
  temperature?: number;
  tools?: ToolSet;
  onFinish?: (result: { text: string; toolCalls: unknown; toolResults: unknown }) => Promise<void>;
}) {
  return streamText({
    model: params.model,
    system: params.systemPrompt,
    messages: params.messages,
    temperature: params.temperature || 0.7,
    tools: params.tools || commonTools,
    onFinish: params.onFinish,
  });
}