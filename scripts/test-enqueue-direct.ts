import { db } from '@/lib/db';
import { queueService } from '@/application/queue/queue.service';
import { Queue } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName } from '@/domain/types/queue';

async function main() {
  console.log('🧪 Starting Direct Enqueue and Queue Check Test...');

  // 1. Find a connected platform account
  const account = await db.platformAccount.findFirst({
    where: { disconnected_at: null },
  });

  if (!account) {
    console.error('❌ No connected platform account found in DB!');
    return;
  }

  console.log(`✅ Using account: [${account.platform.toUpperCase()}] ${account.platform_user_name} (${account.platform_user_id})`);

  // 2. Create a mock WebhookEvent in the database
  const uniqueId = `test_msg_${Date.now()}`;
  const event = await db.webhookEvent.create({
    data: {
      platform: account.platform === 'facebook' ? 'facebook' : 'instagram',
      externalSenderId: 'sender_test_user_99',
      externalPageId: account.platform_user_id,
      messageText: `Tin nhắn test lúc ${new Date().toLocaleTimeString()}`,
      payload: { test: true },
      headers: { test: true },
      receivedAt: new Date(),
    },
  });

  console.log(`✅ Created mock WebhookEvent in DB with ID: ${event.id}`);

  // 3. Enqueue it
  console.log('🚀 Enqueuing event via queueService.enqueueWebhookProcessing...');
  const enqueueResult = await queueService.enqueueWebhookProcessing({
    webhookEventId: event.id,
    platform: account.platform === 'facebook' ? 'facebook' : 'instagram' as any,
    eventType: 'message',
    externalSenderId: 'sender_test_user_99',
    externalPageId: account.platform_user_id,
    platformMessageId: `mid_test_${Date.now()}`,
    messageText: event.messageText,
    timestamp: event.receivedAt.toISOString(),
    isEcho: false,
  });

  if (enqueueResult.error) {
    console.error('❌ Enqueue failed:', enqueueResult.error);
    return;
  }

  console.log(`✅ Enqueued successfully! Job ID: ${enqueueResult.data}`);

  // 4. Immediately check queue status
  if (!redisConnection) {
    console.error('❌ Redis connection is undefined!');
    return;
  }
  const queue = new Queue(QueueName.WEBHOOK_EVENTS, { connection: redisConnection as any });

  // Wait a moment for any active worker to pick it up or process
  console.log('Waiting 3 seconds for worker to process or ignore...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const activeJobs = await queue.getActive();
  const waitingJobs = await queue.getWaiting();
  const failedJobs = await queue.getFailed();
  const completedJobs = await queue.getCompleted();

  console.log(`Queue stats:`);
  console.log(`  Active: ${activeJobs.length}`);
  console.log(`  Waiting: ${waitingJobs.length}`);
  console.log(`  Failed: ${failedJobs.length}`);
  console.log(`  Completed: ${completedJobs.length}`);

  // Find our specific job in failed or completed lists
  const failedJob = failedJobs.find(j => j.id === event.id);
  const completedJob = completedJobs.find(j => j.id === event.id);
  const activeJob = activeJobs.find(j => j.id === event.id);
  const waitingJob = waitingJobs.find(j => j.id === event.id);

  if (activeJob) {
    console.log(`👉 Job is currently ACTIVE (running).`);
  } else if (waitingJob) {
    console.log(`👉 Job is currently WAITING in the queue.`);
  } else if (failedJob) {
    console.log(`❌ Job FAILED with reason: "${failedJob.failedReason}"`);
    if (failedJob.stacktrace) {
      console.log('Stacktrace:', failedJob.stacktrace.slice(0, 2).join('\n'));
    }
  } else if (completedJob) {
    console.log(`✅ Job COMPLETED successfully!`);
  } else {
    console.log(`❓ Job is nowhere to be found! (Probably completed and automatically removed, or not processed)`);
    // Check if the message is in the DB
    const message = await db.message.findFirst({
      where: { content: event.messageText || '' }
    });
    if (message) {
      console.log(`✅ Verified: The Message was SUCCESSFULLY persisted in the database!`);
    } else {
      console.log(`❌ Checked DB: No message was persisted in the database! This means the job was lost or not processed.`);
    }
  }

  await queue.close();
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
