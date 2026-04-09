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
      // We log even if we don't know the exact structure yet (JSONB)
      const logEntry = await db.platformEventLog.create({
        data: {
          platform,
          payload,
          headers,
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
