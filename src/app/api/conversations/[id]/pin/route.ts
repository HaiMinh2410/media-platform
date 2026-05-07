import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/conversations/[id]/pin
 * Toggles the pinning state of either the conversation itself or a specific message inside it.
 *
 * Body: { 
 *   target: 'conversation' | 'message', 
 *   messageId?: string, 
 *   isPinned: boolean 
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // 1. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body format' }, { status: 400 });
    }

    const bodyObj = body as { target: 'conversation' | 'message'; messageId?: string; isPinned: boolean };
    const { target, messageId, isPinned } = bodyObj;

    if (target !== 'conversation' && target !== 'message') {
      return NextResponse.json(
        { error: 'Invalid target. Allowed values: conversation, message' },
        { status: 400 }
      );
    }

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid field: isPinned (boolean)' }, { status: 400 });
    }

    // 2. Perform the update based on the target
    if (target === 'conversation') {
      // Validate conversation exists
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true }
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Update Conversation is_pinned state
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          is_pinned: isPinned
        } as any
      });

      console.log(`[API Pin] Conversation ${conversationId} is_pinned set to ${isPinned}`);
      return NextResponse.json({ success: true, target, isPinned });
    } else {
      // Pinning a specific message
      if (!messageId) {
        return NextResponse.json({ error: 'Missing required field: messageId for message pinning' }, { status: 400 });
      }

      // Verify message exists and belongs to this conversation
      const message = await db.message.findUnique({
        where: { id: messageId },
        select: { id: true, conversationId: true }
      });

      if (!message || message.conversationId !== conversationId) {
        return NextResponse.json({ error: 'Message not found in this conversation' }, { status: 404 });
      }

      // Update Message is_pinned state
      await db.message.update({
        where: { id: messageId },
        data: {
          is_pinned: isPinned
        } as any
      });

      console.log(`[API Pin] Message ${messageId} is_pinned set to ${isPinned}`);
      return NextResponse.json({ success: true, target, messageId, isPinned });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API Pin] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
