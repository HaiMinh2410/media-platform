import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AiSuggestion } from '@/domain/types/messaging';

/**
 * GET /api/conversations/[id]/suggestions
 *
 * Returns AI-generated reply suggestions (ai_reply_logs) for a given conversation,
 * ordered newest first. Suggestions with status=pending or status=suggested are returned
 * so the agent can review and optionally use them.
 *
 * Query params:
 *   limit?: number (default 10, max 50)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Verify conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch ai_reply_logs linked to messages in this conversation
    // Join through messages table: ai_reply_logs.message_id → messages.conversation_id
    const logs = await db.aIReplyLog.findMany({
      where: {
        message: {
          conversationId,
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        messageId: true,
        model: true,
        prompt: true,
        response: true,
        status: true,
        created_at: true,
      } as any,
    });

    const suggestions: AiSuggestion[] = logs.map((log) => ({
      id: log.id,
      messageId: log.messageId,
      model: log.model,
      prompt: log.prompt,
      response: log.response,
        status: (log as any).status,
        createdAt: log.created_at.toISOString(),
    }));

    return NextResponse.json({ data: suggestions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API Suggestions] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
