// src/application/ai/generate.service.ts
import { groqClient } from '@/infrastructure/ai/groq-client';
import { PROMPTS } from '@/application/ai/prompt-templates';
import { AI_MODELS } from '@/domain/types/ai';
import {
  GenerateInput,
  GenerateServiceResult,
} from '@/domain/types/ai-pipeline';

// Intents that should never produce a generated reply
const NON_REPLY_INTENTS = ['NO_ACTION', 'ESCALATE'] as const;

/**
 * Builds a category-aware system prompt suffix to guide reply tone.
 */
function buildSystemContext(category: string, intent: string): string {
  const toneMap: Record<string, string> = {
    sales: 'Focus on helping the user find the right product or service.',
    support: 'Focus on resolving the user\'s issue empathetically and efficiently.',
    feedback: 'Acknowledge the feedback warmly and thank the user.',
    other: 'Be helpful and professional.',
  };

  const tone = toneMap[category] ?? toneMap['other'];
  return `\nContext: This is a "${intent}" message in the "${category}" category. ${tone}`;
}

/**
 * AI Generation Service
 * Generates a reply text for an incoming message, using classify context.
 *
 * Flow:
 *   1. Guard: NO_ACTION / ESCALATE → no reply generated
 *   2. Build system prompt with category/intent context
 *   3. Call Groq (plain text mode, larger model)
 *   4. Return { reply, intent }
 */
export const generateService = {
  /**
   * Generates a reply for a classified message.
   * Returns { data: null, error: null } for NO_ACTION — caller should check intent.
   */
  async generate(input: GenerateInput): Promise<GenerateServiceResult> {
    const { text, classifyResult, history, platform } = input;
    const { intent, category } = classifyResult;

    // Step 1: Early return for intents that should not trigger auto-generation
    if ((NON_REPLY_INTENTS as readonly string[]).includes(intent)) {
      return {
        data: {
          reply: '',
          intent,
        },
        error: null,
      };
    }

    const template = PROMPTS.GENERATE_REPLY;

    // Step 2: Build a context-enriched system prompt
    const systemContent = template.system + buildSystemContext(category, intent);

    // Step 3: Build user message with optional conversation history
    const userContent = template.user({ text, history });

    // Step 4: Optionally prepend platform context
    const finalUserContent = platform
      ? `${userContent}\nPlatform: ${platform}`
      : userContent;

    // Step 5: Call Groq — plain text output
    // Use custom systemPrompt and model if provided, otherwise fallback to defaults
    const finalSystemContent = input.systemPrompt 
      ? input.systemPrompt + "\n" + buildSystemContext(category, intent)
      : systemContent;

    const { data: completion, error: groqError } = await groqClient.complete(
      [
        { role: 'system' as const, content: finalSystemContent },
        { role: 'user' as const, content: finalUserContent },
      ],
      {
        model: input.model || AI_MODELS.GENERATE,
        temperature: 0.4,
        maxTokens: 256,
        jsonMode: false,
      }
    );

    if (groqError || !completion) {
      return { data: null, error: `GROQ_GENERATE_FAILED: ${groqError}` };
    }

    const reply = completion.content.trim();

    if (!reply) {
      return { data: null, error: 'GENERATE_EMPTY_REPLY: Model returned empty content' };
    }

    return {
      data: { reply, intent },
      error: null,
    };
  },
};
