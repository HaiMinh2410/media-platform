import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const accs = await db.platformAccount.findMany();
  console.log(JSON.stringify(accs, null, 2));
  await db.$disconnect();
}

main();
