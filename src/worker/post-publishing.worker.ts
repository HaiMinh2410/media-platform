import { Worker, Job } from 'bullmq';
import { redisConnection } from '../infrastructure/queue/bullmq.provider';
import { POST_PUBLISHING_QUEUE, PostJobData } from '../infrastructure/queue/post-queue';

console.log(`[Worker] Post Publishing Worker started...`);

const worker = new Worker<PostJobData>(
  POST_PUBLISHING_QUEUE,
  async (job: Job<PostJobData>) => {
    const { postId, workspaceId } = job.data;
    
    console.log(`[Worker] Processing post ${postId} for workspace ${workspaceId}`);
    
    // TODO: Implement actual Meta publishing logic in T070
    // 1. Fetch post from DB
    // 2. Determine platform and call Meta API
    // 3. Update DB status to 'published' or 'failed'
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[Worker] Successfully "processed" post ${postId}`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
