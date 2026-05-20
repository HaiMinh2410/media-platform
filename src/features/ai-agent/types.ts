// src/features/ai-agent/types.ts

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

/**
 * A canonical customer identity that may span multiple platforms.
 * When the same person contacts via Facebook Messenger AND Instagram,
 * they share one CustomerIdentity that links both conversations.
 */
export type CustomerIdentity = {
  id: string;
  workspaceId: string;
  /** The "primary" external sender ID used as the canonical key */
  canonicalExternalId: string;
  customerName: string | null;
  customerAvatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A single platform binding for a CustomerIdentity.
 * One identity may have many platform mappings (fb + ig).
 */
export type CustomerPlatformMapping = {
  id: string;
  identityId: string;
  platform: string;
  externalSenderId: string;
  conversationId: string;
};

/**
 * Input for checking/registering a sender in the identity system.
 */
export type DuplicateCheckInput = {
  workspaceId: string;
  platform: string;
  externalSenderId: string;
  conversationId: string;
  customerName?: string | null;
  customerAvatar?: string | null;
};

/**
 * Result of a duplicate detection check.
 */
export type DuplicateCheckResult = {
  data: {
    identityId: string;
    /** True if this sender was already linked to an existing identity from another platform */
    isCrossChannelMatch: boolean;
    /** The canonical conversation (oldest/primary for this identity) */
    canonicalConversationId: string;
    /** All conversation IDs linked to this identity (including the current one) */
    linkedConversationIds: string[];
  } | null;
  error: string | null;
};

/**
 * Summary of a linked identity for display/API purposes.
 */
export type LinkedIdentitySummary = {
  identityId: string;
  customerName: string | null;
  customerAvatar: string | null;
  platforms: Array<{
    platform: string;
    externalSenderId: string;
    conversationId: string;
  }>;
};
