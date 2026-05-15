import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueName } from '@/domain/types/queue';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Handle missing credentials gracefully during build/startup
 */
const host = REDIS_URL?.replace('https://', '');

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
 * Upstash requires TLS for connection.
 */
export const redisConnection = 
  globalThis.redisConnection ?? 
  (host && REDIS_TOKEN ? new IORedis({
    host,
    port: 6379,
    password: REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null, // Required by BullMQ
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
      removeOnComplete: true,
      removeOnFail: false,
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
      removeOnComplete: true,
      removeOnFail: false,
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
<<<<<<< Updated upstream
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
=======
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Longer delay for social media publishing
>>>>>>> Stashed changes
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }) : undefined);

if (process.env.NODE_ENV !== 'production' && publishQueue) {
  globalThis.publishQueue = publishQueue;
}

if (!redisConnection) {
  console.warn('[BullMQ] Redis connection not established. Check UPSTASH_REDIS_REST_URL/TOKEN.');
}
