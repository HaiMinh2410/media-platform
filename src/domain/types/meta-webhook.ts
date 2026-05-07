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
