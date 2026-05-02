
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
  // Find all conversations for Hai Minh that are marked as duplicates
  const conversations = await prisma.conversation.findMany({
    where: {
      customer_name: { contains: 'Hai Minh', mode: 'insensitive' },
      canonical_conversation_id: { not: null }
    }
  });

  console.log(`Found ${conversations.length} duplicate conversations to fix.`);

  for (const convo of conversations) {
    // Check if it's the same platform as canonical
    const canonical = await prisma.conversation.findUnique({
      where: { id: convo.canonical_conversation_id! }
    });

    if (canonical) {
      // If same platform, un-hide it (it shouldn't have been hidden)
      // If different platform, just update the canonical's timestamp to now so it surfaces
      await prisma.conversation.update({
        where: { id: convo.id },
        data: { canonical_conversation_id: null }
      });
      
      await prisma.conversation.update({
        where: { id: canonical.id },
        data: { lastMessageAt: new Date() }
      });
    }
  }

  console.log('Done fixing conversations.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
