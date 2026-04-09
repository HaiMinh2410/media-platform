import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { MetaWebhookPayload } from '@/domain/types/meta-webhook';
import { metaParser } from '@/infrastructure/meta/meta-parser.service';

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
   */
  async ingestMeta(payload: MetaWebhookPayload, headers: any = {}): Promise<{ data: any; error: string | null }> {
    try {
      // 1. Parse the complex payload into a list of normalized events
      const events = metaParser.parse(payload, headers);

      if (events.length === 0) {
        return { data: { count: 0 }, error: null };
      }

      // @ts-ignore - Prisma property is generated but not yet reflected in IDE/TS server types
      const result = await (db as unknown as { webhookEvent: { createMany: Function } }).webhookEvent.createMany({
        data: events.map(event => ({
          platform: event.platform,
          externalSenderId: event.externalSenderId,
          externalPageId: event.externalPageId,
          messageText: event.messageText,
          payload: event.rawPayload as Prisma.InputJsonValue,
          headers: event.headers as Prisma.InputJsonValue,
          receivedAt: event.receivedAt,
        })),
      });

      return { data: result, error: null };
    } catch (err: any) {
      console.error('[WebhookIngestionService] Meta ingestion error:', err);
      return { data: null, error: err.message || 'INGESTION_FAILED' };
    }
  }
}

export const webhookIngestion = new WebhookIngestionService();
