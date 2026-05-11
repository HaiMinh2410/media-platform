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

    // 1. Fetch the latest messages in the conversation
    const lastMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 2. Find the latest message from the customer (user)
    const latestCustomerMsg = lastMessages.find((m) => m.senderType === 'user');

    // 3. Check if there are any replies (agent/ai) sent after the latest customer message
    let isReplied = false;
    if (latestCustomerMsg) {
      const index = lastMessages.findIndex((m) => m.id === latestCustomerMsg.id);
      const newerMessages = lastMessages.slice(0, index);
      isReplied = newerMessages.some((m) => m.senderType === 'agent' || m.senderType === 'ai');
    }

    // 4. Fetch ai_reply_logs ONLY for the current unreplied customer message
    let logs: any[] = [];
    if (latestCustomerMsg && !isReplied) {
      logs = await db.aIReplyLog.findMany({
        where: {
          messageId: latestCustomerMsg.id,
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
    }

    const suggestions: AiSuggestion[] = (logs as any[]).map((log: any) => ({
      id: log.id,
      messageId: log.messageId,
      model: log.model,
      prompt: log.prompt,
      response: log.response,
      status: log.status,
      createdAt: log.created_at?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({ data: suggestions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API Suggestions] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
