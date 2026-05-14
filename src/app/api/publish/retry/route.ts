import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { batchPublishService } from '@/application/services/batch-publish.service';

/**
 * POST /api/publish/retry
 * Endpoint để thực hiện đăng lại các target bị FAILED trong một batch.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực người dùng
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'MISSING_BATCH_ID' }, { status: 400 });
    }

    // 3. Thực thi retry thông qua service
    const result = await batchPublishService.retryFailedJobs(batchId);

    if (result.error) {
      if (result.error === 'NO_FAILED_JOBS') {
        return NextResponse.json({ message: 'Không có bài đăng nào bị lỗi để thực hiện lại.' }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Retry initiated successfully',
      retriedCount: result.data?.length,
      data: result.data
    });
  } catch (error: any) {
    console.error('[API Publish Retry] Unexpected Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
