import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const db = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) });

async function main() {
  // Lấy chi tiết conversation của lunars_ng sender=1001499849209648
  const convos = await db.conversation.findMany({
    where: { platform_conversation_id: '1001499849209648' },
    include: {
      platform_accounts: { select: { platform: true, platform_user_id: true, platform_user_name: true } },
    }
  });

  console.log('=== Conversations cho sender 1001499849209648 ===');
  for (const c of convos) {
    console.log(`\n  ID: ${c.id}`);
    console.log(`  Account: @${c.platform_accounts.platform_user_name} [${c.platform_accounts.platform}] (${c.platform_accounts.platform_user_id})`);
    console.log(`  canonical_conversation_id: ${c.canonical_conversation_id ?? 'NULL (visible in UI)'}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  LastMsgAt: ${c.lastMessageAt.toISOString()}`);
  }

  // Kiểm tra xem conversations nào bị ẩn bởi canonical_conversation_id filter
  const hiddenCount = await db.conversation.count({
    where: { 
      platform_accounts: { platform: 'instagram' },
      canonical_conversation_id: { not: null }
    }
  });
  console.log(`\n=== IG Conversations bị ẩn (duplicate filter) ===`);
  console.log(`Count: ${hiddenCount}`);

  const visibleCount = await db.conversation.count({
    where: { 
      platform_accounts: { platform: 'instagram' },
      canonical_conversation_id: null
    }
  });
  console.log(`Visible (canonical=null): ${visibleCount}`);

  // Xem toàn bộ visible IG convos
  console.log('\n=== Visible IG Conversations ===');
  const visible = await db.conversation.findMany({
    where: {
      platform_accounts: { platform: 'instagram' },
      canonical_conversation_id: null,
    },
    include: { platform_accounts: { select: { platform_user_name: true, platform_user_id: true } } },
    orderBy: { lastMessageAt: 'desc' },
    take: 10,
  });
  for (const c of visible) {
    console.log(`  @${c.platform_accounts.platform_user_name} | sender=${c.platform_conversation_id} | last=${c.lastMessageAt.toISOString().substring(0,19)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
