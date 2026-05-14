import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, PublishJobPayload } from '@/domain/types/queue';
import { db } from '@/lib/db';
import { getFBPageAdapter } from '@/infrastructure/meta/adapters/fb-page.adapter';
import { getIGBusinessAdapter } from '@/infrastructure/meta/adapters/ig-business.adapter';
import { publishJobRepository } from '@/infrastructure/repositories/publish-job.repository';

/**
 * Worker xử lý các jobs trong queue 'publish-events'.
 * Thực hiện gọi đến các platform adapters tương ứng.
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
      // 2. Lấy thông tin tài khoản (để lấy platform_id từ Meta)
      const account = await db.account.findUnique({
        where: { id: accountId }
      });

      if (!account) throw new Error('ACCOUNT_NOT_FOUND');
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
            const { data, error } = await fbAdapter.uploadVideo(platformId, { fileUrl: url });
            if (error || !data) throw new Error(error || 'Lỗi upload video lên Facebook');
            mediaIds.push(data.id);
          } else {
            const { data, error } = await fbAdapter.uploadPhoto(platformId, url);
            if (error || !data) throw new Error(error || 'Lỗi upload ảnh lên Facebook');
            mediaIds.push(data.id);
          }
        }

        // Đăng bài viết kèm media
        const { data: publishData, error: publishError } = await fbAdapter.publishPost(platformId, {
          message: content,
          mediaIds: mediaIds
        });

        if (publishError || !publishData) throw new Error(publishError || 'Lỗi đăng bài lên Facebook');
        platformPostId = publishData.id;

      } else if (platform === 'INSTAGRAM') {
        const igAdapter = getIGBusinessAdapter();
        let creationId: string | null = null;

        if (mediaUrls.length === 1) {
          // Single Media
          const url = mediaUrls[0];
          const isVideo = url.match(/\.(mp4|mov|avi|wmv)$|video/i);
          
          if (isVideo) {
            const { data, error } = await igAdapter.createVideoContainer(platformId, url, content);
            if (error || !data) throw new Error(error || 'Lỗi tạo container video Instagram');
            creationId = data.id;
          } else {
            const { data, error } = await igAdapter.createImageContainer(platformId, url, content);
            if (error || !data) throw new Error(error || 'Lỗi tạo container ảnh Instagram');
            creationId = data.id;
          }
        } else if (mediaUrls.length > 1) {
          // Carousel
          const itemIds: string[] = [];
          for (const url of mediaUrls) {
            const isVideo = url.match(/\.(mp4|mov|avi|wmv)$|video/i);
            const { data, error } = await igAdapter.createCarouselItem(platformId, url, !!isVideo);
            if (error || !data) throw new Error(error || 'Lỗi tạo item carousel Instagram');
            itemIds.push(data.id);
          }

          const { data, error } = await igAdapter.createCarouselContainer(platformId, itemIds, content);
          if (error || !data) throw new Error(error || 'Lỗi tạo carousel Instagram');
          creationId = data.id;
        }

        if (!creationId) throw new Error('IG_CREATION_ID_MISSING');

        // Note: Đối với IG Video, có thể cần đợi processing. 
        // BullMQ retry logic sẽ giúp handle nếu publish ngay lập tức bị lỗi.
        const { data: publishData, error: publishError } = await igAdapter.publishContainer(platformId, creationId);
        if (publishError || !publishData) throw new Error(publishError || 'Lỗi đăng bài lên Instagram');
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
      console.error(`[PublishWorker] Job ${jobId} failed:`, err.message);
      
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
}

export default publishWorker;
