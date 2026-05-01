/**
 * Script: check-instagram-accounts.ts
 * Kiểm tra các Instagram accounts trong DB và tìm Facebook page linked với chúng
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Instagram Accounts ===');
  const igAccounts = await db.platformAccount.findMany({
    where: { platform: 'instagram' },
    include: { meta_tokens: { take: 1 } }
  });
  console.log(JSON.stringify(igAccounts.map(a => ({
    id: a.id,
    platform_user_id: a.platform_user_id,
    name: a.platform_user_name,
    hasToken: a.meta_tokens.length > 0,
    metadata: a.metadata,
  })), null, 2));

  console.log('\n=== Facebook Accounts ===');
  const fbAccounts = await db.platformAccount.findMany({
    where: { platform: 'facebook' },
    include: { meta_tokens: { take: 1 } }
  });
  console.log(JSON.stringify(fbAccounts.map(a => ({
    id: a.id,
    platform_user_id: a.platform_user_id,
    name: a.platform_user_name,
    hasToken: a.meta_tokens.length > 0,
    metadata: a.metadata,
  })), null, 2));
}

main().finally(() => db.$disconnect());
