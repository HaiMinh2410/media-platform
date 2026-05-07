/// <reference types="bun-types" />
import { describe, it, expect, beforeEach } from 'bun:test';
import { MetaParserService } from '../meta-parser.service';
import type { MetaWebhookPayload } from '@/domain/types/meta-webhook';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PAGE_ID = 'page_123456';
const SENDER_ID = 'user_789012';
const MSG_MID = 'm_abc123xyz';
const TIMESTAMP_MS = 1715000000000; // milliseconds
const TIMESTAMP_S = 1715000000;     // seconds (entry.time format)

function makeFbPayload(messaging: any[]): MetaWebhookPayload {
  return {
    object: 'page',
    entry: [
      {
        id: PAGE_ID,
        time: TIMESTAMP_S,
        messaging,
      },
    ],
  };
}

function makeIgPayload(messaging: any[]): MetaWebhookPayload {
  return {
    object: 'instagram',
    entry: [
      {
        id: PAGE_ID,
        time: TIMESTAMP_S,
        messaging,
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MetaParserService', () => {
  let parser: MetaParserService;

  beforeEach(() => {
    parser = new MetaParserService();
  });

  // ── 1. Validation & Safety ─────────────────────────────────────────────────

  describe('parse() — validation', () => {
    it('returns [] for null payload', () => {
      // @ts-expect-error intentional bad input
      expect(parser.parse(null)).toEqual([]);
    });

    it('returns [] when entry array is missing', () => {
      // @ts-expect-error intentional bad input
      expect(parser.parse({ object: 'page' })).toEqual([]);
    });

    it('returns [] for unsupported object type', () => {
      const payload: MetaWebhookPayload = {
        // @ts-expect-error intentional bad input
        object: 'invalid_object_type',
        entry: [{ id: PAGE_ID, time: TIMESTAMP_S, messaging: [] }],
      };
      expect(parser.parse(payload)).toEqual([]);
    });

    it('returns [] for entry with no messaging array', () => {
      const payload: MetaWebhookPayload = {
        object: 'page',
        entry: [{ id: PAGE_ID, time: TIMESTAMP_S }],
      };
      expect(parser.parse(payload)).toEqual([]);
    });
  });

  // ── 2. Text Message ────────────────────────────────────────────────────────

  describe('parse() — text message', () => {
    it('parses a plain text message correctly', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: { mid: MSG_MID, text: 'Hello world' },
        },
      ]);

      const [event] = parser.parse(payload);

      expect(event.platform).toBe('facebook');
      expect(event.eventType).toBe('message');
      expect(event.messageText).toBe('Hello world');
      expect(event.platformMessageId).toBe(MSG_MID);
      expect(event.externalSenderId).toBe(SENDER_ID);
      expect(event.externalPageId).toBe(PAGE_ID);
      expect(event.isEcho).toBe(false);
      expect(event.parentMessageId).toBeNull();
      expect(event.attachments).toBeNull();
      expect(event.reactionData).toBeNull();
    });

    it('returns receivedAt as a valid Date from ms timestamp', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: { mid: MSG_MID, text: 'ts test' },
        },
      ]);
      const [event] = parser.parse(payload);
      expect(event.receivedAt).toBeInstanceOf(Date);
      expect(event.receivedAt.getTime()).toBe(TIMESTAMP_MS);
    });

    it('falls back to entry.time (seconds) when msg.timestamp is missing', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          // no timestamp field
          message: { mid: MSG_MID, text: 'no ts' },
        },
      ]);
      const [event] = parser.parse(payload);
      expect(event.receivedAt).toBeInstanceOf(Date);
      // entry.time is in seconds — parser should multiply by 1000
      expect(event.receivedAt.getTime()).toBe(TIMESTAMP_S * 1000);
    });
  });

  // ── 3. Image Attachment ────────────────────────────────────────────────────

  describe('parse() — image attachment', () => {
    it('parses an image attachment correctly', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: {
            mid: MSG_MID,
            attachments: [
              {
                type: 'image',
                payload: { url: 'https://cdn.facebook.com/image.jpg' },
              },
            ],
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('message');
      expect(event.attachments).toHaveLength(1);
      expect(event.attachments![0].type).toBe('image');
      expect(event.attachments![0].payload.url).toBe('https://cdn.facebook.com/image.jpg');
    });

    it('normalises unknown attachment types to "file"', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: {
            mid: MSG_MID,
            attachments: [{ type: 'sticker', payload: { url: 'https://example.com/sticker' } }],
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.attachments![0].type).toBe('file');
    });
  });

  // ── 4. Audio Attachment ────────────────────────────────────────────────────

  describe('parse() — audio attachment', () => {
    it('parses an audio (voice note) attachment', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: {
            mid: MSG_MID,
            attachments: [
              {
                type: 'audio',
                payload: {
                  url: 'https://cdn.facebook.com/audio.mp4',
                  file_size: 204800,
                },
              },
            ],
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.attachments![0].type).toBe('audio');
      expect(event.attachments![0].payload.fileSize).toBe(204800);
    });
  });

  // ── 5. Reply Threading ─────────────────────────────────────────────────────

  describe('parse() — reply threading', () => {
    const PARENT_MID = 'm_parentXYZ';

    it('captures parentMessageId from reply_to.mid', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: {
            mid: MSG_MID,
            text: 'Reply here',
            reply_to: { mid: PARENT_MID },
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.parentMessageId).toBe(PARENT_MID);
    });

    it('sets parentMessageId to null when no reply_to', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: { mid: MSG_MID, text: 'Regular msg' },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.parentMessageId).toBeNull();
    });
  });

  // ── 6. Reaction Events ─────────────────────────────────────────────────────

  describe('parse() — reaction events', () => {
    it('parses a "react" reaction event', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          reaction: {
            mid: MSG_MID,
            action: 'react',
            emoji: '❤️',
            reaction: 'love',
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('reaction');
      expect(event.platformMessageId).toBe(MSG_MID);
      expect(event.reactionData).toEqual({
        action: 'react',
        emoji: '❤️',
        parentMessageId: MSG_MID,
      });
    });

    it('parses an "unreact" reaction event', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          reaction: {
            mid: MSG_MID,
            action: 'unreact',
            emoji: '',
            reaction: '',
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.reactionData?.action).toBe('unreact');
    });
  });

  // ── 7. Typing Indicators ───────────────────────────────────────────────────

  describe('parse() — typing indicators', () => {
    it('parses typing_on event', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          sender_action: 'typing_on',
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('typing_on');
    });

    it('parses typing_off event', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          sender_action: 'typing_off',
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('typing_off');
    });
  });

  // ── 8. Read Receipts ───────────────────────────────────────────────────────

  describe('parse() — read receipts', () => {
    it('parses a read event', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          read: { watermark: TIMESTAMP_MS },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('read');
      expect(event.messageText).toContain(String(TIMESTAMP_MS));
    });
  });

  // ── 9. Delivery Events ─────────────────────────────────────────────────────

  describe('parse() — delivery events', () => {
    it('parses a delivery event with mids', () => {
      const payload = makeFbPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          delivery: {
            mids: ['m_111', 'm_222'],
            watermark: TIMESTAMP_MS,
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.eventType).toBe('delivery');
      expect(event.messageText).toContain('m_111');
    });
  });

  // ── 10. Echo Messages ──────────────────────────────────────────────────────

  describe('parse() — echo messages', () => {
    it('marks is_echo=true and uses recipient.id as externalSenderId', () => {
      const payload = makeFbPayload([
        {
          sender: { id: PAGE_ID },
          recipient: { id: SENDER_ID },
          timestamp: TIMESTAMP_MS,
          message: {
            mid: MSG_MID,
            text: 'Echo message from page',
            is_echo: true,
            app_id: 12345,
          },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.isEcho).toBe(true);
      // For echo, externalSenderId should be the recipient (the customer)
      expect(event.externalSenderId).toBe(SENDER_ID);
    });
  });

  // ── 11. Instagram Platform ─────────────────────────────────────────────────

  describe('parse() — instagram platform', () => {
    it('sets platform to "instagram" for IG payloads', () => {
      const payload = makeIgPayload([
        {
          sender: { id: SENDER_ID },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: { mid: MSG_MID, text: 'IG message' },
        },
      ]);

      const [event] = parser.parse(payload);
      expect(event.platform).toBe('instagram');
    });
  });

  // ── 12. Multiple Events in one payload ────────────────────────────────────

  describe('parse() — multiple messaging events', () => {
    it('returns multiple events from one payload', () => {
      const payload = makeFbPayload([
        {
          sender: { id: 'user_A' },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS,
          message: { mid: 'm_A', text: 'First' },
        },
        {
          sender: { id: 'user_B' },
          recipient: { id: PAGE_ID },
          timestamp: TIMESTAMP_MS + 1000,
          message: { mid: 'm_B', text: 'Second' },
        },
      ]);

      const events = parser.parse(payload);
      expect(events).toHaveLength(2);
      expect(events[0].platformMessageId).toBe('m_A');
      expect(events[1].platformMessageId).toBe('m_B');
    });
  });
});
