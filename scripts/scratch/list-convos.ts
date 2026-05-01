import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const db = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) });
async function main() {
  const convos = await db.conversation.findMany({ select: { id: true, customer_name: true } });
  console.log(JSON.stringify(convos, null, 2));
}
main().finally(() => db.$disconnect());
