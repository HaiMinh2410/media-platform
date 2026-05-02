import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { customer_name: { contains: 'Hai Minh', mode: 'insensitive' } },
        { platform_conversation_id: { contains: 'baby__.xoxo', mode: 'insensitive' } },
        { platform_conversation_id: { contains: '1655975622194602' } }
      ]
    },
    include: {
      customer_platform_mappings: true,
      _count: {
        select: { messages: { where: { is_read: false } } }
      }
    }
  });

  console.log(JSON.stringify(conversations, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
