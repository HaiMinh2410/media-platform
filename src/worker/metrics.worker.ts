import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName } from '@/domain/types/queue';
import { runWeeklyMetricsAggregation } from '@/application/ai-agent/metrics-collector';
import { setupWeeklyMetricsJob } from '@/infrastructure/queue/metrics-queue';
import { db } from '@/lib/db';
import { promoteWinnerIfAny } from '@/application/ai-agent/ab-test-manager';

console.log(`🚀 [MetricsWorker] AI Agent Metrics Worker starting...`);

if (!redisConnection) {
  console.error('❌ [MetricsWorker] Redis connection missing. Cannot start worker.');
  process.exit(1);
}

// Khởi tạo Worker xử lý tổng hợp chỉ số hằng tuần
export const metricsWorker = new Worker(
  QueueName.AI_AGENT_METRICS,
  async (job: Job) => {
    console.log(`⏳ [MetricsWorker] [Job ${job.id}] Processing weekly metrics aggregation...`);
    const startTime = Date.now();

    try {
      // Chạy tiến trình tổng hợp số liệu cho tất cả workspace
      await runWeeklyMetricsAggregation(new Date());

      // Chạy phân tích thử nghiệm A/B cho từng workspace
      console.log(`📊 [MetricsWorker] Starting A/B Testing automated winner selection...`);
      const workspaces = await db.workspace.findMany({ select: { id: true } });
      for (const workspace of workspaces) {
        await promoteWinnerIfAny(workspace.id);
      }

      const durationMs = Date.now() - startTime;
      console.log(`✅ [MetricsWorker] [Job ${job.id}] Weekly metrics aggregated & A/B testing evaluated successfully in ${durationMs}ms.`);
      return { status: 'success', durationMs };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [MetricsWorker] [Job ${job.id}] Failed to aggregate metrics:`, error);
      throw error; // Trả lỗi để BullMQ kích hoạt retry logic nếu cần
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Tiến trình tổng hợp chỉ cần concurrency = 1 để tránh race conditions
  }
);

// Lắng nghe các sự kiện monitoring
metricsWorker.on('completed', (job) => {
  console.info(`✅ [MetricsWorker] Job ${job.id} completed successfully.`);
});

metricsWorker.on('failed', (job, err) => {
  console.error(`❌ [MetricsWorker] Job ${job?.id} failed with error: ${err.message}`);
});

metricsWorker.on('error', (err) => {
  console.error(`❌ [MetricsWorker] Global worker error: ${err.message}`);
});

// Đăng ký lịch chạy lặp lại lúc khởi động
setupWeeklyMetricsJob()
  .then(() => console.log('📅 [MetricsWorker] Repeatable cron setup checked.'))
  .catch((err) => console.error('❌ [MetricsWorker] Failed to setup cron:', err));
