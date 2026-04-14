// src/domain/types/ai-pipeline.ts

/**
 * Possible routing intents for an incoming message.
 */
export type MessageIntent =
  | 'AUTO_REPLY'   // Can be handled automatically
  | 'SUGGESTION'   // Needs a human agent with a draft suggestion
  | 'ESCALATE'     // Urgent — immediate human attention required
  | 'NO_ACTION';   // Spam, bot, or no response needed

export type MessagePriority = 'low' | 'medium' | 'high';

export type MessageCategory = 'sales' | 'support' | 'feedback' | 'other';

/**
 * Structured classification output from the AI model.
 */
export type ClassifyResult = {
  intent: MessageIntent;
  reason: string;
  priority: MessagePriority;
  category: MessageCategory;
};

/**
 * Input for the classify service.
 */
export type ClassifyInput = {
  text: string;       // Raw message text to classify
  platform?: string;  // Optional context: 'messenger' | 'instagram'
};

/**
 * Service-level return type following { data, error } pattern.
 */
export type ClassifyServiceResult = {
  data: ClassifyResult | null;
  error: string | null;
};

// ---------------------------------------------------------------------------
// Generation types (T042)
// ---------------------------------------------------------------------------

/**
 * Input for the generate service.
 * Requires classifyResult from T041 to contextualise the reply.
 */
export type GenerateInput = {
  text: string;                    // Original user message
  classifyResult: ClassifyResult;  // Routing context from classify step
  history?: string[];              // Optional: last N conversation turns
  platform?: string;               // Optional: 'messenger' | 'instagram'
};

/**
 * Service-level return type for generation.
 */
export type GenerateServiceResult = {
  data: {
    reply: string;
    intent: MessageIntent;  // Forwarded from classifyResult for convenience
  } | null;
  error: string | null;
};
