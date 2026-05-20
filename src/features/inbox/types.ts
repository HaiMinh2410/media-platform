// src/features/inbox/types.ts

/**
 * Supported messaging platforms.
 */
export type MessagingPlatform = 'facebook' | 'instagram' | 'messenger';

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
 * Advanced Inbox Message types
 */
export type AttachmentType = 'image' | 'video' | 'file' | 'audio';

export type MessageAttachment = {
  type: AttachmentType;
  payload: {
    url: string;
    title?: string;
    fileSize?: number;
  };
};

export type MessageReaction = {
  senderId: string;
  reaction: string;
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
  attachments?: MessageAttachment[] | null;
  parentMessageId?: string | null;
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
  search?: string;
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
  tag?: string;
};

/**
 * Sort parameters for conversation list.
 */
export type SortOrder = 'asc' | 'desc';

export type ConversationSortField = 'lastMessageAt' | 'priority' | 'status' | 'sentiment' | 'customer_name';

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
  tags?: string[];
  is_pinned?: boolean;
  last_message_sender_type?: 'user' | 'agent' | 'ai' | null;
  last_message_sender_id?: string | null;
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
  attachments?: MessageAttachment[] | null;
  reactions?: MessageReaction[] | null;
  parentMessageId?: string | null;
  parentMessage?: MessageWithSender | null;
  is_pinned?: boolean;
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

/**
 * Meta Webhook Types
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks
 */
export type MetaWebhookObject = 'page' | 'instagram' | 'whatsapp_business_account' | 'user';

export interface MetaWebhookPayload {
  object: MetaWebhookObject;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string; // UID of the object (Page ID, IG User ID, etc.)
  time: number;
  messaging?: MetaMessagingEvent[];
  changes?: MetaWebhookChange[];
}

export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: any[];
    reply_to?: { mid: string };
    is_echo?: boolean;
    app_id?: number;
  };
  postback?: {
    title: string;
    payload: string;
    referral?: any;
  };
  read?: {
    watermark: number;
  };
  delivery?: {
    mids: string[];
    watermark: number;
  };
  reaction?: {
    mid: string;
    action: 'react' | 'unreact';
    emoji: string;
    reaction: string;
  };
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen';
}

export interface MetaWebhookChange {
  field: string;
  value: any;
}

/**
 * Hub Verification Types (for GET request)
 */
export interface MetaHubVerification {
  mode: string;
  verifyToken: string;
  challenge: string;
}
import { WebhookPlatform, WebhookEventType } from '@shared/types/webhooks';
export type { WebhookPlatform, WebhookEventType };

/**
 * Represents a normalized webhook event after being parsed from platform-specific payloads.
 */
export interface ParsedWebhookEvent {
  /** The platform that sent the webhook */
  platform: WebhookPlatform;

  /** The type of event (message, read receipt, etc.) */
  eventType: WebhookEventType;

  /** The ID of the user who sent the message (from the platform's perspective) */
  externalSenderId: string;

  /** The ID of the page/account that received the message (from the platform's perspective) */
  externalPageId: string;

  /** The ID of the message generated by the platform */
  platformMessageId: string;

  /** The text content of the message (if applicable) */
  messageText: string | null;

  /** The original raw payload from the platform */
  rawPayload: any;

  /** The headers received with the webhook request */
  headers: any;

  /** When the event occurred (from platform timestamp or current time) */
  receivedAt: Date;

  /** Whether this is an echo of a message sent by the page/account itself */
  isEcho?: boolean;

  /** Advanced Inbox: ID of the message being replied to (for reply threading) */
  parentMessageId?: string | null;

  /** Advanced Inbox: media files attached to the message */
  attachments?: MessageAttachment[] | null;

  /** Advanced Inbox: Reaction event details */
  reactionData?: {
    action: 'react' | 'unreact';
    emoji: string;
    parentMessageId: string;
  } | null;
}

/**
 * Result of a parsing operation
 */
export type WebhookParseResult = {
  data: ParsedWebhookEvent | null;
  error: string | null;
};
