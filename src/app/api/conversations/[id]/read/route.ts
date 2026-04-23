import { NextRequest, NextResponse } from 'next/server';
import { markAllRead } from '@/infrastructure/repositories/conversation.repository';

/**
 * PATCH /api/conversations/[id]/read
 * Marks all unread messages in the specified conversation as read.
 *
 * This is a lightweight endpoint — no body required.
 * Responds with the count of messages that were updated.
 *
 * Returns 200 even if there were 0 unread messages (idempotent).
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const { data, error } = await markAllRead(conversationId);

    if (error || !data) {
      return NextResponse.json(
        { error: error || 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API MarkRead] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
