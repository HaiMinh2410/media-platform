import { MetaWebhookPayload } from '@/domain/types/meta-webhook';
import { ParsedWebhookEvent } from '@/domain/types/webhooks';

/**
 * Service to parse Meta (Facebook/Instagram) webhook payloads into a unified format.
 */
export class MetaParserService {
  /**
   * Parses a Meta webhook payload.
   * Note: A single webhook request can contain multiple entries and messaging events.
   * 
   * @param payload The raw JSON payload from Meta
   * @param headers The request headers
   * @returns An array of normalized ParsedWebhookEvent objects
   */
  parse(payload: MetaWebhookPayload, headers: any = {}): ParsedWebhookEvent[] {
    const events: ParsedWebhookEvent[] = [];

    // Safety check for payload structure
    if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
      return events;
    }

    // We primarily care about 'page' (Facebook) and 'instagram' objects for messaging
    if (payload.object !== 'page' && payload.object !== 'instagram') {
      return events;
    }

    for (const entry of payload.entry) {
      const pageId = entry.id; // The ID of the Page or IG account

      // Handle 'messaging' events (standard messages, postbacks, etc.)
      if (entry.messaging && Array.isArray(entry.messaging)) {
        for (const msg of entry.messaging) {
          // Skip echo messages (replies sent by the bot/page itself)
          if (msg.message?.is_echo) {
            continue;
          }

          events.push({
            platform: payload.object === 'instagram' ? 'instagram' : 'facebook',
            externalSenderId: msg.sender.id,
            externalPageId: pageId,
            platformMessageId: msg.message?.mid || `evt_${entry.time}_${msg.sender.id}`,
            // Capture text or postback title as primary message text
            messageText: msg.message?.text || msg.postback?.title || null,
            rawPayload: payload,
            headers: headers,
            // Meta timestamps are in milliseconds
            receivedAt: this.parseTimestamp(msg.timestamp || entry.time),
          });
        }
      }

      // Handle 'changes' (e.g., feed updates, comments) if needed in future
      // if (entry.changes && Array.isArray(entry.changes)) { ... }
    }

    return events;
  }

  private parseTimestamp(ts: number | undefined): Date {
    if (!ts) return new Date();
    // Meta sends seconds or milliseconds depending on the field, 
    // but messaging.timestamp is usually milliseconds. 
    // entry.time is usually seconds.
    // If it's less than 10^11, it's likely seconds.
    const isSeconds = ts < 100000000000;
    return new Date(isSeconds ? ts * 1000 : ts);
  }
}

export const metaParser = new MetaParserService();
