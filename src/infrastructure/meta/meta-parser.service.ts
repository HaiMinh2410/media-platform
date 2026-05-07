import { MetaWebhookPayload } from '@/domain/types/meta-webhook';
import { ParsedWebhookEvent } from '@/domain/types/webhooks';
import { MessageAttachment } from '@/domain/types/messaging';

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

      // Handle 'messaging' events (standard messages, postbacks, reads, deliveries)
      if (entry.messaging && Array.isArray(entry.messaging)) {
        for (const msg of entry.messaging) {
          // Capture echo status
          const isEcho = !!msg.message?.is_echo;

          let eventType: any = 'other';
          let messageText: string | null = null;
          let platformMessageId = `evt_${entry.time || Date.now()}_${msg.sender?.id || 'unknown'}`;
          let attachments: MessageAttachment[] | null = null;
          let parentMessageId: string | null = null;
          let reactionData: { action: 'react' | 'unreact'; emoji: string; parentMessageId: string } | null = null;

          if (msg.read) {
            eventType = 'read';
            messageText = JSON.stringify({ watermark: msg.read.watermark });
          } else if (msg.delivery) {
            eventType = 'delivery';
            messageText = JSON.stringify({
              watermark: msg.delivery.watermark,
              mids: msg.delivery.mids
            });
          } else if (msg.reaction) {
            eventType = 'reaction';
            platformMessageId = msg.reaction.mid || platformMessageId;
            reactionData = {
              action: msg.reaction.action === 'react' ? 'react' : 'unreact',
              emoji: msg.reaction.emoji || '',
              parentMessageId: msg.reaction.mid
            };
          } else if (msg.sender_action) {
            eventType = msg.sender_action === 'typing_on' ? 'typing_on' : 'typing_off';
          } else if (msg.message || msg.postback?.title) {
            eventType = 'message';
            messageText = msg.message?.text || msg.postback?.title || null;
            platformMessageId = msg.message?.mid || platformMessageId;
            parentMessageId = msg.message?.reply_to?.mid || null;

            if (msg.message?.attachments && Array.isArray(msg.message.attachments)) {
              attachments = msg.message.attachments.map((att: any) => {
                let type: any = 'file';
                if (['image', 'video', 'audio', 'file'].includes(att.type)) {
                  type = att.type;
                }
                return {
                  type,
                  payload: {
                    url: att.payload?.url || '',
                    title: att.title,
                    fileSize: att.payload?.file_size,
                  }
                };
              });
            }
          }

          events.push({
            platform: payload.object === 'instagram' ? 'instagram' : 'facebook',
            eventType,
            externalSenderId: isEcho ? (msg.recipient?.id || 'unknown') : (msg.sender?.id || pageId),
            externalPageId: pageId,
            platformMessageId,
            messageText,
            rawPayload: payload,
            headers: headers,
            receivedAt: this.parseTimestamp(msg.timestamp || entry.time),
            isEcho,
            parentMessageId,
            attachments,
            reactionData
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
