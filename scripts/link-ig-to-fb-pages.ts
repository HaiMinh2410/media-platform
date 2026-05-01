/**
 * Script: link-ig-to-fb-pages.ts
 * Tìm Facebook Page linked với mỗi Instagram account
 * và cập nhật metadata để hệ thống dùng đúng token
 *
 * Chạy: bun run scripts/link-ig-to-fb-pages.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// FB Page tokens (mới, còn hạn) — lấy từ các pages đã được upsert
const FB_PAGES = [
  {
    pageId: '1122137857642529',
    name: 'Kathryn',
    accessToken: 'EABAX69avEfIBRVYXFUCIW2rd3GkvM3MszNzRtU9ZA8E5ygD8CMOGa13ZCXDeErxGL1HZBLmYGDRC07564Vm4lXe8nezuejBiXRFqZA75nPvqyK33yklSJJyFMSmpgZAwZCweaiJZALivm3nKqQh273wkPpym2hOwAZCw03V3c2MeMuwEz4e73SoXJ92drTRW2ZAAjwTideQcNc4qqZAhTsSMmxBiIh',
  },
  {
    pageId: '1044468135423441',
    name: 'Minh Anh',
    accessToken: 'EABAX69avEfIBRSunEJSliu6MRde3MZAFRSjTT4COfkwwQICZB9uTXnI1ZAZBor9CaDviE6dWc6UkhP7h0XJy0YHcBCY2chQDLpKbPxwmIL2kTcaQDDSMXi6P9KH0lMXoR7wDHTrJpQPQ1cA25ZBsl4FmzuOdH2e0h7d2SinxxlCzDyJbCfuMtlpOkitEZCqtDjRJ8wUWK5PkLXavbQf6aXO7Sn',
  },
  {
    pageId: '1142742645581562',
    name: 'Nguyễn An Thư',
    accessToken: 'EABAX69avEfIBRTukuDZAALm2CasjQ1sYS73lMXivOZCu7QIa9sv4tzVk7lV8IlEZCo1o2aWUlFZCPLT9bmHYKtVAZBEkAAIFYZAJ9SVq1BJfhjL5lHtjbGDtUtEIxibNZASZC6fZAYfyRbKSnuoWYYmLwh6ZCPTsuBmrwBhmestcOWzPyZAhJJjAMLVc1aNEpFrSXmZB4HLEoak0XZAjtZCZBE0r54jFErG',
  },
];

function encryptToken(text: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY!;
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

// Lấy Instagram account được linked với FB Page
async function getLinkedIGAccount(pageId: string, pageToken: string): Promise<{ id: string; name: string } | null> {
  const url = `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
  const res = await fetch(url);
  const json = await res.json() as any;
  if (json.error) {
    console.log(`  ⚠️  Không lấy được IG account: ${json.error.message}`);
    return null;
  }
  return json.instagram_business_account ?? null;
}

async function main() {
  console.log('🔗 Link Instagram Accounts to Facebook Pages\n');

  for (const page of FB_PAGES) {
    console.log(`── ${page.name} (FB Page: ${page.pageId}) ──`);

    // 1. Tìm linked IG account từ Graph API
    const igAccount = await getLinkedIGAccount(page.pageId, page.accessToken);

    if (!igAccount) {
      console.log('  ℹ️  Không có Instagram account linked với page này\n');
      continue;
    }

    const igId = igAccount.id;
    console.log(`  ✅ Linked Instagram ID: ${igId}`);

    // 2. Cập nhật metadata của FB Page với instagram_id
    await db.platformAccount.updateMany({
      where: { platform: 'facebook', platform_user_id: page.pageId },
      data: {
        metadata: {
          category: 'Người sáng tạo nội dung số',
          instagram_id: igId,
        }
      }
    });
    console.log(`  ✅ Đã update metadata FB Page với instagram_id: ${igId}`);

    // 3. Kiểm tra có IG platform_account trong DB không
    const igPlatformAccount = await db.platformAccount.findFirst({
      where: { platform: 'instagram', platform_user_id: igId },
      include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
    });

    if (igPlatformAccount) {
      console.log(`  ✅ IG platform_account found: ${igPlatformAccount.platform_user_name}`);
      // 4. Cập nhật/thêm token FB Page vào IG account để nó có token mới dùng được
      const encryptedFbToken = encryptToken(page.accessToken);
      const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      const existing = igPlatformAccount.meta_tokens[0];
      if (existing) {
        await db.meta_tokens.update({
          where: { id: existing.id },
          data: { encrypted_access_token: encryptedFbToken, expires_at: tokenExpiry, updated_at: new Date() }
        });
        console.log(`  ✅ Đã refresh token của IG account (dùng FB Page token)`);
      } else {
        await db.meta_tokens.create({
          data: {
            account_id: igPlatformAccount.id,
            encrypted_access_token: encryptedFbToken,
            expires_at: tokenExpiry,
          }
        });
        console.log(`  ✅ Đã tạo token cho IG account (dùng FB Page token)`);
      }
    } else {
      console.log(`  ℹ️  Chưa có IG platform_account trong DB cho ID ${igId}`);
    }

    console.log('');
  }

  console.log('🎉 Done!');
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => db.$disconnect());
