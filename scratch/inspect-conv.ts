import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const conv = await db.conversation.findUnique({
    where: { id: '236bb43e-68e1-45f6-9869-0e940d7f0848' },
    include: { platform_accounts: true }
  });
  console.log(JSON.stringify(conv, null, 2));
  await db.$disconnect();
}

main();
