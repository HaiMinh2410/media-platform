import { db } from '@/lib/db';
import { idempotentPersistMessage } from '../message.repository';

async function main() {
  console.log('=== Diagnosing Webhook Processing ===');

  // Find the last 2 webhook events
  const events = await db.webhookEvent.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 2,
  });

  if (events.length === 0) {
    console.log('❌ No webhook events found in DB!');
    return;
  }

  for (const ev of events) {
    console.log(`\nAnalyzing event ID: ${ev.id}`);
    console.log(`  Platform: ${ev.platform}`);
    console.log(`  Recipient ID (externalPageId): ${ev.externalPageId}`);
    console.log(`  Sender ID (externalSenderId): ${ev.externalSenderId}`);
    console.log(`  Message: "${ev.messageText}"`);

    // Let's check if the platform account exists in the DB
    const account = await db.platformAccount.findFirst({
      where: {
        platform: ev.platform === 'messenger' ? 'facebook' : ev.platform,
        platform_user_id: ev.externalPageId,
      }
    });

    if (account) {
      console.log(`  ✅ Account found in DB: id=${account.id}, name=${account.platform_user_name}, platform=${account.platform}`);
    } else {
      console.log(`  ❌ Account NOT found in DB! Searching why...`);
      const anyAccountWithThisId = await db.platformAccount.findFirst({
        where: { platform_user_id: ev.externalPageId }
      });
      if (anyAccountWithThisId) {
        console.log(`    ⚠️ Found account with ID ${ev.externalPageId} but for platform: "${anyAccountWithThisId.platform}" (expected "${ev.platform}")`);
      } else {
        console.log(`    ⚠️ No account exists with ID ${ev.externalPageId} at all.`);
      }
    }

    // Now let's try running idempotentPersistMessage directly to see what happens
    console.log('  Running idempotentPersistMessage...');
    const result = await idempotentPersistMessage({
      platform: ev.platform,
      externalPageId: ev.externalPageId,
      externalSenderId: ev.externalSenderId,
      platformMessageId: `diag_${Date.now()}_${ev.id.substring(0, 8)}`,
      senderType: 'user',
      messageText: ev.messageText || 'Hello',
      timestamp: new Date(),
    });

    if (result.error) {
      console.log(`  ❌ Persist failed with error: "${result.error}"`);
    } else {
      console.log(`  ✅ Persist SUCCEEDED! Result:`, result.data);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
