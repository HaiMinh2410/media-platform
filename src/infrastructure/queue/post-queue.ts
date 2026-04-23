import { Queue } from 'bullmq';
import { redisConnection } from './bullmq.provider';

export const POST_PUBLISHING_QUEUE = 'post-publishing';

export const postQueue = redisConnection ? new Queue(POST_PUBLISHING_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 100,
    },
  },
}) : undefined;

export type PostJobData = {
  postId: string;
  workspaceId: string;
};

export async function enqueuePostPublishing(data: PostJobData, scheduledAt?: Date | null) {
  const now = Date.now();
  const publishTime = scheduledAt ? new Date(scheduledAt).getTime() : now;
  const delay = Math.max(0, publishTime - now);

  console.log(`[Queue] Enqueuing post ${data.postId} with delay ${delay}ms`);
  
  if (!postQueue) {
    console.error('[Queue] postQueue is not initialized');
    return null;
  }
  
  return postQueue.add(
    'publish',
    data,
    {
      delay,
      jobId: data.postId, // Ensure uniqueness per post
    }
  );
}

export async function removePostFromQueue(postId: string) {
  if (!postQueue) return;
  const job = await postQueue.getJob(postId);
  if (job) {
    await job.remove();
    console.log(`[Queue] Removed job ${postId} from queue`);
  }
}
