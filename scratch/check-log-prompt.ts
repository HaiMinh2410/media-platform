import { db } from '../src/lib/db';

async function checkLogPrompt() {
  const log = await db.aIReplyLog.findUnique({
    where: { id: 'e8338da6-b022-426f-8947-2aeddbf89b36' }
  });

  if (!log) {
    console.log('❌ Log not found.');
    return;
  }

  console.log('================ LOG PROMPT ===============');
  console.log(log.prompt);
  console.log('===========================================');
}

checkLogPrompt().catch(console.error);
