import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Checking Conversations Database ===\n');

  // Lấy tất cả tài khoản Instagram
  const igAccounts = await db.platformAccount.findMany({
    where: { platform: 'instagram' },
    select: { id: true, platform_user_name: true, platform_user_id: true }
  });

  console.log(`📱 Có ${igAccounts.length} tài khoản Instagram kết nối:`);
  for (const acc of igAccounts) {
    console.log(`  🔹 ${acc.platform_user_name} (ID: ${acc.platform_user_id} | DB UUID: ${acc.id})`);
    
    // Tìm các hội thoại thuộc tài khoản này
    const conversations = await db.conversation.findMany({
      where: { account_id: acc.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    console.log(`    └─ Số lượng hội thoại trong DB: ${conversations.length}`);
    for (const conv of conversations) {
      console.log(`      ├─ ID: ${conv.id}`);
      console.log(`         ├─ Platform Sender ID: ${conv.platform_conversation_id}`);
      console.log(`         ├─ Customer Name: "${conv.customer_name}" | Username: "${conv.customer_username}"`);
      console.log(`         ├─ Canonical ID (Duplicate link): ${conv.canonical_conversation_id}`);
      console.log(`         ├─ Last Message At: ${conv.lastMessageAt.toISOString()}`);
      console.log(`         ├─ Unread Messages: ${conv._count.messages}`);
      console.log(`         └─ Tin nhắn cuối: "${conv.messages[0]?.content || '(không có)'}"`);
    }
    console.log();
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
