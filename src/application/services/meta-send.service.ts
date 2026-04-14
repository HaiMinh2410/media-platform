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
};
