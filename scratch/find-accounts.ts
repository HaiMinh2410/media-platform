import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const igAccounts = await db.platformAccount.findMany({
    where: { platform: 'instagram' }
  });

  console.log('IG Accounts:', igAccounts.map(a => ({ name: a.platform_user_name, id: a.platform_user_id })));

  await db.$disconnect();
}

main();
