/**
 * Script: upsert-meta-accounts.ts
 * Mục đích: Upsert các Facebook Page + Instagram liên kết vào platform_accounts + meta_tokens
 * Chạy: 
 *   bun run scripts/upsert-meta-accounts.ts (dùng file mặc định hoặc fallback mặc định)
 *   bun run scripts/upsert-meta-accounts.ts path/to/accounts.json (đọc từ file JSON tùy chỉnh)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

interface MetaPageInput {
  access_token: string;
  category: string;
  name: string;
  id: string;
}

// ── Dữ liệu fallback mặc định (tương thích ngược) ───────────────────────────
const defaultPages: MetaPageInput[] = [
  {
    "access_token": "EAATkCZBaS3toBRZAxZChLTFItM8ufYg10o2bbKhOUHM2GNZCIP2pibrPNdVHUJzx9YEBeSKh8xxdNaNmmCUs1OseUdGEnLRMiKwXEwCtNXUHRyNSENeP1bH84w8BBfe7rKjLTL38rs4nK83bIbOtdulKuF29eUiZAxcL9Tb15qcFPQ0uUuhBqrIV3GB5119qDhwczpdsqZBOd9FAEEOnBsZCV0k",
    "category": "Người sáng tạo nội dung số",
    "name": "Hai Minh Platform",
    "id": "1006289889245664"
  },
  {
    "access_token": "EAATkCZBaS3toBRTtxZABi6GZC2Hkr919L7GG3NlfMNUaKgv2QfqS8zKtUBfmEOYpWh3m1wvTcT3b5Ha8Ilr4viYuSHZBoJtxKtvcBZC6b1sGJAydJwAHetF2LI0ZBYLCllJRI3y4gsyuoZCwPuMPgos154pPMy1GRXudHUqAbCu49zOKaSPXTjZAD8vKQ9J0nSCAzUlMkevonBQZB40Fap6wMbJk8",
    "category": "Người sáng tạo nội dung số",
    "name": "Kathryn",
    "id": "1155246160994859"
  },
  {
    "access_token": "EAATkCZBaS3toBRUXuw6aCB24jUAM4Nz8yUkBdRFdEaLpptdJE0CiLSdCq8CzkHrcfEhpntBxjtsnMGsHTLt1lX6UACCRWZC6mKDUEo2FgTnoMh4de9BoliRcgQP1NduzwRZAv9Er37254wNEZBqPDa9PESTZAQcE0HUkeObNokBnowA9bKOhM7GPfNTtQGUCT3NlVtvQQmjIGK4AmVO4fZA9yB",
    "category": "Người sáng tạo nội dung số",
    "name": "Minh Anh",
    "id": "1013155438559010"
  },
  {
    "access_token": "EAATkCZBaS3toBRRP9IBAawhiqGQXuTzZCSybRBLvFS0MSB4EQ3mOj8SNN0qLaqZAZCZCDAVSOJ5yJU6ZChLSL8b2lhSkuJVVFdcAOZB4QTT6i1xcXu2QC2lqFGCUzrS46fvfozR2jwYGpKaYTrnk9G3TZAOoZCNoTRwTH8RgBd7OOnZCfLBKZB1Q0sfkTFhMMrDFSWDjmfyElhtxXx7ax7TWmkvD3zY",
    "category": "Người sáng tạo nội dung số",
    "name": "Nguyen An Thu",
    "id": "1053795974490719"
  }
];

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

  // 1. Xác định dữ liệu đầu vào
  let pages: MetaPageInput[] = [];
  const args = process.argv.slice(2);
  let inputFilePath = args[0] ? path.resolve(args[0]) : null;

  // Nếu không truyền file, kiểm tra xem file mặc định "meta-accounts-input.json" có tồn tại không
  if (!inputFilePath) {
    const defaultInputFile = path.resolve('meta-accounts-input.json');
    if (fs.existsSync(defaultInputFile)) {
      inputFilePath = defaultInputFile;
    }
  }

  if (inputFilePath) {
    console.log(`📂 Đang đọc dữ liệu tài khoản từ file: ${inputFilePath}`);
    try {
      const fileContent = fs.readFileSync(inputFilePath, 'utf8');
      const parsed = JSON.parse(fileContent);
      
      if (parsed && Array.isArray(parsed.data)) {
        pages = parsed.data;
      } else if (Array.isArray(parsed)) {
        pages = parsed;
      } else {
        console.warn('⚠️ Định dạng JSON không khớp (mảng hoặc đối tượng chứa mảng "data"). Thử lấy mảng "data" hoặc chuyển sang mặc định.');
        pages = defaultPages;
      }
    } catch (err: any) {
      console.error(`❌ Lỗi khi đọc file JSON: ${err.message}. Chuyển sang danh sách tài khoản mặc định.`);
      pages = defaultPages;
    }
  } else {
    console.log('💡 Không truyền file JSON đầu vào và không tìm thấy "meta-accounts-input.json".');
    console.log('💡 Sử dụng danh sách tài khoản mặc định cấu hình trong mã nguồn.');
    pages = defaultPages;
  }

  // 2. Lấy workspace đầu tiên tìm thấy
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

  if (pages.length === 0) {
    console.warn('⚠️ Không tìm thấy tài khoản nào để upsert.');
    return;
  }

  console.log(`📊 Đang chuẩn bị xử lý ${pages.length} tài khoản...\n`);

  for (const page of pages) {
    console.log(`── Đang xử lý: ${page.name} (FB ID: ${page.id}) ──`);

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
        // 2a. Upsert platform_account cho Facebook Page
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

        console.log(`  ✅ Facebook platform_accounts upserted (id: ${account.id})`);

        // 2b. Upsert meta_tokens cho Facebook Page
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
          console.log(`  ✅ Facebook meta_tokens updated (id: ${existingToken.id})`);
        } else {
          const newToken = await tx.meta_tokens.create({
            data: {
              account_id: account.id,
              encrypted_access_token: encryptedToken,
              expires_at: tokenExpiry,
            },
          });
          console.log(`  ✅ Facebook meta_tokens created (id: ${newToken.id})`);
        }

        // 2c. Nếu có liên kết Instagram, upsert cả Instagram account
        if (instagramId) {
          const igAccount = await tx.platformAccount.upsert({
            where: {
              platform_platform_user_id: {
                platform: 'instagram',
                platform_user_id: instagramId,
              },
            },
            update: {
              platform_user_name: `${page.name} (Instagram)`,
              workspaceId: workspace.id,
              disconnected_at: null,
              metadata: {
                facebook_page_id: page.id,
                category: page.category
              },
            },
            create: {
              workspaceId: workspace.id,
              profile_id: profileId,
              platform: 'instagram',
              platform_user_id: instagramId,
              platform_user_name: `${page.name} (Instagram)`,
              metadata: {
                facebook_page_id: page.id,
                category: page.category
              },
            },
          });

          console.log(`  ✅ Instagram platform_accounts upserted (id: ${igAccount.id})`);

          const existingIgToken = await tx.meta_tokens.findFirst({
            where: { account_id: igAccount.id },
          });

          if (existingIgToken) {
            await tx.meta_tokens.update({
              where: { id: existingIgToken.id },
              data: {
                encrypted_access_token: encryptedToken,
                expires_at: tokenExpiry,
                updated_at: new Date(),
              },
            });
            console.log(`  ✅ Instagram meta_tokens updated (id: ${existingIgToken.id})`);
          } else {
            const newIgToken = await tx.meta_tokens.create({
              data: {
                account_id: igAccount.id,
                encrypted_access_token: encryptedToken,
                expires_at: tokenExpiry,
              },
            });
            console.log(`  ✅ Instagram meta_tokens created (id: ${newIgToken.id})`);
          }
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
