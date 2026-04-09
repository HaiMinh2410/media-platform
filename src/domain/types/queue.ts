import { WebhookPlatform } from './webhooks';

/**
 * Payload for a webhook processing job in the queue.
 * This is what the Producer (API Route) sends and the Consumer (Worker) receives.
 */
export interface WebhookJobPayload {
  /** The internal ID of the logged event in webhook_events table */
  webhookEventId: string;
  
  /** The platform source */
  platform: WebhookPlatform;
  
  /** The platform's internal ID for the sender */
  externalSenderId: string;
  
  /** The platform's internal ID for the recipient (page/account) */
  externalPageId: string;
  
  /** Normalized message content */
  messageText: string | null;
  
  /** Timestamp of when the event was received */
  timestamp: string;
}

/**
 * Queue names used in the application.
 */
export enum QueueName {
  WEBHOOK_EVENTS = 'webhook-events',
  ANALYTICS_SYNC = 'analytics-sync',
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
