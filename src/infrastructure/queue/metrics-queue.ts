import { Queue } from 'bullmq';
import { redisConnection } from './bullmq.provider';
import { QueueName } from '@/domain/types/queue';

export const metricsQueue = redisConnection
  ? new Queue(QueueName.AI_AGENT_METRICS, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 50,
        },
      },
    })
  : undefined;

/**
 * Đăng ký Job lặp lại hàng tuần (Repeatable Job) vào lúc 23:59 Chủ Nhật hàng tuần.
 * BullMQ sẽ tự động xử lý trùng lặp và kích hoạt Job theo lịch cron.
 */
export async function setupWeeklyMetricsJob(): Promise<void> {
  if (!metricsQueue) {
    console.warn('⚠️ [MetricsQueue] Cannot setup weekly metrics job: Queue not initialized.');
    return;
  }

  try {
    // Xóa các repeatable jobs cũ nếu có để tránh trùng lặp cấu hình
    const repeatableJobs = await metricsQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === 'collect-weekly-metrics') {
        await metricsQueue.removeRepeatableByKey(job.key);
        console.log(`[MetricsQueue] Removed existing repeatable job configuration: ${job.key}`);
      }
    }

    // Đăng ký lại repeatable job chạy vào 23:59 tối Chủ Nhật hàng tuần (Cron: 59 23 * * 0)
    await metricsQueue.add(
      'collect-weekly-metrics',
      {},
      {
        repeat: {
          pattern: '59 23 * * 0', // 23:59 Chủ Nhật hàng tuần
        },
        jobId: 'weekly-metrics-cron', // Khóa định danh duy nhất
      }
    );

    console.log('✅ [MetricsQueue] Successfully scheduled repeatable weekly metrics job at 23:59 every Sunday.');
  } catch (error) {
    console.error('❌ [MetricsQueue] Error setting up repeatable weekly metrics job:', error);
  }
}
