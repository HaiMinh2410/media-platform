import { Queue } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName } from '@/domain/types/queue';

async function main() {
  if (!redisConnection) {
    console.error('Redis connection is missing');
    return;
  }

  console.log('=== Checking BullMQ Failed Jobs ===\n');

  const queue = new Queue(QueueName.WEBHOOK_EVENTS, { connection: redisConnection });

  const failedJobs = await queue.getFailed();
  const activeJobs = await queue.getActive();
  const waitingJobs = await queue.getWaiting();
  const delayedJobs = await queue.getDelayed();
  const completedJobs = await queue.getCompleted();

  console.log(`📊 Queue Stats:`);
  console.log(`  🔹 Active: ${activeJobs.length}`);
  console.log(`  🔹 Waiting: ${waitingJobs.length}`);
  console.log(`  🔹 Delayed: ${delayedJobs.length}`);
  console.log(`  🔹 Failed: ${failedJobs.length}`);
  console.log(`  🔹 Completed: ${completedJobs.length}`);

  if (failedJobs.length > 0) {
    console.log(`\n❌ Các Job bị lỗi gần đây (tối đa 5 job):`);
    const recentFailed = failedJobs.slice(-5).reverse();
    for (const job of recentFailed) {
      console.log(`\n────────────────────────────────────────────────────────────`);
      console.log(`[Job ID: ${job.id}] [Name: ${job.name}]`);
      console.log(`  🔹 Data:`, JSON.stringify(job.data, null, 2));
      console.log(`  🔹 Failed Reason: "${job.failedReason}"`);
      if (job.stacktrace && job.stacktrace.length > 0) {
        console.log(`  🔹 Stacktrace:`);
        console.log(job.stacktrace.slice(0, 3).join('\n'));
      }
    }
  }

  await queue.close();
}

main().catch(console.error).finally(() => process.exit(0));
