import { db } from '../src/lib/db';

async function triggerMessage() {
  const conversationId = '236bb43e-68e1-45f6-9869-0e940d7f0848'; // Using the one from terminal logs
  console.log(`📡 Triggering test message for conversation ${conversationId}...`);
  
  await db.message.create({
    data: {
      conversationId,
      senderId: 'test-sender',
      content: 'Hello Realtime Test!',
      platform_message_id: `test-${Date.now()}`,
      senderType: 'user'
    }
  });
  
  console.log('✅ Message created.');
}

triggerMessage().catch(console.error);
