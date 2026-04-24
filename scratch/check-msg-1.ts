import { db } from '../src/lib/db';

async function checkMessageDetail() {
  const msg = await db.message.findFirst({
    where: { content: '1' },
    include: {
      conversation: {
          include: {
              platform_accounts: true
          }
      }
    }
  });

  console.log('🔍 Message "1" Detail:');
  console.log(JSON.stringify(msg, null, 2));
}

checkMessageDetail().catch(console.error);
