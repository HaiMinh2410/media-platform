import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { checkRateLimit } from '@/infrastructure/queue/rate-limiter';
import { batchPublishService } from '@/application/services/batch-publish.service';

/**
 * POST /api/publish/batch
 * Endpoint chính thức để điều phối việc đăng bài đa nền tảng.
 * Tích hợp Rate Limiting dựa trên Redis để bảo vệ hệ thống và tuân thủ giới hạn của Meta API.
 */
export async function POST(req: NextRequest) {
  try {
    // Xác thực người dùng
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Bạn cần đăng nhập để thực hiện hành động này.' }, 
        { status: 401 }
      );
    }

    // 1. Kiểm tra Rate Limit: 200 requests/giờ mỗi user
    // Key: rate:publish:{userId}
    const rateLimit = await checkRateLimit(`publish:${user.id}`, 200, 3600);

    // Chuẩn bị headers theo tiêu chuẩn
    const headers = {
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.reset.toString(),
    };

    if (!rateLimit.isAllowed) {
      console.warn(`[RateLimit] User ${user.id} exceeded limit.`);
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_EXCEEDED', 
          message: 'Bạn đã vượt quá giới hạn 200 lượt đăng bài trong 1 giờ. Vui lòng thử lại sau.' 
        },
        { status: 429, headers }
      );
    }

    // 2. Parse và validate request body
    const body = await req.json();
    const { accounts, content, mediaUrls, postId, scheduledAt } = body;

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Danh sách tài khoản đăng bài không được để trống.' }, 
        { status: 400, headers }
      );
    }

    // 3. Thực thi nghiệp vụ Batch Publish thông qua service chuyên biệt
    // Service này sẽ tạo PublishJob records và enqueue vào BullMQ
    const result = await batchPublishService.execute({
      postId,
      accounts,
      content,
      mediaUrls,
      scheduledAt,
    });

    if (result.error) {
      return NextResponse.json(
        { error: 'PUBLISH_SERVICE_ERROR', message: result.error }, 
        { status: 500, headers }
      );
    }

    // 4. Phản hồi thành công kèm thông tin rate limit
    return NextResponse.json(
      { 
        message: 'Batch publish initiated successfully',
        batchId: result.data?.[0]?.batch_id, // Lấy batch_id từ bản ghi đầu tiên
        jobsCount: result.data?.length 
      }, 
      { status: 202, headers } // 202 Accepted vì job được xử lý bất đồng bộ
    );

  } catch (error: any) {
    console.error('[API Batch Publish] Unexpected Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }, 
      { status: 500 }
    );
  }
}
