import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, MediaTranscodingJobPayload } from '@/domain/types/queue';

function createMediaTranscodingWorker() {
  if (!redisConnection) {
    console.error('[Worker] Cannot initialize Media Transcoding Worker: Redis connection is missing.');
    return null;
  }

  const worker = new Worker<MediaTranscodingJobPayload>(
    QueueName.MEDIA_TRANSCODING,
    async (job: Job<MediaTranscodingJobPayload>) => {
      const { mediaId, originalUrl } = job.data;
      console.log(`[Worker] [${job.id}] Starting transcoding for ${mediaId}...`);

      try {
        // Mocking transcoding process
        await job.updateProgress(10);
        await new Promise(res => setTimeout(res, 1000));
        await job.updateProgress(30);
        await new Promise(res => setTimeout(res, 1000));
        await job.updateProgress(60);
        await new Promise(res => setTimeout(res, 1000));
        await job.updateProgress(90);
        await new Promise(res => setTimeout(res, 1000));
        await job.updateProgress(100);

        console.log(`[Worker] [${job.id}] Finished transcoding for ${mediaId}.`);

        // Usually we would upload the transcoded file to storage and return its new URL.
        // For now, we mock the result and just return the original URL.
        return { 
          status: 'success', 
          mediaId,
          transcodedUrl: originalUrl // Fallback mock
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Worker] [${job.id}] Processing failed: ${message}`);
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2, // Video transcoding is CPU intensive, so limit concurrency
    }
  );

  worker.on('completed', (job) => {
    console.info(`[Worker] [${job.id}] Transcoding job completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] [${job?.id}] Transcoding job failed with error: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Global transcoding worker error: ${err.message}`);
  });

  console.log(`[Worker] Media Transcoding worker listening on queue: ${QueueName.MEDIA_TRANSCODING}`);
  return worker;
}

export const mediaTranscodingWorker = createMediaTranscodingWorker();
