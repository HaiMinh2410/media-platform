import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { aiAgentReplyQueue } from '@/application/ai-agent/reply-delay-scheduler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations/[id]/scheduled-reply
 * Checks if there is a pending delayed AI response in the BullMQ queue for this conversation.
 * Returns the scheduled time (timestamp) and reply text if exists.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = params.id;

    if (!aiAgentReplyQueue) {
      return NextResponse.json({ data: { exists: false, reason: 'Queue not initialized' } });
    }

    const jobId = `reply-${conversationId}`;
    const job = await aiAgentReplyQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ data: { exists: false } });
    }

    // Check if the job has been completed, failed, or is active/waiting/delayed
    const state = await job.getState();
    
    // We only care about pending (delayed/waiting) jobs
    if (state !== 'delayed' && state !== 'waiting') {
      return NextResponse.json({ data: { exists: false, state } });
    }

    const timestamp = job.timestamp;
    const delay = job.opts.delay || 0;
    const scheduledAt = new Date(timestamp + delay);

    return NextResponse.json({
      data: {
        exists: true,
        jobId: job.id,
        state,
        scheduledAt: scheduledAt.toISOString(),
        replyText: job.data.replyText,
        platform: job.data.platform,
        aiLogId: job.data.aiLogId
      }
    });
  } catch (error) {
    console.error('[ScheduledReply GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/conversations/[id]/scheduled-reply
 * Cancels and removes the scheduled delayed reply job for this conversation.
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = params.id;

    if (!aiAgentReplyQueue) {
      return NextResponse.json({ error: 'Queue not initialized' }, { status: 400 });
    }

    const jobId = `reply-${conversationId}`;
    const job = await aiAgentReplyQueue.getJob(jobId);

    if (job) {
      await job.remove();
      return NextResponse.json({ success: true, message: 'Scheduled reply cancelled successfully' });
    }

    return NextResponse.json({ success: false, message: 'No scheduled reply found' });
  } catch (error) {
    console.error('[ScheduledReply DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
