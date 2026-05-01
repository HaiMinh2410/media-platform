/**
 * Script: upsert-meta-accounts.ts
 * Mục đích: Upsert 3 Facebook Page vào platform_accounts + meta_tokens
 * Chạy: bun run scripts/upsert-meta-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ── Dữ liệu từ Facebook Pages API ──────────────────────────────────────────
import { getTargetPages } from './utils/meta-config';

// ── Encryption (AES-256-GCM) ────────────────────────────────────────────────
function encryptToken(text: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) throw new Error('META_TOKEN_ENCRYPTION_KEY is not set');

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) throw new Error('META_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting upsert-meta-accounts script...\n');

  // 1. Lấy workspace đầu tiên tìm thấy
  const workspace = await db.workspace.findFirst({
    include: { workspace_members: { take: 1 } },
  });

  if (!workspace) {
    throw new Error('❌ Không tìm thấy Workspace nào trong DB!');
  }

  const profileId = workspace.workspace_members[0]?.profile_id;
  if (!profileId) {
    throw new Error(`❌ Workspace "${workspace.name}" chưa có member nào!`);
  }

  console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`✅ Profile ID: ${profileId}\n`);

  // 2. Lấy danh sách page cần upsert
  const pages = await getTargetPages();
  if (pages.length === 0) {
    console.warn('⚠️ No pages found to upsert. Check your environment variables.');
    return;
  }

  for (const page of pages) {
    console.log(`\n── Đang xử lý: ${page.name} (FB ID: ${page.id}) ──`);

    try {
      const encryptedToken = encryptToken(page.access_token);

      // 1a. Discover linked Instagram account if any
      let instagramId: string | null = null;
      try {
        const igUrl = `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
        const igRes = await fetch(igUrl);
        const igJson = await igRes.json() as any;
        instagramId = igJson.instagram_business_account?.id || null;
        if (instagramId) {
          console.log(`  📸 Tìm thấy IG account linked: ${instagramId}`);
        }
      } catch (igErr) {
        console.warn(`  ⚠️ Không thể lấy thông tin Instagram cho page ${page.id}:`, igErr);
      }

      await db.$transaction(async (tx) => {
        // 2a. Upsert platform_account
        const account = await tx.platformAccount.upsert({
          where: {
            platform_platform_user_id: {
              platform: 'facebook',
              platform_user_id: page.id,
            },
          },
          update: {
            platform_user_name: page.name,
            workspaceId: workspace.id,
            disconnected_at: null,
            metadata: { 
              category: page.category,
              instagram_id: instagramId 
            },
          },
          create: {
            workspaceId: workspace.id,
            profile_id: profileId,
            platform: 'facebook',
            platform_user_id: page.id,
            platform_user_name: page.name,
            metadata: { 
              category: page.category,
              instagram_id: instagramId 
            },
          },
        });

        console.log(`  ✅ platform_accounts upserted → account.id: ${account.id}`);

        // 2b. Upsert meta_token (findFirst + update/create)
        const existingToken = await tx.meta_tokens.findFirst({
          where: { account_id: account.id },
        });

        const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

        if (existingToken) {
          await tx.meta_tokens.update({
            where: { id: existingToken.id },
            data: {
              encrypted_access_token: encryptedToken,
              expires_at: tokenExpiry,
              updated_at: new Date(),
            },
          });
          console.log(`  ✅ meta_tokens updated (id: ${existingToken.id})`);
        } else {
          const newToken = await tx.meta_tokens.create({
            data: {
              account_id: account.id,
              encrypted_access_token: encryptedToken,
              expires_at: tokenExpiry,
            },
          });
          console.log(`  ✅ meta_tokens created (id: ${newToken.id})`);
        }
      });
    } catch (err) {
      console.error(`  ❌ Lỗi khi xử lý ${page.name}:`, err);
    }
  }

  console.log('\n🎉 Done! Tất cả tài khoản đã được upsert.');
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
