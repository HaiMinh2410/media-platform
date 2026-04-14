// src/infrastructure/ai/groq-client.ts
import Groq from 'groq-sdk';
import { AIMessage, AIChatOptions, AICompletionResult, AI_MODELS } from '@/domain/types/ai';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Groq AI Client Wrapper
 * Implements { data, error } pattern and follows project constants.
 */
export const groqClient = {
  /**
   * Generates a completion from Groq AI
   */
  async complete(
    messages: AIMessage[],
    options: AIChatOptions = {}
  ): Promise<AICompletionResult> {
    try {
      const {
        model = AI_MODELS.CLASSIFY,
        temperature = 0.1,
        maxTokens = 1024,
        jsonMode = false,
      } = options;

      const response = await groq.chat.completions.create({
        messages: messages as Groq.Chat.ChatCompletionMessageParam[],
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return { data: null, error: 'Empty response from Groq' };
      }

      return {
        data: {
          content,
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error during Groq completion';
      console.error('[GroqClient] Error:', err);
      return { data: null, error: message };
    }
  },
};
