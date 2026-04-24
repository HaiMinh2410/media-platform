import { db } from '../src/lib/db';

async function checkLatestIntents() {
  const logs = await db.aIReplyLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      message: true
    }
  });

  console.log('🤖 Latest AI Reply Intents:');
  logs.forEach(l => {
    console.log(`- Triggered by: "${l.message?.content}" | Prompt/Intent: ${l.prompt} | Status: ${l.status}`);
  });
}

checkLatestIntents().catch(console.error);
