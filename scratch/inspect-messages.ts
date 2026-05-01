import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const messages = await db.message.findMany({
    where: { conversationId: '236bb43e-68e1-45f6-9869-0e940d7f0848' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(messages, null, 2));
  await db.$disconnect();
}

main();
