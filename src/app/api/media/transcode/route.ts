import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queueService } from '@/application/queue/queue.service';
import { mediaTranscodingQueue } from '@/infrastructure/queue/bullmq.provider';

const TranscodeRequestSchema = z.object({
  mediaId: z.string(),
  workspaceId: z.string(),
  url: z.string().url(),
  filePath: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TranscodeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await queueService.enqueueMediaTranscoding({
      mediaId: parsed.data.mediaId,
      workspaceId: parsed.data.workspaceId,
      originalUrl: parsed.data.url,
      filePath: parsed.data.filePath,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data: { jobId: data } });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  try {
    if (!mediaTranscodingQueue) {
      return NextResponse.json({ error: 'Queue not initialized' }, { status: 500 });
    }

    const job = await mediaTranscodingQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = job.returnvalue;
    const failedReason = job.failedReason;

    return NextResponse.json({
      data: {
        id: job.id,
        state,
        progress,
        returnvalue,
        failedReason,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
