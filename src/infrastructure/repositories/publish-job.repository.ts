import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Repository quản lý các bản ghi PublishJob.
 * Cung cấp các phương thức truy vấn và cập nhật trạng thái chi tiết.
 */
export const publishJobRepository = {
  /**
   * Tìm job theo ID.
   */
  async findById(id: string) {
    return await db.publishJob.findUnique({
      where: { id },
      include: { account: true }
    });
  },

  /**
   * Lấy danh sách các jobs thuộc cùng một Batch (phiên làm việc).
   */
  async findByBatchId(batchId: string) {
    return await db.publishJob.findMany({
      where: { batch_id: batchId },
      include: { account: true },
      orderBy: { created_at: 'asc' }
    });
  },

  /**
   * Cập nhật trạng thái và thông tin kết quả của một job.
   */
  async updateStatus(id: string, data: {
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    errorMessage?: string | null;
    platformPostId?: string | null;
    metadata?: any;
    publishedAt?: Date | null;
  }) {
    return await db.publishJob.update({
      where: { id },
      data: {
        status: data.status,
        error_message: data.errorMessage || null,
        platform_post_id: data.platformPostId || null,
        metadata: data.metadata !== undefined ? data.metadata : undefined,
        published_at: data.publishedAt || null,
      }
    });
  },

  /**
   * Tính toán trạng thái tổng hợp (Aggregate Status) cho cả Batch.
   * Giúp UI hiển thị trạng thái tổng quát (Thành công/Thất bại một phần/Đang chạy).
   */
  async getBatchSummary(batchId: string) {
    const jobs = await db.publishJob.findMany({
      where: { batch_id: batchId }
    });

    if (jobs.length === 0) return null;

    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const failed = jobs.filter(j => j.status === 'FAILED').length;
    const running = jobs.filter(j => j.status === 'RUNNING').length;
    const pending = jobs.filter(j => j.status === 'PENDING').length;

    let aggregateStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_FAILURE' = 'PENDING';

    if (running > 0 || (pending > 0 && completed + failed > 0)) {
      aggregateStatus = 'RUNNING';
    } else if (completed === total) {
      aggregateStatus = 'COMPLETED';
    } else if (failed === total) {
      aggregateStatus = 'FAILED';
    } else if (completed > 0 && failed > 0) {
      aggregateStatus = 'PARTIAL_FAILURE';
    } else if (pending === total) {
      aggregateStatus = 'PENDING';
    } else if (failed > 0) {
      aggregateStatus = 'FAILED';
    }

    return {
      batchId,
      total,
      completed,
      failed,
      running,
      pending,
      status: aggregateStatus,
      jobs
    };
  }
};
