import { db } from '../src/lib/db';

async function checkLatestAIStatus() {
  const logs = await db.aIReplyLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      message: true
    }
  });

  console.log('🤖 Latest AI Reply Logs:');
  logs.forEach(l => {
    console.log(`- ID: ${l.id} | Status: ${l.status} | Triggered by: "${l.message?.content}" | Reply: "${l.response.substring(0, 30)}..."`);
  });
}

checkLatestAIStatus().catch(console.error);
