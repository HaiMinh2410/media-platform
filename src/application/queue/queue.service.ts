import { webhookQueue } from '@/infrastructure/queue/bullmq.provider';
import { WebhookJobPayload } from '@/domain/types/queue';

/**
 * Service to manage job enqueuing for background processing.
 * Wraps BullMQ instances and provides a clean interface for application logic.
 */
export class QueueService {
  /**
   * Enqueues a webhook event for processing.
   * Uses the webhookEventId as the job ID to ensure idempotency.
   * 
   * @param payload - Structured data about the webhook event
   * @returns { data: jobId | null, error: string | null }
   */
  async enqueueWebhookProcessing(payload: WebhookJobPayload): Promise<{ data: string | null; error: string | null }> {
    try {
      if (!webhookQueue) {
        console.error('[QueueService] webhookQueue is not initialized. Check Redis connection.');
        return { data: null, error: 'QUEUE_NOT_INITIALIZED' };
      }

      // Add job to queue
      // Name the job after the platform for better visibility in dashboard/monitoring
      const job = await webhookQueue.add(
        payload.platform, 
        payload,
        { 
          jobId: payload.webhookEventId, // Idempotency: same event ID won't be queued twice
        }
      );

      return { data: job.id ?? null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown queue error';
      console.error(`[QueueService] Failed to enqueue job: ${message}`);
      return { data: null, error: message };
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
