/**
 * Script: verify-ig-webhook.ts
 * Kiểm tra toàn bộ flow Instagram webhook:
 * 1. Token còn hạn không?
 * 2. Platform account đã có trong DB chưa?
 * 3. Webhook parser có nhận đúng externalPageId không?
 * 4. Simulate gửi 1 message thử
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function decryptToken(enc: string): string | null {
  try {
    const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY!;
    const key = Buffer.from(keyHex, 'hex');
    const [ivHex, authTagHex, ciphertextHex] = enc.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(authTag);
    return d.update(ciphertextHex, 'hex', 'utf8') + d.final('utf8');
  } catch { return null; }
}

async function main() {
  console.log('🔍 Instagram Webhook Verification\n');

  // 1. Lấy tất cả IG accounts
  const igAccounts = await db.platformAccount.findMany({
    where: { platform: 'instagram' },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } },
  });

  console.log(`=== ${igAccounts.length} Instagram accounts trong DB ===\n`);

  for (const acc of igAccounts) {
    console.log(`@${acc.platform_user_name} (ID: ${acc.platform_user_id})`);

    const tokenRec = acc.meta_tokens[0];
    if (!tokenRec) {
      console.log('  ❌ Không có token\n');
      continue;
    }

    const plain = decryptToken(tokenRec.encrypted_access_token);
    if (!plain) {
      console.log('  ❌ Token không decrypt được\n');
      continue;
    }

    // Kiểm tra token via /me
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${plain}`);
    const me = await meRes.json() as any;

    if (me.error) {
      console.log(`  ❌ Token hết hạn hoặc invalid: ${me.error.message}`);
      console.log(`     Code: ${me.error.code}, SubCode: ${me.error.error_subcode}\n`);
      continue;
    }

    console.log(`  ✅ Token hợp lệ → /me = ${me.name} (${me.id})`);

    // Kiểm tra IG account có dùng đúng loại token không
    const igRes = await fetch(`https://graph.facebook.com/v21.0/${acc.platform_user_id}?fields=id,name,username&access_token=${plain}`);
    const igInfo = await igRes.json() as any;
    if (igInfo.error) {
      console.log(`  ⚠️  Không truy cập được IG ${acc.platform_user_id}: ${igInfo.error.message}`);
    } else {
      console.log(`  ✅ IG accessible: @${igInfo.username ?? igInfo.name}`);
    }

    // Kiểm tra subscribed webhooks cho IG account
    const subRes = await fetch(`https://graph.facebook.com/v21.0/${acc.platform_user_id}/subscribed_apps?access_token=${plain}`);
    const subJson = await subRes.json() as any;
    if (subJson.error) {
      console.log(`  ⚠️  Check subscription failed: ${subJson.error.message}`);
    } else if (subJson.data?.length > 0) {
      console.log(`  ✅ Webhook subscribed: [${subJson.data[0]?.subscribed_fields?.join(', ')}]`);
    } else {
      console.log(`  ⚠️  CHƯA có app subscribed tới IG account này`);
      console.log(`     → Instagram DM sẽ KHÔNG được gửi tới webhook!`);
      console.log(`     → Cần check App Dashboard: Products > Webhooks > instagram`);
    }

    console.log('');
  }

  // 2. Xem webhook events gần nhất từ instagram
  console.log('\n=== 5 Webhook Events Instagram gần nhất ===');
  const recentIgEvents = await db.webhookEvent.findMany({
    where: { platform: 'instagram' },
    orderBy: { receivedAt: 'desc' },
    take: 5,
    select: { id: true, externalPageId: true, externalSenderId: true, messageText: true, receivedAt: true }
  });

  if (recentIgEvents.length === 0) {
    console.log('❌ Chưa có event Instagram nào được nhận!');
    console.log('   → Kiểm tra: App Dashboard > Webhooks > instagram object đã subscribe chưa?');
  } else {
    for (const ev of recentIgEvents) {
      console.log(`  [${ev.receivedAt.toISOString()}] page=${ev.externalPageId} sender=${ev.externalSenderId} msg="${ev.messageText?.substring(0,30)}"`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
