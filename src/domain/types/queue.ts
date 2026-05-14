import { WebhookPlatform, WebhookEventType } from './webhooks';

/**
 * Payload for a webhook processing job in the queue.
 * This is what the Producer (API Route) sends and the Consumer (Worker) receives.
 */
export interface WebhookJobPayload {
  /** The internal ID of the logged event in webhook_events table */
  webhookEventId: string;
  
  /** The platform source */
  platform: WebhookPlatform;

  /** The type of event (message, read receipt, etc.) */
  eventType: WebhookEventType;
  
  /** The platform's internal ID for the sender */
  externalSenderId: string;
  
  /** The platform's internal ID for the recipient (page/account) */
  externalPageId: string;
  
  /** The platform's internal message ID */
  platformMessageId: string;

  /** Normalized message content */
  messageText: string | null;
  
  /** Timestamp of when the event was received */
  timestamp: string;

  /** Whether this is an echo message */
  isEcho?: boolean;

  /** Advanced Inbox: media files attached to the message */
  attachments?: any[] | null;

  /** Advanced Inbox: ID of the message being replied to (for reply threading) */
  parentMessageId?: string | null;

  /** Advanced Inbox: Reaction event details */
  reactionData?: {
    action: 'react' | 'unreact';
    emoji: string;
    parentMessageId: string;
  } | null;
}

/**
 * Queue names used in the application.
 */
export enum QueueName {
  WEBHOOK_EVENTS = 'webhook-events',
  ANALYTICS_SYNC = 'analytics-sync',
  AI_AGENT_METRICS = 'ai-agent-metrics',
  MEDIA_TRANSCODING = 'media-transcoding',
}

export interface MediaTranscodingJobPayload {
  mediaId: string;
  workspaceId: string;
  originalUrl: string;
  filePath: string;
}

/**
 * Standard Job Options for BullMQ.
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
