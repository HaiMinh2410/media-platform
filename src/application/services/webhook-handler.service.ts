import { PrismaClient, Prisma } from '.prisma/client';
import { db } from '@/lib/db';

/**
 * Service to handle incoming webhook events from various platforms.
 * Responsible for logging raw payloads and initial orchestration.
 */
export class WebhookHandlerService {
  /**
   * Persists the raw webhook event to platform_event_logs table.
   * This is critical for auditability and replayability.
   * 
   * @param platform The platform name (e.g., 'meta', 'tiktok')
   * @param payload The raw JSON payload
   * @param headers Relevant headers (optional)
   */
  async logEvent(platform: string, payload: any, headers: any = {}): Promise<{ data: any; error: string | null }> {
    try {
      // @ts-ignore - Prisma property is generated but not yet reflected in IDE/TS server types
      const logEntry = await (db as unknown as { platformEventLog: { create: Function } }).platformEventLog.create({
        data: {
          platform,
          payload: payload as Prisma.InputJsonValue,
          headers: headers as Prisma.InputJsonValue,
          status: 'received',
        },
      });

      return { data: logEntry, error: null };
    } catch (err: any) {
      console.error(`[WebhookHandlerService] Failed to log ${platform} event:`, err);
      return { data: null, error: err.message || 'DATABASE_ERROR' };
    }
  }
}

// Export singleton instance
export const webhookHandler = new WebhookHandlerService();
