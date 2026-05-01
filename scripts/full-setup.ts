/**
 * Script: full-setup.ts
 * Setup hoàn chỉnh cho 3 FB Pages + IG accounts linked:
 * 1. Upsert FB page vào platform_accounts + meta_tokens
 * 2. Query Graph API lấy linked IG account
 * 3. Upsert IG platform_account với FB page token
 * 4. Subscribe FB page webhook (messages, postbacks...)
 * 5. Subscribe IG account webhook (messages cho Instagram Direct)
 * 6. Cập nhật metadata.instagram_id trên FB page
 *
 * Chạy: bun run scripts/full-setup.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const GV = 'v21.0'; // Graph API version

// ── 3 Facebook Pages cần setup ────────────────────────────────────────────
const FB_PAGES = [
  {
    id: '1122137857642529',
    name: 'Kathryn',
    access_token: 'EABAX69avEfIBRVYXFUCIW2rd3GkvM3MszNzRtU9ZA8E5ygD8CMOGa13ZCXDeErxGL1HZBLmYGDRC07564Vm4lXe8nezuejBiXRFqZA75nPvqyK33yklSJJyFMSmpgZAwZCweaiJZALivm3nKqQh273wkPpym2hOwAZCw03V3c2MeMuwEz4e73SoXJ92drTRW2ZAAjwTideQcNc4qqZAhTsSMmxBiIh',
    category: 'Người sáng tạo nội dung số',
  },
  {
    id: '1044468135423441',
    name: 'Minh Anh',
    access_token: 'EABAX69avEfIBRSunEJSliu6MRde3MZAFRSjTT4COfkwwQICZB9uTXnI1ZAZBor9CaDviE6dWc6UkhP7h0XJy0YHcBCY2chQDLpKbPxwmIL2kTcaQDDSMXi6P9KH0lMXoR7wDHTrJpQPQ1cA25ZBsl4FmzuOdH2e0h7d2SinxxlCzDyJbCfuMtlpOkitEZCqtDjRJ8wUWK5PkLXavbQf6aXO7Sn',
    category: 'Người sáng tạo nội dung số',
  },
  {
    id: '1142742645581562',
    name: 'Nguyễn An Thư',
    access_token: 'EABAX69avEfIBRTukuDZAALm2CasjQ1sYS73lMXivOZCu7QIa9sv4tzVk7lV8IlEZCo1o2aWUlFZCPLT9bmHYKtVAZBEkAAIFYZAJ9SVq1BJfhjL5lHtjbGDtUtEIxibNZASZC6fZAYfyRbKSnuoWYYmLwh6ZCPTsuBmrwBhmestcOWzPyZAhJJjAMLVc1aNEpFrSXmZB4HLEoak0XZAjtZCZBE0r54jFErG',
    category: 'Người sáng tạo nội dung số',
  },
];

// Fields cho Facebook Page Messenger
const FB_SUBSCRIBED_FIELDS = ['messages', 'messaging_postbacks', 'messaging_referrals', 'message_reads'];

// Fields cho Instagram Direct (tên khác với FB page)
const IG_SUBSCRIBED_FIELDS = ['messages', 'messaging_postbacks', 'messaging_referral', 'messaging_seen'];

// ── Helpers ────────────────────────────────────────────────────────────────
function encryptToken(text: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY!;
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ct = cipher.update(text, 'utf8', 'hex');
  ct += cipher.final('hex');
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ct}`;
}

async function graphGet(path: string, token: string): Promise<any> {
  // Nếu path đã có '?' thì dùng '&' để nối access_token, ngược lại dùng '?'
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://graph.facebook.com/${GV}/${path}${sep}access_token=${token}`);
  return res.json();
}

async function graphPost(path: string, token: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(`https://graph.facebook.com/${GV}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  });
  return res.json();
}

async function subscribeWebhook(id: string, token: string, fields: string[], label: string): Promise<boolean> {
  const json = await graphPost(`${id}/subscribed_apps`, token, { subscribed_fields: fields });
  if (json.success) {
    console.log(`    ✅ ${label} webhook subscribed`);
    return true;
  }
  console.log(`    ❌ ${label} webhook failed: ${json.error?.message}`);
  return false;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Full Setup: FB Pages + IG Accounts\n');

  // Get workspace
  const workspace = await db.workspace.findFirst({
    include: { workspace_members: { take: 1 } },
  });
  if (!workspace || !workspace.workspace_members[0]) throw new Error('No workspace/member found');
  const profileId = workspace.workspace_members[0].profile_id;
  const workspaceId = workspace.id;
  const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  console.log(`✅ Workspace: ${workspace.name}\n`);

  for (const page of FB_PAGES) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📄 ${page.name} (FB Page ID: ${page.id})`);
    console.log(`${'─'.repeat(50)}`);

    // ── Step 1: Upsert FB platform_account ──────────────────────────────
    console.log('  [1] Upserting FB platform_account...');

    // First: check if IG is linked to get instagram_id
    const pageInfo = await graphGet(`${page.id}?fields=instagram_business_account`, page.access_token);
    const igLinked = pageInfo.instagram_business_account ?? null;

    const metadata: Record<string, any> = { category: page.category };
    if (igLinked) metadata.instagram_id = igLinked.id;

    const fbAccount = await db.platformAccount.upsert({
      where: { platform_platform_user_id: { platform: 'facebook', platform_user_id: page.id } },
      update: { platform_user_name: page.name, disconnected_at: null, metadata },
      create: { workspaceId, profile_id: profileId, platform: 'facebook', platform_user_id: page.id, platform_user_name: page.name, metadata },
    });
    console.log(`    ✅ FB account: ${fbAccount.id}`);

    // Upsert FB token
    const encFbToken = encryptToken(page.access_token);
    const existingFbToken = await db.meta_tokens.findFirst({ where: { account_id: fbAccount.id } });
    if (existingFbToken) {
      await db.meta_tokens.update({ where: { id: existingFbToken.id }, data: { encrypted_access_token: encFbToken, expires_at: tokenExpiry, updated_at: new Date() } });
    } else {
      await db.meta_tokens.create({ data: { account_id: fbAccount.id, encrypted_access_token: encFbToken, expires_at: tokenExpiry } });
    }
    console.log(`    ✅ FB token upserted`);

    // ── Step 2: Subscribe FB Page webhook ───────────────────────────────
    console.log('  [2] Subscribing FB Page webhook...');
    await subscribeWebhook(page.id, page.access_token, FB_SUBSCRIBED_FIELDS, 'FB Page');

    // ── Step 3: Setup linked IG account ─────────────────────────────────
    if (!igLinked) {
      console.log('  [3] No Instagram account linked to this page — skipping IG setup');
      continue;
    }

    const igId = igLinked.id;

    // Get IG account name
    const igInfo = await graphGet(`${igId}?fields=id,name,username`, page.access_token);
    const igName = igInfo.username ?? igInfo.name ?? `ig_${igId}`;
    console.log(`  [3] Linked IG: @${igName} (ID: ${igId})`);

    // ── Step 3a: Upsert IG platform_account ─────────────────────────────
    const igAccount = await db.platformAccount.upsert({
      where: { platform_platform_user_id: { platform: 'instagram', platform_user_id: igId } },
      update: { platform_user_name: igName, disconnected_at: null },
      create: { workspaceId, profile_id: profileId, platform: 'instagram', platform_user_id: igId, platform_user_name: igName, metadata: {} },
    });
    console.log(`    ✅ IG account upserted: ${igAccount.id}`);

    // ── Step 3b: Store FB page token as IG token ─────────────────────────
    // Instagram send uses FB Page token, stored against the IG account
    const existingIgToken = await db.meta_tokens.findFirst({ where: { account_id: igAccount.id } });
    if (existingIgToken) {
      await db.meta_tokens.update({ where: { id: existingIgToken.id }, data: { encrypted_access_token: encFbToken, expires_at: tokenExpiry, updated_at: new Date() } });
      console.log(`    ✅ IG token updated (using FB page token)`);
    } else {
      await db.meta_tokens.create({ data: { account_id: igAccount.id, encrypted_access_token: encFbToken, expires_at: tokenExpiry } });
      console.log(`    ✅ IG token created (using FB page token)`);
    }

    // ── Step 3c: Subscribe IG account webhook ────────────────────────────
    console.log(`  [4] Subscribing IG account webhook (@${igName})...`);
    await subscribeWebhook(igId, page.access_token, IG_SUBSCRIBED_FIELDS, `IG @${igName}`);
  }

  console.log('\n\n🎉 Full setup complete!\n');

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('📊 Final state:');
  const allAccounts = await db.platformAccount.findMany({
    where: { workspaceId, platform: { in: ['facebook', 'instagram'] } },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } },
  });
  for (const acc of allAccounts) {
    const hasValidToken = acc.meta_tokens[0] ? '✅ token' : '❌ no token';
    console.log(`  [${acc.platform.padEnd(10)}] ${acc.platform_user_name.padEnd(25)} | ID: ${acc.platform_user_id} | ${hasValidToken}`);
  }
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => db.$disconnect());
