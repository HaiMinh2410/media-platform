import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const db = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) });

async function main() {
  console.log('=== Conversations của Instagram accounts ===\n');

  const igConvos = await db.conversation.findMany({
    where: { platform_accounts: { platform: 'instagram' } },
    include: {
      platform_accounts: { select: { platform_user_name: true, platform_user_id: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 3, select: { content: true, senderType: true, createdAt: true } }
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 10,
  });

  if (igConvos.length === 0) {
    console.log('❌ Không có conversation Instagram nào trong DB!');
    console.log('   → idempotentPersistMessage có thể đang fail');
  }

  for (const c of igConvos) {
    console.log(`[@${c.platform_accounts.platform_user_name}] conv=${c.id.substring(0,8)} sender=${c.platform_conversation_id}`);
    console.log(`  Status: ${c.status} | lastMsg: ${c.lastMessageAt.toISOString()}`);
    for (const m of c.messages) {
      console.log(`  [${m.senderType}] "${m.content.substring(0,60)}" @ ${m.createdAt.toISOString()}`);
    }
    console.log('');
  }

  // Kiểm tra error logs trong webhook worker
  console.log('\n=== Webhook Events Instagram (latest 5) ===');
  const events = await db.webhookEvent.findMany({
    where: { platform: 'instagram' },
    orderBy: { receivedAt: 'desc' },
    take: 5,
    select: { id: true, externalPageId: true, externalSenderId: true, messageText: true, receivedAt: true, parentLogId: true }
  });
  for (const e of events) {
    const convExists = await db.conversation.findFirst({
      where: { platform_conversation_id: e.externalSenderId }
    });
    console.log(`  [${e.receivedAt.toISOString().substring(11,19)}] IG=${e.externalPageId} sender=${e.externalSenderId} msg="${e.messageText}" → conv: ${convExists ? '✅' : '❌ KHÔNG TÌM THẤY'}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
