/**
 * Script: debug-ig-send.ts
 * Debug Instagram send: decrypt token + test send API
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function decryptToken(encryptedString: string): string | null {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) return null;
  const key = Buffer.from(keyHex, 'hex');
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    console.log('  ⚠️  Token format invalid (not iv:authTag:ciphertext) — may be plain or different format');
    return null;
  }
  try {
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(ciphertextHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch (e: any) {
    console.log('  ❌ Decrypt error:', e.message);
    return null;
  }
}

async function main() {
  const igAccounts = await db.platformAccount.findMany({
    where: { platform: 'instagram' },
    include: {
      meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 },
    }
  });

  for (const account of igAccounts) {
    const igId = account.platform_user_id;
    const name = account.platform_user_name;
    console.log(`\n=== ${name} (IG ID: ${igId}) ===`);

    const tokenRecord = account.meta_tokens[0];
    if (!tokenRecord) {
      console.log('  ❌ Không có token trong meta_tokens');
      continue;
    }

    const encrypted = tokenRecord.encrypted_access_token;
    console.log('  Token (first 30 chars):', encrypted.substring(0, 30), '...');

    const decrypted = decryptToken(encrypted);
    if (!decrypted) {
      console.log('  ❌ Token decrypt thất bại hoặc format sai');
      
      // Try debug_token with raw value
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (appId && appSecret) {
        const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${encrypted}&access_token=${appId}|${appSecret}`;
        const res = await fetch(debugUrl);
        const json = await res.json() as any;
        console.log('  Debug token (raw):', JSON.stringify(json?.data ?? json, null, 2));
      }
      continue;
    }

    console.log('  ✅ Token decrypted, length:', decrypted.length);

    // Test Graph API call
    const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${decrypted}`;
    const meRes = await fetch(meUrl);
    const meJson = await meRes.json() as any;
    if (meJson.error) {
      console.log('  ❌ /me API error:', meJson.error.message, `(code: ${meJson.error.code})`);
    } else {
      console.log('  ✅ /me API OK:', meJson);
    }

    // Check what platform send URL would look like
    console.log(`  📤 Send URL would be: POST /v21.0/${igId}/messages`);
  }
}

main().finally(() => db.$disconnect());
