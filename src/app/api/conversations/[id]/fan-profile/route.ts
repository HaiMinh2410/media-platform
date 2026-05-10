import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/conversations/[id]/fan-profile
 * Fetches the Fan Profile associated with the conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const fanProfile = await db.fanProfile.findUnique({
      where: { conversation_id: conversationId },
    });

    return NextResponse.json({ data: fanProfile });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API FanProfile GET] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
