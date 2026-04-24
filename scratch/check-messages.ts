import { db } from '../src/lib/db';

async function checkBotStatus() {
  const IG_PAGE_ID = '17841477493647789'; // Correct IG ID
  
  const account = await db.platformAccount.findFirst({
    where: { platform_user_id: IG_PAGE_ID }
  });

  if (!account) {
    console.error('❌ Account not found!');
    return;
  }

  const latestMessages = await db.message.findMany({
    where: { 
        conversation: {
            account_id: account.id
        }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('💬 Latest Messages:');
  latestMessages.forEach(m => {
    console.log(`- [${m.senderType}] ${m.content} (${m.createdAt.toISOString()})`);
  });
}

checkBotStatus().catch(console.error);
