import { db } from '../src/lib/db';

async function checkLogs() {
  const logs = await db.aIReplyLog.findMany({
    where: {
      created_at: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    include: {
      message: true
    }
  });

  console.log(`📝 Found ${logs.length} AI logs from today:`);
  logs.forEach(l => {
    console.log(`- [${l.status}] Model: ${l.model} | Triggered by: "${l.message?.content}" | Reply: "${l.response}"`);
  });
}

checkLogs().catch(console.error);
