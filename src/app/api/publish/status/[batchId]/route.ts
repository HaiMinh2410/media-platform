import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * SSE Endpoint để theo dõi trạng thái của một Batch Publish.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const jobs = await db.publishJob.findMany({
            where: { batch_id: batchId },
            include: { account: true },
          });

          if (jobs.length === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Batch not found' })}\n\n`));
            return true;
          }

          const total = jobs.length;
          const completed = jobs.filter(j => j.status === 'COMPLETED').length;
          const failed = jobs.filter(j => j.status === 'FAILED').length;
          const running = jobs.filter(j => j.status === 'RUNNING').length;
          const scheduled = jobs.filter(j => j.status === 'PENDING' && j.scheduled_at && new Date(j.scheduled_at) > new Date()).length;
          const pending = jobs.filter(j => j.status === 'PENDING').length - scheduled;

          let batchStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_FAILURE' | 'SCHEDULED' = 'RUNNING';
          
          if (completed + failed === total) {
            if (failed === 0) batchStatus = 'COMPLETED';
            else if (completed === 0) batchStatus = 'FAILED';
            else batchStatus = 'PARTIAL_FAILURE';
          } else if (scheduled > 0 && running === 0 && completed === 0 && failed === 0) {
            batchStatus = 'SCHEDULED';
          }

          const summary = {
            batchId,
            total,
            completed,
            failed,
            running,
            pending,
            scheduled,
            status: batchStatus,
            jobs: jobs.map(j => ({
              id: j.id,
              account: { name: j.account?.name || 'Unknown' },
              platform: j.platform,
              status: j.status,
              scheduled_at: j.scheduled_at,
              error_message: j.error_message
            }))
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(summary)}\n\n`));
          
          return completed + failed === total;
        } catch (err) {
          console.error('[SSE Status Error]', err);
          return true; // Stop on error
        }
      };

      // Initial send
      const isFinished = await sendUpdate();
      if (isFinished) {
        controller.close();
        return;
      }

      // Polling for updates (basic implementation of SSE without PubSub)
      const interval = setInterval(async () => {
        const finished = await sendUpdate();
        if (finished) {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
