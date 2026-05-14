import { Worker, Job, UnrecoverableError } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, PublishJobPayload } from '@/domain/types/queue';
import { db } from '@/lib/db';
import { getFBPageAdapter } from '@/infrastructure/meta/adapters/fb-page.adapter';
import { getIGBusinessAdapter } from '@/infrastructure/meta/adapters/ig-business.adapter';
import { publishJobRepository } from '@/infrastructure/repositories/publish-job.repository';
import { isTransientMetaError } from '@/utils/meta-error-mapper';

/**
 * Worker xử lý các jobs trong queue 'publish-events'.
 * Thực hiện gọi đến các platform adapters tương ứng.
 *
 * Quy ước quan trọng:
 * - accountId = UUID nội bộ từ bảng publisher_accounts (dùng để lấy token)
 * - platformId = Meta Page ID / IG Business ID thực (dùng trong endpoint Graph API)
 */
const publishWorker = redisConnection ? new Worker(
  QueueName.PUBLISH_EVENTS,
  async (job: Job) => {
    const payload = job.data as PublishJobPayload;
    const { jobId, accountId, platform, content, mediaUrls } = payload;

    console.log(`[PublishWorker] Starting job ${jobId} for ${platform} account ${accountId}`);

    // 1. Cập nhật trạng thái Job sang RUNNING
    await publishJobRepository.updateStatus(jobId, { status: 'RUNNING' });

    try {
      // 2. Lấy thông tin tài khoản từ publisher_accounts (model tên là Account trong Prisma)
      const account = await db.account.findUnique({
        where: { id: accountId }
      });

      if (!account) throw new Error('ACCOUNT_NOT_FOUND');

      // platformId = Meta Page ID / IG Business Account ID thực
      // accountId (UUID) = để lấy token đã mã hóa từ publisher_tokens
      const platformId = account.platform_id;

      let platformPostId: string | null = null;

      // 3. Điều hướng xử lý theo Platform
      if (platform === 'FACEBOOK') {
        const fbAdapter = getFBPageAdapter();
        const mediaIds: string[] = [];

        // Upload media trước nếu có
        for (const url of mediaUrls) {
          const isVideo = url.match(/\.(mp4|mov|avi|wmv)$|video/i);
          if (isVideo) {
            const { data, error, details } = await fbAdapter.uploadVideo(accountId, platformId, { fileUrl: url });
            if (error || !data) {
              const msg = error || 'Lỗi upload video lên Facebook';
              if (isTransientMetaError(details)) throw new Error(msg);
              throw new UnrecoverableError(msg);
            }
            mediaIds.push(data.id);
          } else {
            const { data, error, details } = await fbAdapter.uploadPhoto(accountId, platformId, url);
            if (error || !data) {
              const msg = error || 'Lỗi upload ảnh lên Facebook';
              if (isTransientMetaError(details)) throw new Error(msg);
              throw new UnrecoverableError(msg);
            }
            mediaIds.push(data.id);
          }
        }

        // Đăng bài viết kèm media
        const { data: publishData, error: publishError, details: publishDetails } = await fbAdapter.publishPost(accountId, platformId, {
          message: content,
          mediaIds: mediaIds
        });

        if (publishError || !publishData) {
          const msg = publishError || 'Lỗi đăng bài lên Facebook';
          if (isTransientMetaError(publishDetails)) throw new Error(msg);
          throw new UnrecoverableError(msg);
        }
        platformPostId = publishData.id;

      } else if (platform === 'INSTAGRAM') {
        const igAdapter = getIGBusinessAdapter();
        let creationId: string | null = null;

        if (mediaUrls.length === 1) {
          // Single Media
          const url = mediaUrls[0];
          const isVideo = url.match(/\.(mp4|mov|avi|wmv)$|video/i);

          if (isVideo) {
            const { data, error, details } = await igAdapter.createVideoContainer(accountId, platformId, url, content);
            if (error || !data) {
              const msg = error || 'Lỗi tạo container video Instagram';
              if (isTransientMetaError(details)) throw new Error(msg);
              throw new UnrecoverableError(msg);
            }
            creationId = data.id;
          } else {
            const { data, error, details } = await igAdapter.createImageContainer(accountId, platformId, url, content);
            if (error || !data) {
              const msg = error || 'Lỗi tạo container ảnh Instagram';
              if (isTransientMetaError(details)) throw new Error(msg);
              throw new UnrecoverableError(msg);
            }
            creationId = data.id;
          }
        } else if (mediaUrls.length > 1) {
          // Carousel
          const itemIds: string[] = [];
          for (const url of mediaUrls) {
            const isVideo = url.match(/\.(mp4|mov|avi|wmv)$|video/i);
            const { data, error, details } = await igAdapter.createCarouselItem(accountId, platformId, url, !!isVideo);
            if (error || !data) {
              const msg = error || 'Lỗi tạo item carousel Instagram';
              if (isTransientMetaError(details)) throw new Error(msg);
              throw new UnrecoverableError(msg);
            }
            itemIds.push(data.id);
          }

          const { data, error, details } = await igAdapter.createCarouselContainer(accountId, platformId, itemIds, content);
          if (error || !data) {
            const msg = error || 'Lỗi tạo carousel Instagram';
            if (isTransientMetaError(details)) throw new Error(msg);
            throw new UnrecoverableError(msg);
          }
          creationId = data.id;
        } else {
          // Text-only post (nếu không có media)
          const { data, error, details } = await igAdapter.createImageContainer(accountId, platformId, '', content);
          if (error || !data) {
            throw new UnrecoverableError(error || 'Lỗi tạo container Instagram');
          }
          creationId = data.id;
        }

        if (!creationId) throw new Error('IG_CREATION_ID_MISSING');

        const { data: publishData, error: publishError, details: publishDetails } = await igAdapter.publishContainer(accountId, platformId, creationId);
        if (publishError || !publishData) {
          const msg = publishError || 'Lỗi đăng bài lên Instagram';
          if (isTransientMetaError(publishDetails)) throw new Error(msg);
          throw new UnrecoverableError(msg);
        }
        platformPostId = publishData.id;
      }

      // 4. Thành công -> Cập nhật DB
      await publishJobRepository.updateStatus(jobId, {
        status: 'COMPLETED',
        platformPostId: platformPostId,
        publishedAt: new Date()
      });

      console.log(`[PublishWorker] Job ${jobId} completed successfully. Post ID: ${platformPostId}`);

    } catch (err: any) {
      const isUnrecoverable = err instanceof UnrecoverableError;
      console.error(`[PublishWorker] Job ${jobId} failed. Transient: ${!isUnrecoverable}. Error:`, err.message);

      // Cập nhật lỗi vào DB
      await publishJobRepository.updateStatus(jobId, {
        status: 'FAILED',
        errorMessage: err.message
      });

      throw err; // Throw để BullMQ thực hiện retry theo cấu hình
    }
  },
  { connection: redisConnection }
) : null;

if (publishWorker) {
  publishWorker.on('failed', (job, err) => {
    console.error(`[PublishWorker] Job ${job?.id} failed after retries:`, err);
  });

  console.log('[PublishWorker] Worker started, listening on queue:', QueueName.PUBLISH_EVENTS);
}

export default publishWorker;
