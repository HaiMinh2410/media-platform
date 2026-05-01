// src/infrastructure/meta/meta-messaging.client.ts
import { MetaSendApiResponse, SendMessageResult } from '@/domain/types/messaging';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/**
 * Low-level HTTP client for Meta Graph API Send Message endpoint.
 * No business logic — pure HTTP wrapper.
 * Docs: https://developers.facebook.com/docs/messenger-platform/send-messages
 */
export const metaMessagingClient = {
  /**
   * Sends a text message via Meta Graph API.
   * Works for both Messenger (PSID) and Instagram (IGSID).
   */
  async sendTextMessage(
    pageId: string,
    recipientId: string,
    text: string,
    accessToken: string
  ): Promise<SendMessageResult> {
    // Using explicit Page ID in URL to ensure we send from the correct Page
    // /me/messages works too but is ambiguous with System User tokens
    const url = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const body = {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body),
      });

      const json = await response.json() as MetaSendApiResponse & { error?: { message: string; code: number } };

      if (!response.ok) {
        const errMsg = json.error?.message ?? `META_SEND_FAILED (HTTP ${response.status})`;
        console.error('[MetaMessagingClient] Send failed:', errMsg);
        return { data: null, error: errMsg };
      }

      return {
        data: {
          messageId: json.message_id,
          recipientId: json.recipient_id,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'NETWORK_ERROR';
      console.error('[MetaMessagingClient] Network error:', err);
      return { data: null, error: message };
    }
  },
};
