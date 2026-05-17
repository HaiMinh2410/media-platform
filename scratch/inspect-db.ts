import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
  
  const snapshots = await db.$queryRaw<any[]>`
    SELECT date, reach, accounts_reached, followers_pct, nonfollowers_pct, by_content_views
    FROM analytics_snapshots
    WHERE account_id = ${accountId}::uuid
    ORDER BY date DESC
    LIMIT 10
  `;
  
  console.log(`Checking snapshots for Nguyen An Thu (Instagram):`);
  console.log(JSON.stringify(snapshots, null, 2));
  
  await db.$disconnect();
}

main();
