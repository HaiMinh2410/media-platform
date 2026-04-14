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
