import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, WebhookJobPayload } from '@/domain/types/queue';

/**
 * Webhook Event Worker.
 * Processes enqueued webhook events from Meta, TikTok, etc.
 * 
 * This is designed to run in a standalone process (Fly.io) or 
 * during local development as a sidecar process.
 */
function createWebhookWorker() {
  if (!redisConnection) {
    console.error('[Worker] Cannot initialize Webhook Worker: Redis connection is missing.');
    return null;
  }

  const worker = new Worker<WebhookJobPayload>(
    QueueName.WEBHOOK_EVENTS,
    async (job: Job<WebhookJobPayload>) => {
      const { webhookEventId, platform, messageText } = job.data;
      
      console.log(`[Worker] [${job.id}] Processing event ${webhookEventId} from ${platform}`);
      
      try {
        // Placeholder for core business logic (Phase 4D)
        // 1. Intent Classification (Groq)
        // 2. Workspace/Account resolution
        // 3. Bot response generation
        
        console.log(`[Worker] [${job.id}] Content: "${messageText || '(Empty message)'}"`);
        
        // Return results to be stored in job metadata
        return { 
          processedAt: new Date().toISOString(),
          status: 'success',
          eventId: webhookEventId 
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Worker] [${job.id}] Processing failed: ${message}`);
        throw err; // Trigger retry logic
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  // Monitoring
  worker.on('completed', (job) => {
    console.info(`[Worker] [${job.id}] Job completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] [${job?.id}] Job failed with error: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Global worker error: ${err.message}`);
  });

  console.log(`[Worker] Webhook worker listening on queue: ${QueueName.WEBHOOK_EVENTS}`);
  return worker;
}

// Export a singleton instance (lazy initialization happens when imported)
export const webhookWorker = createWebhookWorker();
