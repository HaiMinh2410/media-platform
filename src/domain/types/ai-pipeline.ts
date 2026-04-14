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
