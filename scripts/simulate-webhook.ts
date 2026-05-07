#!/usr/bin/env bun
/**
 * simulate-webhook.ts
 * ───────────────────
 * CLI helper to send mock Meta webhook payloads to the local dev server.
 *
 * Usage:
 *   bun run scripts/simulate-webhook.ts --type=<type> [options]
 *
 * Event types:
 *   text       — plain text message
 *   image      — message with image attachment
 *   audio      — message with audio (voice note) attachment
 *   video      — message with video attachment
 *   reaction   — emoji reaction on a message
 *   unreact    — remove emoji reaction
 *   typing     — typing_on indicator
 *   read       — read receipt
 *   delivery   — delivery receipt
 *   echo       — echo of a page-sent message
 *   reply      — text message with reply_to threading
 *
 * Options:
 *   --type=<type>        Event type (required)
 *   --platform=<plat>   "facebook" or "instagram" (default: facebook)
 *   --sender=<id>        Override sender PSID/IGSID
 *   --page=<id>          Override page/account ID
 *   --mid=<id>           Override message ID
 *   --text=<text>        Override message text
 *   --emoji=<emoji>      Override reaction emoji (for reaction events)
 *   --url=<endpoint>     Override webhook URL (default: http://localhost:3000/api/webhook/meta)
 *   --dry-run            Print payload without sending
 *   --list               List all available event types
 */

// ─── Config defaults ──────────────────────────────────────────────────────────

const DEFAULTS = {
  webhookUrl: 'http://localhost:3000/api/webhook/meta',
  pageId: 'SIM_PAGE_001',
  senderId: 'SIM_USER_001',
  baseMid: `m_sim_${Date.now()}`,
};

// ─── Parse CLI args ───────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.length > 0 ? rest.join('=') : true;
    }
  }
  return args;
}

const args = parseArgs(process.argv);

// ─── List mode ────────────────────────────────────────────────────────────────

if (args['list']) {
  console.log(`
📋 Available event types:
  text       — Plain text message
  image      — Message with image attachment
  audio      — Message with audio/voice attachment
  video      — Message with video attachment
  reaction   — Emoji reaction (❤️) on a message
  unreact    — Remove emoji reaction
  typing     — Typing indicator (typing_on)
  read       — Read receipt
  delivery   — Delivery receipt
  echo       — Echo of a page-sent message
  reply      — Text message with reply threading

📌 Examples:
  bun run scripts/simulate-webhook.ts --type=text
  bun run scripts/simulate-webhook.ts --type=image --platform=instagram
  bun run scripts/simulate-webhook.ts --type=reaction --emoji=👍 --dry-run
  bun run scripts/simulate-webhook.ts --type=reply --mid=m_parent_abc
`);
  process.exit(0);
}

// ─── Config from args ─────────────────────────────────────────────────────────

const eventType = (args['type'] as string) || '';
const platform = (args['platform'] as string) || 'facebook';
const senderId = (args['sender'] as string) || DEFAULTS.senderId;
const pageId = (args['page'] as string) || DEFAULTS.pageId;
const mid = (args['mid'] as string) || DEFAULTS.baseMid;
const text = (args['text'] as string) || `🧪 Simulated ${eventType} message — ${new Date().toLocaleTimeString()}`;
const emoji = (args['emoji'] as string) || '❤️';
const webhookUrl = (args['url'] as string) || DEFAULTS.webhookUrl;
const isDryRun = !!args['dry-run'];

const object = platform === 'instagram' ? 'instagram' : 'page';
const nowMs = Date.now();
const nowS = Math.floor(nowMs / 1000);

// ─── Payload factories ────────────────────────────────────────────────────────

type Payload = {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: any[];
  }>;
};

function basePayload(messaging: any[]): Payload {
  return {
    object,
    entry: [
      {
        id: pageId,
        time: nowS,
        messaging,
      },
    ],
  };
}

function msgEvent(message: any) {
  return {
    sender: { id: senderId },
    recipient: { id: pageId },
    timestamp: nowMs,
    message,
  };
}

// ─── Event templates ──────────────────────────────────────────────────────────

const TEMPLATES: Record<string, () => Payload> = {
  text: () =>
    basePayload([
      msgEvent({ mid, text }),
    ]),

  image: () =>
    basePayload([
      msgEvent({
        mid,
        attachments: [
          {
            type: 'image',
            payload: { url: 'https://picsum.photos/seed/sim/800/600' },
          },
        ],
      }),
    ]),

  audio: () =>
    basePayload([
      msgEvent({
        mid,
        attachments: [
          {
            type: 'audio',
            payload: {
              url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              file_size: 204800,
            },
          },
        ],
      }),
    ]),

  video: () =>
    basePayload([
      msgEvent({
        mid,
        attachments: [
          {
            type: 'video',
            payload: { url: 'https://www.w3schools.com/html/mov_bbb.mp4', file_size: 1048576 },
          },
        ],
      }),
    ]),

  reaction: () =>
    basePayload([
      {
        sender: { id: senderId },
        recipient: { id: pageId },
        timestamp: nowMs,
        reaction: {
          mid,
          action: 'react',
          emoji,
          reaction: 'love',
        },
      },
    ]),

  unreact: () =>
    basePayload([
      {
        sender: { id: senderId },
        recipient: { id: pageId },
        timestamp: nowMs,
        reaction: {
          mid,
          action: 'unreact',
          emoji: '',
          reaction: '',
        },
      },
    ]),

  typing: () =>
    basePayload([
      {
        sender: { id: senderId },
        recipient: { id: pageId },
        timestamp: nowMs,
        sender_action: 'typing_on',
      },
    ]),

  read: () =>
    basePayload([
      {
        sender: { id: senderId },
        recipient: { id: pageId },
        timestamp: nowMs,
        read: { watermark: nowMs },
      },
    ]),

  delivery: () =>
    basePayload([
      {
        sender: { id: senderId },
        recipient: { id: pageId },
        timestamp: nowMs,
        delivery: {
          mids: [mid, `${mid}_2`],
          watermark: nowMs,
        },
      },
    ]),

  echo: () =>
    basePayload([
      {
        sender: { id: pageId },
        recipient: { id: senderId },
        timestamp: nowMs,
        message: {
          mid: `echo_${mid}`,
          text: `[Page Reply] ${text}`,
          is_echo: true,
          app_id: 123456789,
        },
      },
    ]),

  reply: () =>
    basePayload([
      msgEvent({
        mid: `reply_${mid}`,
        text,
        reply_to: { mid },
      }),
    ]),
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!eventType) {
    console.error('❌ --type is required. Run with --list to see available event types.\n');
    console.error('   Usage: bun run scripts/simulate-webhook.ts --type=<type>');
    process.exit(1);
  }

  const factory = TEMPLATES[eventType];
  if (!factory) {
    console.error(`❌ Unknown event type: "${eventType}". Run with --list to see available types.`);
    process.exit(1);
  }

  const payload = factory();

  console.log(`\n🔧 simulate-webhook — event: ${eventType} | platform: ${platform}`);
  console.log(`📡 Target: ${webhookUrl}`);
  console.log(`👤 Sender: ${senderId} → Page: ${pageId}`);
  console.log(`📨 Message ID: ${mid}`);
  console.log('');
  console.log('📦 Payload:');
  console.log(JSON.stringify(payload, null, 2));

  if (isDryRun) {
    console.log('\n⚠️  --dry-run mode: payload NOT sent.');
    return;
  }

  console.log('\n🚀 Sending...');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': 'sha256=simulated_signature',
        'x-simulate': 'true',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text().catch(() => '');

    if (res.ok) {
      console.log(`✅ Success! HTTP ${res.status}`);
      if (responseText) console.log(`   Response: ${responseText}`);
    } else {
      console.error(`❌ HTTP ${res.status} — ${res.statusText}`);
      if (responseText) console.error(`   Body: ${responseText}`);
    }
  } catch (err: any) {
    console.error(`❌ Network error: ${err.message}`);
    console.error('   Is your dev server running? (bun dev)');
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
