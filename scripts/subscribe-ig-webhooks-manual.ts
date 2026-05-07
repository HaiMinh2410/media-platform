import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function decryptToken(encryptedString: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) throw new Error('META_TOKEN_ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyHex, 'hex');
  const parts = encryptedString.split(':');
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function main() {
  console.log('=== Attempting Manual Instagram Webhook Subscription ===\n');

  // Lấy FB Page "Hai Minh Platform"
  const pageId = '1006289889245664';
  const igId = '17841418409623950';

  const page = await db.platformAccount.findFirst({
    where: { platform: 'facebook', platform_user_id: pageId },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  if (!page || !page.meta_tokens[0]) {
    console.log('❌ Không tìm thấy Page hoặc Token');
    return;
  }

  const token = decryptToken(page.meta_tokens[0].encrypted_access_token);

  // Sử dụng ĐÚNG trường cho Instagram
  const igFields = ['messages', 'messaging_postbacks', 'messaging_referral', 'messaging_seen'];

  // 1. Thử gọi POST /igId/subscribed_apps
  const igUrl = `https://graph.facebook.com/v21.0/${igId}/subscribed_apps`;
  console.log(`Đang gọi POST /${igId}/subscribed_apps ...`);
  try {
    const res = await fetch(igUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        subscribed_fields: igFields
      })
    });
    const json = await res.json() as any;
    console.log('Phản hồi từ Meta POST /ig-id/subscribed_apps:', JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.log('Lỗi:', err.message);
  }
}

main().finally(() => db.$disconnect());
