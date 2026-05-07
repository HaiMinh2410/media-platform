// src/application/services/meta-send.service.ts
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { metaMessagingClient } from '@/infrastructure/meta/meta-messaging.client';
import { SendMessageInput, SendMessageResult } from '@/domain/types/messaging';

/**
 * Application service for sending messages via Meta platforms.
 * Orchestrates: token decryption → API call.
 *
 * This is the only entry point for sending replies.
 * Callers must NOT handle raw tokens — this service decrypts internally.
 */
export const metaSendService = {
  /**
   * Sends a text reply to a user on Messenger or Instagram.
   * Accepts an encrypted token and decrypts it server-side before use.
   */
  async sendText(input: SendMessageInput): Promise<SendMessageResult> {
    const { recipientId, pageId, encryptedToken, text, platform } = input;

    // Step 1: Decrypt the page access token
    const encryptionService = getTokenEncryptionService();
    const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !plainToken) {
      console.error(`[MetaSendService] Failed to decrypt token for page ${pageId}:`, decryptError);
      return { data: null, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
    }

    // Step 2: Delegate to the HTTP client
    const result = await metaMessagingClient.sendTextMessage(
      pageId,
      recipientId,
      text,
      plainToken
    );

    if (result.error) {
      console.error(
        `[MetaSendService] Failed to send ${platform} message to ${recipientId}:`,
        result.error
      );
    }

    return result;
  },

  /**
   * Sends a file/media attachment reply to a user on Messenger or Instagram.
   */
  async sendAttachment(
    input: SendMessageInput & { attachmentType: 'image' | 'video' | 'audio' | 'file'; url: string }
  ): Promise<SendMessageResult> {
    const { recipientId, pageId, encryptedToken, attachmentType, url, platform } = input;

    const encryptionService = getTokenEncryptionService();
    const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !plainToken) {
      console.error(`[MetaSendService] Failed to decrypt token for page ${pageId}:`, decryptError);
      return { data: null, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
    }

    const result = await metaMessagingClient.sendAttachmentMessage(
      pageId,
      recipientId,
      attachmentType,
      url,
      plainToken
    );

    if (result.error) {
      console.error(
        `[MetaSendService] Failed to send ${platform} attachment to ${recipientId}:`,
        result.error
      );
    }

    return result;
  },

  /**
   * Sends a text reply citing/referencing another message to create a reply thread.
   */
  async sendTextWithReply(
    input: SendMessageInput & { replyToMessageId: string }
  ): Promise<SendMessageResult> {
    const { recipientId, pageId, encryptedToken, text, replyToMessageId, platform } = input;

    const encryptionService = getTokenEncryptionService();
    const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !plainToken) {
      console.error(`[MetaSendService] Failed to decrypt token for page ${pageId}:`, decryptError);
      return { data: null, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
    }

    const result = await metaMessagingClient.sendTextMessageWithReply(
      pageId,
      recipientId,
      text,
      replyToMessageId,
      plainToken
    );

    if (result.error) {
      console.error(
        `[MetaSendService] Failed to send ${platform} reply-quote message to ${recipientId}:`,
        result.error
      );
    }

    return result;
  },

  /**
   * Sends a sender action (typing indicator, mark seen) to a user on Messenger or Instagram.
   */
  async sendSenderAction(
    input: Omit<SendMessageInput, 'text'> & { action: 'typing_on' | 'typing_off' | 'mark_seen' }
  ): Promise<SendMessageResult> {
    const { recipientId, pageId, encryptedToken, action, platform } = input;

    const encryptionService = getTokenEncryptionService();
    const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !plainToken) {
      console.error(`[MetaSendService] Failed to decrypt token for page ${pageId}:`, decryptError);
      return { data: null, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
    }

    const result = await metaMessagingClient.sendSenderAction(
      pageId,
      recipientId,
      action,
      plainToken
    );

    if (result.error) {
      console.error(
        `[MetaSendService] Failed to send ${platform} sender action (${action}) to ${recipientId}:`,
        result.error
      );
    }

    return result;
  },

  /**
   * Sends a message reaction (emoji) to a user on Messenger or Instagram.
   */
  async sendReaction(
    input: Omit<SendMessageInput, 'text'> & { messageId: string; reaction: string }
  ): Promise<SendMessageResult> {
    const { recipientId, pageId, encryptedToken, messageId, reaction, platform } = input;

    const encryptionService = getTokenEncryptionService();
    const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !plainToken) {
      console.error(`[MetaSendService] Failed to decrypt token for page ${pageId}:`, decryptError);
      return { data: null, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
    }

    const result = await metaMessagingClient.sendReaction(
      pageId,
      recipientId,
      messageId,
      reaction,
      plainToken
    );

    if (result.error) {
      console.error(
        `[MetaSendService] Failed to send ${platform} reaction (${reaction}) to ${recipientId}:`,
        result.error
      );
    }

    return result;
  },
};
