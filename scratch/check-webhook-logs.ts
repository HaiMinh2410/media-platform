import { db } from '../src/lib/db';

async function run() {
  const latestEvents = await db.webhookEvent.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 5,
  });

  console.log('--- Latest Webhook Events ---');
  for (const event of latestEvents) {
    console.log(`ID: ${event.id}`);
    console.log(`Platform: ${event.platform}`);
    console.log(`Sender: ${event.externalSenderId}`);
    console.log(`Page: ${event.externalPageId}`);
    console.log(`Message: ${event.messageText}`);
    console.log(`Received At: ${event.receivedAt}`);
    const payload = event.payload as any;
    const isTyping = payload?.entry?.[0]?.messaging?.[0]?.sender_action;
    console.log(`Sender Action: ${isTyping || 'none'}`);
    console.log('---------------------------');
  }
}

run().catch(console.error);
