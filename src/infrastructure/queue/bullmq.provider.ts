import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueName } from '@/domain/types/queue';

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

declare global {
  // eslint-disable-next-line no-var
  var redisConnection: IORedis | undefined;
  // eslint-disable-next-line no-var
  var webhookQueue: Queue | undefined;
  // eslint-disable-next-line no-var
  var mediaTranscodingQueue: Queue | undefined;
  // eslint-disable-next-line no-var
  var publishQueue: Queue | undefined;
}

/**
 * Shared Redis connection instance for BullMQ.
 */
export const redisConnection = 
  globalThis.redisConnection ?? 
  (REDIS_URL ? new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    // Auto-detect TLS: Upstash or rediss:// requires it, localhost doesn't
    tls: (REDIS_URL.startsWith('rediss://') || REDIS_URL.includes('upstash.io')) 
      ? { rejectUnauthorized: false } 
      : undefined,
  }) : undefined);

if (process.env.NODE_ENV !== 'production' && redisConnection) {
  globalThis.redisConnection = redisConnection;
}

/**
 * Webhook Events Queue instance.
 */
export const webhookQueue = 
  globalThis.webhookQueue ?? 
  (redisConnection ? new Queue(QueueName.WEBHOOK_EVENTS, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    },
  }) : undefined);

if (process.env.NODE_ENV !== 'production' && webhookQueue) {
  globalThis.webhookQueue = webhookQueue;
}

export const mediaTranscodingQueue = 
  globalThis.mediaTranscodingQueue ?? 
  (redisConnection ? new Queue(QueueName.MEDIA_TRANSCODING, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    },
  }) : undefined);

if (process.env.NODE_ENV !== 'production' && mediaTranscodingQueue) {
  globalThis.mediaTranscodingQueue = mediaTranscodingQueue;
}

export const publishQueue = 
  globalThis.publishQueue ?? 
  (redisConnection ? new Queue(QueueName.PUBLISH_EVENTS, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000, // Longer delay for social media publishing
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    },
  }) : undefined);

if (process.env.NODE_ENV !== 'production' && publishQueue) {
  globalThis.publishQueue = publishQueue;
}

if (!redisConnection) {
  console.warn('[BullMQ] Redis connection not established. Check REDIS_URL or UPSTASH_REDIS_URL.');
}
