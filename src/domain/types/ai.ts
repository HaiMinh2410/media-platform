// src/domain/types/ai.ts

export type AIModel =
  | 'llama3-8b-8192'
  | 'llama3-70b-8192'
  | 'mixtral-8x7b-32768'
  | 'gemma2-9b-it';

export const AI_MODELS: Record<string, AIModel> = {
  CLASSIFY: 'llama3-8b-8192',
  GENERATE: 'llama3-70b-8192',
  CONVERSATION: 'mixtral-8x7b-32768',
  SIMPLE: 'gemma2-9b-it',
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
