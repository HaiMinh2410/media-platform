import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const db = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) });

async function main() {
  // 1. Xem canonical conversation là gì
  const HIDDEN_CONVO_ID = '236bb43e-68e1-45f6-9869-0e940d7f0848'; // lunars_ng, bị ẩn
  const CANONICAL_ID = '79c566a2-6494-44cd-b076-7da11059f668';   // canonical được gán

  console.log('=== Canonical conversation ===');
  const canonical = await db.conversation.findUnique({
    where: { id: CANONICAL_ID },
    include: { platform_accounts: { select: { platform: true, platform_user_name: true, platform_user_id: true } } }
  });
  console.log(JSON.stringify({
    id: canonical?.id,
    account: canonical?.platform_accounts?.platform_user_name,
    platform: canonical?.platform_accounts?.platform,
    sender: canonical?.platform_conversation_id,
    lastMsg: canonical?.lastMessageAt,
  }, null, 2));

  // 2. Unset canonical cho conversation lunars_ng
  // Logic: conversation lunars_ng (instagram) không phải duplicate của _sullybbi (instagram cũ)
  // Chúng là 2 người dùng khác nhau nhắn tin với 2 IG accounts khác nhau
  console.log('\n🔧 Unsetting canonical_conversation_id for lunars_ng conversation...');
  await db.conversation.update({
    where: { id: HIDDEN_CONVO_ID },
    data: { canonical_conversation_id: null }
  });
  console.log('✅ Done! conversation lunars_ng giờ hiển thị trong UI');

  // 3. Kiểm tra xem còn conversation nào khác bị ẩn sai không
  console.log('\n=== Tất cả conversations có canonical set ===');
  const withCanonical = await db.conversation.findMany({
    where: { canonical_conversation_id: { not: null } },
    include: { platform_accounts: { select: { platform: true, platform_user_name: true } } },
    select: {
      id: true,
      platform_conversation_id: true,
      canonical_conversation_id: true,
      lastMessageAt: true,
      platform_accounts: true,
    }
  });
  for (const c of withCanonical) {
    console.log(`  ${c.id.substring(0,8)} [@${c.platform_accounts.platform_user_name}] → canonical=${c.canonical_conversation_id!.substring(0,8)}`);
  }
  if (withCanonical.length === 0) console.log('  (none)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
