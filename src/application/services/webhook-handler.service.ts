import { Prisma } from '@prisma/client';
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
      const logEntry = await db.platformEventLog.create({
        data: {
          platform,
          payload: (payload || {}) as Prisma.InputJsonValue,
          headers: (headers || {}) as Prisma.InputJsonValue,
          status: 'received',
        },
      });

      return { data: logEntry, error: null };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[WebhookHandlerService] Failed to log ${platform} event:`, message);
      return { data: null, error: message || 'DATABASE_ERROR' };
    }
  }
}

// Export singleton instance
export const webhookHandler = new WebhookHandlerService();
