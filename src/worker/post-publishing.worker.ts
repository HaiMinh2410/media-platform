import { Worker, Job } from 'bullmq';
import { redisConnection } from '../infrastructure/queue/bullmq.provider';
import { POST_PUBLISHING_QUEUE, PostJobData } from '../infrastructure/queue/post-queue';
import { getMetaPublishingService } from '../infrastructure/services/meta-publishing.service';

console.log(`[Worker] Post Publishing Worker started...`);

if (!redisConnection) {
  throw new Error('[Worker] Redis connection missing. Cannot start worker.');
}

const worker = new Worker<PostJobData>(
  POST_PUBLISHING_QUEUE,
  async (job: Job<PostJobData>) => {
    const { postId, workspaceId } = job.data;
    
    console.log(`[Worker] Processing post ${postId} for workspace ${workspaceId}`);
    
    const publishingService = getMetaPublishingService();
    const result = await publishingService.publishPost(postId);
    
    if (result.success) {
      console.log(`[Worker] Successfully published post ${postId}. Platform ID: ${result.platformPostId}`);
    } else {
      console.error(`[Worker] Failed to publish post ${postId}: ${result.error}`);
      throw new Error(result.error); // Allow BullMQ to retry if needed
    }
  },
  {
    connection: redisConnection!,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
