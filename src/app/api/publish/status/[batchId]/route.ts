import { NextRequest } from 'next/server';
import { publishJobRepository } from '@/infrastructure/repositories/publish-job.repository';

export const dynamic = 'force-dynamic';

/**
 * API Route cung cấp Server-Sent Events để theo dõi trạng thái của một Batch Publish Job.
 * UI sẽ subscribe vào endpoint này để nhận cập nhật realtime mà không cần polling thủ công.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const { batchId } = params;

  if (!batchId) {
    return new Response(JSON.stringify({ error: 'Missing batchId' }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const summary = await publishJobRepository.getBatchSummary(batchId);
          
          if (!summary) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'BATCH_NOT_FOUND' })}\n\n`));
            controller.close();
            return true;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(summary)}\n\n`));

          // Kiểm tra xem tất cả các jobs đã kết thúc chưa (terminal states)
          const isTerminal = summary.status === 'COMPLETED' || 
                           summary.status === 'FAILED' || 
                           summary.status === 'PARTIAL_FAILURE';
          
          if (isTerminal) {
            controller.close();
            return true;
          }
          return false;
        } catch (err) {
          console.error('[SSE Publish Status] Error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' })}\n\n`));
          controller.close();
          return true;
        }
      };

      // Gửi trạng thái ban đầu ngay lập tức
      const done = await sendUpdate();
      if (done) return;

      // Thiết lập polling interval 2 giây để kiểm tra DB
      const interval = setInterval(async () => {
        const isDone = await sendUpdate();
        if (isDone) {
          clearInterval(interval);
        }
      }, 2000);

      // Dọn dẹp khi kết nối bị ngắt từ phía client
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
