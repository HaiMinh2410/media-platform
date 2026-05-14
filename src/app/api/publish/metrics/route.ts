import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { db } from '@/lib/db';
import { startOfDay, subDays, format } from 'date-fns';
import { FeatureFlagService, FLAGS } from '@/application/services/feature-flag.service';

/**
 * GET /api/publish/metrics
 * Tổng hợp dữ liệu thống kê về việc đăng bài trong 7 ngày gần nhất.
 * Phục vụ cho biểu đồ theo dõi tỷ lệ thành công/thất bại trên Dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Xác thực người dùng
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!FeatureFlagService.isEnabled(user.id, FLAGS.SOCIAL_PUBLISHER_PRO, 100)) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Feature not available.' }, { status: 403 });
    }

    // 2. Xác định khoảng thời gian (7 ngày gần nhất)
    const daysToFetch = 7;
    const now = new Date();
    const startDate = startOfDay(subDays(now, daysToFetch - 1));

    // 3. Truy vấn tất cả jobs trong khoảng thời gian này
    // Lưu ý: Trong thực tế nên filter theo workspace của user, 
    // ở đây giả định db.publishJob có quan hệ hoặc filter được theo account/profile.
    // Hiện tại chúng ta sẽ lấy dữ liệu thô để gom nhóm.
    const jobs = await db.publishJob.findMany({
      where: {
        created_at: {
          gte: startDate
        }
      },
      select: {
        status: true,
        created_at: true,
        platform: true
      }
    });

    // 4. Gom nhóm dữ liệu theo từng ngày
    const metrics = Array.from({ length: daysToFetch }).map((_, i) => {
      const targetDate = startOfDay(subDays(now, daysToFetch - 1 - i));
      const dateKey = format(targetDate, 'yyyy-MM-dd');
      const label = format(targetDate, 'dd/MM');
      
      const dayJobs = jobs.filter(j => format(j.created_at, 'yyyy-MM-dd') === dateKey);
      const success = dayJobs.filter(j => j.status === 'COMPLETED').length;
      const failed = dayJobs.filter(j => j.status === 'FAILED').length;
      
      return {
        date: dateKey,
        name: label, // Dùng cho Recharts
        success,
        failed,
        total: dayJobs.length
      };
    });

    // 5. Tính toán tổng quan (Summary)
    const totalJobs = jobs.length;
    const totalSuccess = jobs.filter(j => j.status === 'COMPLETED').length;
    const totalFailed = jobs.filter(j => j.status === 'FAILED').length;
    
    const successRate = totalJobs > 0 ? Math.round((totalSuccess / totalJobs) * 100) : 0;

    return NextResponse.json({
      summary: {
        total: totalJobs,
        success: totalSuccess,
        failed: totalFailed,
        successRate: `${successRate}%`,
      },
      chartData: metrics
    });

  } catch (error: any) {
    console.error('[API Publish Metrics] Unexpected Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Không thể tải dữ liệu thống kê.' }, 
      { status: 500 }
    );
  }
}
