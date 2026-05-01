import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const groupsCount = await db.accountGroup.count();
  const membersCount = await db.accountGroupMembership.count();
  const accountsCount = await db.platformAccount.count();

  const allAccounts = await db.platformAccount.findMany();
  console.log('All Accounts:', allAccounts.map(a => ({ id: a.id, platform: a.platform, name: a.platform_user_name })));

  console.log({ groupsCount, membersCount, accountsCount });

  const groups = await db.accountGroup.findMany({
    include: { members: { include: { account: true } } }
  });

  console.log('Groups:', JSON.stringify(groups, null, 2));

  await db.$disconnect();
}

main();
