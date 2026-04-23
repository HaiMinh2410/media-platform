// src/domain/types/ai.ts

/**
 * Supported Groq AI model identifiers.
 *
 * Selection guide:
 * - CLASSIFY  → llama-3.1-8b-instant  : nhanh nhất, latency thấp, phù hợp classify/routing
 * - GENERATE  → llama-3.3-70b-versatile: cân bằng tốc độ/chất lượng, default production
 * - CONVERSATION → qwen-qwq-32b        : context 32k, multilingual mạnh
 * - REASONING → openai/gpt-oss-120b    : reasoning nâng cao, long-context, coding
 */
export type AIModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'qwen-qwq-32b'
  | 'openai/gpt-oss-120b';

export const AI_MODELS: Record<string, AIModel> = {
  /** Nhanh nhất, rẻ nhất — dùng cho classify / intent routing */
  CLASSIFY: 'llama-3.1-8b-instant',
  /** Cân bằng tốc độ/chất lượng — default cho generate replies */
  GENERATE: 'llama-3.3-70b-versatile',
  /** Context 32k, multilingual mạnh — dùng cho hội thoại dài */
  CONVERSATION: 'qwen-qwq-32b',
  /** Reasoning + long-context + coding — dùng cho tác vụ phức tạp */
  REASONING: 'openai/gpt-oss-120b',
};

export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIChatOptions = {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export type AICompletionResult = {
  data: {
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  } | null;
  error: string | null;
};

export type PromptTemplate = {
  system: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: (context: any) => string;
};
