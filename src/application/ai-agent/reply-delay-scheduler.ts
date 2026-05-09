// src/application/ai-agent/reply-delay-scheduler.ts
//
// AI Reply Delay Scheduler - Phase 2 BullMQ
// Thay thế cơ chế setTimeout không bền vững bằng cơ chế Delayed Jobs của BullMQ.
// Bảo đảm tin nhắn trì hoãn từ 15 phút - 2 giờ không bị mất khi khởi động lại server.
//

import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { db } from '@/lib/db';
import { metaSendService } from '@/application/services/meta-send.service';
import { idempotentPersistMessage } from '../../../message.repository';

export const AI_AGENT_REPLY_QUEUE_NAME = 'ai-agent-reply';

/**
 * Định nghĩa cấu trúc dữ liệu cho một job trong Delayed Queue
 */
export interface AIDelayedReplyPayload {
  conversationId: string;
  replyText: string;
  platform: string;
  externalPageId: string;
  externalSenderId: string;
  token?: string | null;
  aiLogId: string;
}

declare global {
  // eslint-disable-next-line no-var
  var aiAgentReplyQueue: Queue | undefined;
  // eslint-disable-next-line no-var
  var aiAgentReplyWorker: Worker | undefined;
}

/**
 * Định nghĩa và khởi tạo Queue trì hoãn AI Agent Reply
 */
export const aiAgentReplyQueue =
  globalThis.aiAgentReplyQueue ??
  (redisConnection ? new Queue(AI_AGENT_REPLY_QUEUE_NAME, {
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

if (process.env.NODE_ENV !== 'production' && aiAgentReplyQueue) {
  globalThis.aiAgentReplyQueue = aiAgentReplyQueue;
}

/**
 * Lập lịch trì hoãn gửi tin nhắn bằng BullMQ Delayed Job (với cơ chế Debounce tự động)
 *
 * @param payload Toàn bộ dữ liệu cần thiết để gửi tin nhắn của job
 * @param delayMs Thời gian trì hoãn tính bằng miliseconds (ms)
 */
export async function scheduleDelayedReply(
  payload: AIDelayedReplyPayload,
  delayMs: number
): Promise<void> {
  if (!aiAgentReplyQueue) {
    console.warn(`⚠️ [DelayScheduler] aiAgentReplyQueue is not initialized. Cannot schedule delay.`);
    return;
  }

  // Khai báo jobId duy nhất dựa trên conversationId để hỗ trợ cơ chế Debounce
  const jobId = `reply-${payload.conversationId}`;

  try {
    // Tự động hủy tin nhắn cũ đã lên lịch trước đó cho hội thoại này nếu fan nhắn tin mới (Debounce)
    const existingJob = await aiAgentReplyQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
      console.log(`🔄 [DelayScheduler] Cancelled existing delayed job: '${jobId}' to debounce new message.`);
    }
  } catch (err) {
    console.warn(`⚠️ [DelayScheduler] Error cleaning up previous job for debouncing:`, err);
  }

  console.log(`⏱️ [DelayScheduler] Scheduling delayed reply for conversation ${payload.conversationId} in ${delayMs / 1000}s`);

  // Thêm job trì hoãn vào Queue với tùy chọn delay
  await aiAgentReplyQueue.add('delayed-reply', payload, {
    delay: delayMs,
    jobId,
  });
}

/**
 * Khởi tạo Worker xử lý Delayed Jobs cho AI Agent Reply
 */
function createDelayWorker() {
  if (!redisConnection) {
    console.error('❌ [DelayedWorker] Redis connection missing. Cannot initialize worker.');
    return undefined;
  }

  console.log(`🤖 [DelayedWorker] Initializing worker on queue: '${AI_AGENT_REPLY_QUEUE_NAME}'...`);

  const worker = new Worker<AIDelayedReplyPayload>(
    AI_AGENT_REPLY_QUEUE_NAME,
    async (job: Job<AIDelayedReplyPayload>) => {
      const {
        conversationId,
        replyText,
        platform,
        externalPageId,
        externalSenderId,
        token,
        aiLogId,
      } = job.data;

      console.log(`⏰ [DelayedWorker] [${job.id}] Executing scheduled reply for conversation: ${conversationId}`);

      let platformBotMessageId = `bot_generated_${Date.now()}`;
      let effectivePageId = externalPageId;

      // Xử lý chuyển đổi Facebook Page ID liên kết khi gửi qua Instagram
      if (platform === 'instagram') {
        const account = await db.platformAccount.findFirst({
          where: {
            platform: 'instagram',
            platform_user_id: externalPageId,
          },
          select: { workspaceId: true }
        });

        if (account) {
          const linkedFb = await db.platformAccount.findFirst({
            where: {
              platform: 'facebook',
              workspaceId: account.workspaceId,
              metadata: { path: ['instagram_id'], equals: externalPageId }
            },
            select: { platform_user_id: true }
          });
          if (linkedFb) {
            effectivePageId = linkedFb.platform_user_id;
            console.log(`[DelayedWorker] [${job.id}] Resolved linked FB Page ${effectivePageId} for IG: ${externalPageId}`);
          }
        }
      }

      if (!token) {
        throw new Error(`[DelayedWorker] [${job.id}] Cannot send delayed reply: access token is missing.`);
      }

      // Gọi Graph API gửi tin nhắn thực tế tới fan
      const { data: sendResult, error: sendErr } = await metaSendService.sendText({
        platform: (platform === 'instagram' ? 'instagram' : 'facebook') as any,
        recipientId: externalSenderId,
        pageId: effectivePageId,
        text: replyText,
        encryptedToken: token,
      });

      if (sendErr) {
        throw new Error(`[DelayedWorker] [${job.id}] metaSendService failed to send reply: ${sendErr}`);
      }

      if (sendResult && sendResult.messageId) {
        platformBotMessageId = sendResult.messageId;
      }

      // Lưu trữ tin nhắn AI gửi đi xuống cơ sở dữ liệu (idempotent)
      const { data: botPersist, error: persistErr } = await idempotentPersistMessage({
        platform,
        externalPageId,
        externalSenderId,
        platformMessageId: platformBotMessageId,
        senderType: 'ai',
        messageText: replyText,
        timestamp: new Date(),
      });

      if (persistErr || !botPersist) {
        throw new Error(`[DelayedWorker] [${job.id}] Failed to persist bot message: ${persistErr}`);
      }

      // Cập nhật trạng thái log gợi ý AI từ pending/suggested thành 'sent'
      await db.aIReplyLog.update({
        where: { id: aiLogId },
        data: {
          messageId: botPersist.messageId,
          status: 'sent',
        } as any
      });

      console.log(`✅ [DelayedWorker] [${job.id}] Successfully sent and logged scheduled reply for conversation: ${conversationId}`);
      return { status: 'success', messageId: botPersist.messageId };
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.info(`✅ [DelayedWorker] [${job.id}] Job completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [DelayedWorker] [${job?.id}] Job failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error(`🚨 [DelayedWorker] Global error: ${err.message}`);
  });

  return worker;
}

export const aiAgentReplyWorker =
  globalThis.aiAgentReplyWorker ?? createDelayWorker();

if (process.env.NODE_ENV !== 'production' && aiAgentReplyWorker) {
  globalThis.aiAgentReplyWorker = aiAgentReplyWorker;
}
