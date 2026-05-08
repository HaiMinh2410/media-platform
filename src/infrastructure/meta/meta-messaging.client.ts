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

  /**
   * Sends an attachment (image, video, audio, file) via Meta Graph API.
   */
  async sendAttachmentMessage(
    pageId: string,
    recipientId: string,
    attachmentType: 'image' | 'video' | 'audio' | 'file',
    url: string,
    accessToken: string
  ): Promise<SendMessageResult> {
    const apiURL = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const body = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: attachmentType,
          payload: {
            url,
            is_reusable: true,
          },
        },
      },
      messaging_type: 'RESPONSE',
    };

    try {
      const response = await fetch(apiURL, {
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
        console.error('[MetaMessagingClient] Send attachment failed:', errMsg);
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
      console.error('[MetaMessagingClient] Network error on attachment send:', err);
      return { data: null, error: message };
    }
  },

  /**
   * Sends a text message citing a parent message as a reply via Meta Graph API.
   */
  async sendTextMessageWithReply(
    pageId: string,
    recipientId: string,
    text: string,
    replyToMessageId: string,
    accessToken: string
  ): Promise<SendMessageResult> {
    const apiURL = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const body = {
      recipient: { id: recipientId },
      message: {
        text,
      },
      reply_to: {
        mid: replyToMessageId,
      },
      messaging_type: 'RESPONSE',
    };

    try {
      const response = await fetch(apiURL, {
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
        console.error('[MetaMessagingClient] Send message with reply failed:', errMsg);
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
      console.error('[MetaMessagingClient] Network error on message with reply send:', err);
      return { data: null, error: message };
    }
  },

  /**
   * Sends a sender action (typing_on, typing_off, mark_seen) via Meta Graph API.
   */
  async sendSenderAction(
    pageId: string,
    recipientId: string,
    action: 'typing_on' | 'typing_off' | 'mark_seen',
    accessToken: string
  ): Promise<SendMessageResult> {
    const apiURL = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const body = {
      recipient: { id: recipientId },
      sender_action: action,
    };

    try {
      const response = await fetch(apiURL, {
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
        console.error('[MetaMessagingClient] Send sender action failed:', errMsg);
        return { data: null, error: errMsg };
      }

      return {
        data: {
          messageId: json.message_id || `act_${Date.now()}`,
          recipientId: json.recipient_id || recipientId,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'NETWORK_ERROR';
      console.error('[MetaMessagingClient] Network error on sender action send:', err);
      return { data: null, error: message };
    }
  },

  /**
   * Sends a message reaction via Meta Graph API.
   */
  async sendReaction(
    pageId: string,
    recipientId: string,
    messageId: string,
    reaction: string,
    accessToken: string
  ): Promise<SendMessageResult> {
    const apiURL = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const body = {
      recipient: { id: recipientId },
      message: {
        reaction: {
          action: reaction ? 'react' : 'unreact',
          mid: messageId,
          emoji: reaction,
        },
      },
      messaging_type: 'RESPONSE',
    };

    try {
      const response = await fetch(apiURL, {
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
        console.error('[MetaMessagingClient] Send reaction failed:', errMsg);
        return { data: null, error: errMsg };
      }

      return {
        data: {
          messageId: json.message_id || `react_${Date.now()}`,
          recipientId: json.recipient_id || recipientId,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'NETWORK_ERROR';
      console.error('[MetaMessagingClient] Network error on reaction send:', err);
      return { data: null, error: message };
    }
  },
};
