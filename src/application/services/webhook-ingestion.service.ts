import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { MetaWebhookPayload } from '@/domain/types/meta-webhook';
import { metaParser } from '@/infrastructure/meta/meta-parser.service';
import { queueService } from '@/application/queue/queue.service';

/**
 * Service to orchestrate the ingestion of webhook events.
 * Handles parsing and persistence into processed tables.
 */
export class WebhookIngestionService {
  /**
   * Processes a Meta webhook payload by parsing it and storing individual events.
   * 
   * @param payload Raw payload from Meta
   * @param headers Request headers
   * @param parentLogId Optional ID of the raw log in platform_event_logs
   */
  async ingestMeta(payload: MetaWebhookPayload, headers: any = {}, parentLogId?: string): Promise<{ data: any; error: string | null }> {
    try {
      // 1. Parse the complex payload into a list of normalized events
      const events = metaParser.parse(payload, headers);

      if (events.length === 0) {
        return { data: { count: 0 }, error: null };
      }

      // 2. Persist events to DB and collect their IDs
      const savedEvents = await Promise.all(
        events.map(async (event) => {
          return db.webhookEvent.create({
            data: {
              platform: event.platform,
              externalSenderId: event.externalSenderId,
              externalPageId: event.externalPageId,
              messageText: event.messageText,
              payload: event.rawPayload as Prisma.InputJsonValue,
              headers: event.headers as Prisma.InputJsonValue,
              receivedAt: event.receivedAt,
              parentLogId: parentLogId || null,
            },
            select: { id: true }
          });
        })
      );

      // 3. Enqueue for background processing
      const queueResults = await Promise.all(
        events.map((event, index) => {
          const dbEvent = savedEvents[index];
          return queueService.enqueueWebhookProcessing({
            webhookEventId: dbEvent.id,
            platform: event.platform,
            eventType: event.eventType,
            externalSenderId: event.externalSenderId,
            externalPageId: event.externalPageId,
            platformMessageId: event.platformMessageId,
            messageText: event.messageText,
            timestamp: event.receivedAt.toISOString(),
          });
        })
      );

      // Log any queuing errors but don't fail the request (data is safe in DB)
      const failedQueues = queueResults.filter(r => r.error);
      if (failedQueues.length > 0) {
        console.warn(`[WebhookIngestionService] ${failedQueues.length} jobs failed to enqueue.`);
      }

      return { data: { count: savedEvents.length, enqueued: queueResults.length - failedQueues.length }, error: null };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[WebhookIngestionService] Meta ingestion error:', message);
      return { data: null, error: message || 'INGESTION_FAILED' };
    }
  }
}

export const webhookIngestion = new WebhookIngestionService();
