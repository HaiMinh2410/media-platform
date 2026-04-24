import { db } from '../src/lib/db';

async function checkWebhookEvents() {
  const events = await db.webhookEvent.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 5
  });

  console.log('📨 Latest Webhook Events:');
  console.log(JSON.stringify(events, null, 2));
}

checkWebhookEvents().catch(console.error);
