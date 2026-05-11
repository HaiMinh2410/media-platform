import { db } from '../src/lib/db';
import { retrieveContext } from '../src/application/ai-agent/context-retriever';

async function testRecentMessages() {
  const latestLog = await db.aIReplyLog.findFirst({
    orderBy: { created_at: 'desc' },
  });

  if (!latestLog) {
    console.log('❌ No AI reply log found.');
    return;
  }

  // Get conversationId of latest log
  const message = await db.message.findUnique({
    where: { id: latestLog.messageId },
    select: { conversationId: true }
  });

  if (!message) {
    console.log('❌ Message not found.');
    return;
  }

  const { recentMessages } = await retrieveContext(message.conversationId);

  console.log('=== RAW RECENT MESSAGES ===');
  console.log(JSON.stringify(recentMessages, null, 2));

  // Use (msg.role as string) to avoid TS compiler errors in test scripts
  const mappedRecentMessagesIncorrect = recentMessages.map((msg) => ({
    role: (msg.role as string) === 'agent' ? 'you' as const : 'fan' as const,
    content: msg.content,
  }));

  console.log('\n=== INCORRECT MAPPED RECENT MESSAGES (USED IN GENERATOR) ===');
  console.log(JSON.stringify(mappedRecentMessagesIncorrect, null, 2));

  // The correct mapping logic:
  const mappedRecentMessagesCorrect = recentMessages.map((msg) => ({
    role: msg.role === 'you' ? 'you' as const : 'fan' as const,
    content: msg.content,
  }));

  console.log('\n=== CORRECT MAPPED RECENT MESSAGES ===');
  console.log(JSON.stringify(mappedRecentMessagesCorrect, null, 2));
}

testRecentMessages().catch(console.error);
