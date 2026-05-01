// src/domain/types/messaging.ts

/**
 * Supported messaging platforms.
 */
export type MessagingPlatform = 'messenger' | 'instagram';

/**
 * Input for a send-message operation.
 * encryptedToken follows the AES-256-GCM format: iv:authTag:ciphertext
 */
export type SendMessageInput = {
  recipientId: string;        // PSID (Facebook) or IGSID (Instagram)
  pageId: string;             // The page/account sending the message
  encryptedToken: string;     // AES-256-GCM encrypted page access token
  text: string;
  platform: MessagingPlatform;
};

/**
 * Result of a send-message operation.
 */
export type SendMessageResult = {
  data: {
    messageId: string;
    recipientId: string;
  } | null;
  error: string | null;
};

/**
 * Raw Meta Graph API /messages response shape.
 */
export type MetaSendApiResponse = {
  message_id: string;
  recipient_id: string;
};

/**
 * Input for persisting an incoming or outgoing message idempotently.
 */
export type PersistMessageInput = {
  platform: string;
  externalPageId: string;     // Meta/TikTok page ID
  externalSenderId: string;   // The user we are chatting with
  platformMessageId: string;  // The ID of the message from the platform
  messageText: string;
  senderType: 'user' | 'agent' | 'ai';
  timestamp?: Date;           // Optional, defaults to now. Should receive webhook standard timestamp.
};

/**
 * Result of persisting a message idempotently.
 * isNewMessage indicates if the message was newly inserted (true) or already existed (false).
 */
export type PersistMessageResult = {
  data: {
    messageId: string;
    conversationId: string;
    isNewMessage: boolean;
  } | null;
  error: string | null;
};

/**
 * Pagination parameters for list endpoints.
 */
export type PaginationParams = {
  limit?: number;
  cursor?: string;
};

/**
 * Filter for conversation list.
 */
export type ConversationFilter = {
  workspaceId: string;
  groupId?: string;
  accountId?: string;
  identityId?: string;
  platform?: string;
  status?: string;
  search?: string;
  unread?: boolean;
  priority?: string;
  sentiment?: string;
  is_vip?: boolean;
  show_duplicates?: boolean;
};

/**
 * Sort parameters for conversation list.
 */
export type SortOrder = 'asc' | 'desc';

export type ConversationSortField = 'lastMessageAt' | 'priority' | 'status' | 'sentiment';

export type ConversationSort = {
  field: ConversationSortField;
  order: SortOrder;
};

/**
 * Shared message data for list views.
 */
export type ConversationWithLastMessage = {
  id: string;
  platform_conversation_id: string;
  last_message_at: Date;
  status: string | null;
  platform: string;
  sender_name: string;
  customer_avatar: string | null;
  last_message_content: string;
  unread_count: number;
  priority?: string | null;
  sentiment?: string | null;
  is_vip?: boolean;
  canonical_conversation_id?: string | null;
  identity_id?: string | null;
  ai_replied?: boolean;
};

/**
 * Message with sender info for chat history.
 */
export type MessageWithSender = {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'ai';
  createdAt: Date;
  is_read?: boolean;
  is_delivered?: boolean;
};

/**
 * Input for the agent reply endpoint.
 */
export type ReplyInput = {
  conversationId: string;
  text: string;
};

/**
 * Result of the agent reply endpoint.
 */
export type ReplyResult = {
  data: {
    messageId: string;        // internal DB message ID
    platformMessageId: string; // Meta message ID returned from Graph API
  } | null;
  error: string | null;
};

/**
 * Result of the mark-as-read endpoint.
 */
export type MarkReadResult = {
  data: {
    updatedCount: number;
  } | null;
  error: string | null;
};

/**
 * A single AI-generated reply suggestion from ai_reply_logs.
 */
export type AiSuggestion = {
  id: string;
  messageId: string;
  model: string;
  prompt: string;
  response: string;
  status: string;
  createdAt: string;
};
