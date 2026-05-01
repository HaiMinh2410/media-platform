/**
 * Script: subscribe-page-webhooks.ts
 * Mục đích: Subscribe webhook cho tất cả Facebook Pages trong DB
 * - Gọi POST /{page-id}/subscribed_apps với page access token
 * - Đảm bảo page nhận được messages + messaging_postbacks
 * 
 * Chạy: bun run scripts/subscribe-page-webhooks.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const GRAPH_API_VERSION = 'v21.0';

// Fields cần subscribe để nhận tin nhắn (tên CHÍNH XÁC theo Meta API)
const SUBSCRIBED_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_referrals',
  'message_reads',  // đúng tên, không phải messaging_read
];

// ── Decrypt token (AES-256-GCM: iv:authTag:ciphertext) ─────────────────────
function decryptToken(encryptedString: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) throw new Error('META_TOKEN_ENCRYPTION_KEY is not set');

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) throw new Error('META_TOKEN_ENCRYPTION_KEY must be 32 bytes');

  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format');

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── Subscribe a page to the app's webhooks ─────────────────────────────────
async function subscribePageWebhook(pageId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  const fields = SUBSCRIBED_FIELDS.join(',');
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      subscribed_fields: SUBSCRIBED_FIELDS,
    }),
  });

  const json = await res.json() as any;

  if (!res.ok || json.error) {
    return { success: false, error: json.error?.message ?? `HTTP ${res.status}` };
  }

  return { success: json.success === true };
}

// ── Check current subscriptions ────────────────────────────────────────────
async function checkPageSubscription(pageId: string, accessToken: string): Promise<string[]> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps?access_token=${accessToken}`;
  const res = await fetch(url);
  const json = await res.json() as any;

  if (!res.ok || !json.data) return [];

  // data is array of subscribed apps, return subscribed_fields of our app
  const firstApp = json.data[0];
  return firstApp?.subscribed_fields ?? [];
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Subscribe Page Webhooks Script\n');

  // Get all facebook accounts with tokens
  const accounts = await db.platformAccount.findMany({
    where: { platform: 'facebook' },
    include: {
      meta_tokens: {
        orderBy: { updated_at: 'desc' },
        take: 1,
      },
    },
  });

  if (accounts.length === 0) {
    console.log('❌ Không có Facebook account nào trong DB');
    return;
  }

  console.log(`📋 Tìm thấy ${accounts.length} Facebook Page(s)\n`);

  for (const account of accounts) {
    const pageId = account.platform_user_id;
    const pageName = account.platform_user_name;
    console.log(`── ${pageName} (ID: ${pageId}) ──`);

    const tokenRecord = account.meta_tokens[0];
    if (!tokenRecord) {
      console.log('  ⚠️  Không có token — bỏ qua\n');
      continue;
    }

    let plainToken: string;
    try {
      plainToken = decryptToken(tokenRecord.encrypted_access_token);
    } catch (err: any) {
      console.log(`  ❌ Không decrypt được token: ${err.message}\n`);
      continue;
    }

    // Check current status
    const currentFields = await checkPageSubscription(pageId, plainToken);
    if (currentFields.length > 0) {
      console.log(`  ℹ️  Đã subscribed: [${currentFields.join(', ')}]`);
    } else {
      console.log('  ℹ️  Chưa subscribed hoặc không có data');
    }

    // Subscribe
    const { success, error } = await subscribePageWebhook(pageId, plainToken);
    if (success) {
      console.log(`  ✅ Subscribe thành công! Fields: [${SUBSCRIBED_FIELDS.join(', ')}]\n`);
    } else {
      console.log(`  ❌ Subscribe thất bại: ${error}\n`);
    }
  }

  console.log('🎉 Done!');
}

main()
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
