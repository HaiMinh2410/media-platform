import { db } from '@/lib/db';
import { publishQueue } from '@/infrastructure/queue/bullmq.provider';
import { PublishJobPayload } from '@/domain/types/queue';

/**
 * Service điều phối quá trình đăng bài đồng thời lên nhiều tài khoản.
 * Thực hiện lưu vết vào DB và đẩy jobs vào BullMQ để xử lý bất đồng bộ.
 */
export const batchPublishService = {
  /**
   * Thực thi việc đăng bài cho một danh sách tài khoản chỉ định.
   */
  async execute(payload: {
    postId?: string;
    accounts: { accountId: string; platform: 'FACEBOOK' | 'INSTAGRAM' }[];
    content?: string;
    mediaUrls: string[];
  }) {
    try {
      const results = [];
      const batchId = crypto.randomUUID();

      for (const target of payload.accounts) {
        // 1. Khởi tạo bản ghi PublishJob trong DB với trạng thái PENDING
        const jobRecord = await db.publishJob.create({
          data: {
            batch_id: batchId,
            post_id: payload.postId,
            account_id: target.accountId,
            platform: target.platform,
            content: payload.content,
            media_urls: payload.mediaUrls,
            status: 'PENDING',
          }
        });

        // 2. Đẩy job vào BullMQ publish queue
        if (publishQueue) {
          const jobPayload: PublishJobPayload = {
            jobId: jobRecord.id,
            accountId: target.accountId,
            platform: target.platform,
            content: payload.content,
            mediaUrls: payload.mediaUrls,
          };

          await publishQueue.add('publish-task', jobPayload, {
            jobId: jobRecord.id, // Sử dụng ID từ DB làm Job ID của BullMQ để dễ tracking
          });

          console.log(`[BatchPublishService] Enqueued job ${jobRecord.id} for account ${target.accountId}`);
        } else {
          console.error('[BatchPublishService] PublishQueue not initialized!');
          // Update DB sang trạng thái FAILED nếu không có queue
          await db.publishJob.update({
            where: { id: jobRecord.id },
            data: { status: 'FAILED', error_message: 'QUEUE_NOT_AVAILABLE' }
          });
        }

        results.push(jobRecord);
      }

      return { data: results, error: null };
    } catch (err: any) {
      console.error('[BatchPublishService] Execution error:', err);
      return { data: null, error: err.message || 'INTERNAL_SERVER_ERROR' };
    }
  }
};
