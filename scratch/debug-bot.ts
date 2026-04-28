import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Checking latest bot configurations and activity...');
  
  const latestConvo = await prisma.conversation.findFirst({
    orderBy: { lastMessageAt: 'desc' },
    include: { platform_accounts: { include: { bot_configurations: true } } }
  });

  if (!latestConvo) {
    console.log('No conversations found.');
    return;
  }

  console.log('Latest Conversation ID:', latestConvo.id);
  console.log('Account:', latestConvo.platform_accounts.platform_user_name);
  console.log('Bot Active:', latestConvo.platform_accounts.bot_configurations?.is_active);
  console.log('Auto Send:', latestConvo.platform_accounts.bot_configurations?.auto_send);
  console.log('Allowed Priorities:', (latestConvo.platform_accounts.bot_configurations as any)?.auto_reply_priorities);
  console.log('Allowed Sentiments:', (latestConvo.platform_accounts.bot_configurations as any)?.auto_reply_sentiments);

  const latestMessage = await prisma.message.findFirst({
    where: { conversationId: latestConvo.id },
    orderBy: { createdAt: 'desc' },
    include: { aiReplyLogs: true }
  });

  if (latestMessage) {
    console.log('Latest Message Content:', latestMessage.content);
    console.log('AI Reply Logs Status:', latestMessage.aiReplyLogs.map(l => l.status));
  }
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
