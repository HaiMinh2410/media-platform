// src/application/ai/classify.service.ts
import { z } from 'zod';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { PROMPTS } from '@/application/ai/prompt-templates';
import { AI_MODELS } from '@/domain/types/ai';
import {
  ClassifyInput,
  ClassifyServiceResult,
  ClassifyResult,
} from '@/domain/types/ai-pipeline';

/**
 * Zod schema for validating the AI model's JSON output.
 * Acts as a runtime guard if the model returns an unexpected shape.
 */
const ClassifyResultSchema = z.object({
  intent: z.enum(['AUTO_REPLY', 'SUGGESTION', 'ESCALATE', 'NO_ACTION']),
  reason: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.enum(['sales', 'support', 'feedback', 'other']),
});

/**
 * AI Classification Service
 * Classifies an incoming message and returns a routing intent.
 *
 * Flow: build messages → call Groq (JSON mode) → validate schema → return result
 */
export const classifyService = {
  /**
   * Classifies a single message text into an intent + metadata.
   */
  async classify(input: ClassifyInput): Promise<ClassifyServiceResult> {
    const { text, platform } = input;

    const template = PROMPTS.CLASSIFY_MESSAGE;

    // Build a context-aware user prompt, optionally including platform hint
    const userContent = platform
      ? `${template.user({ text })}\nPlatform: ${platform}`
      : template.user({ text });

    const messages = [
      { role: 'system' as const, content: template.system },
      { role: 'user' as const, content: userContent },
    ];

    // Step 1: Call Groq with JSON mode enforced
    const { data: completion, error: groqError } = await groqClient.complete(
      messages,
      {
        model: AI_MODELS.CLASSIFY,
        temperature: 0.1,
        maxTokens: 512,
        jsonMode: true,
      }
    );

    if (groqError || !completion) {
      return { data: null, error: `GROQ_CLASSIFY_FAILED: ${groqError}` };
    }

    // Step 2: Parse and validate the JSON response
    let parsed: unknown;
    try {
      parsed = JSON.parse(completion.content);
    } catch {
      console.error('[ClassifyService] Failed to parse Groq JSON response:', completion.content);
      return { data: null, error: 'CLASSIFY_PARSE_ERROR: Invalid JSON from model' };
    }

    // Step 3: Validate structure with Zod
    const validated = ClassifyResultSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('[ClassifyService] Zod validation failed:', validated.error.flatten());
      return {
        data: null,
        error: `CLASSIFY_SCHEMA_ERROR: ${JSON.stringify(validated.error.flatten().fieldErrors)}`,
      };
    }

    const result: ClassifyResult = validated.data;
    return { data: result, error: null };
  },
};
