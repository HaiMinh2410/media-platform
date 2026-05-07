import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConversationWithAccount } from '@/infrastructure/repositories/conversation.repository';
import { metaSendService } from '@/application/services/meta-send.service';
import type { MessagingPlatform } from '@/domain/types/messaging';

const SUPPORTED_PLATFORMS = new Set<string>(['messenger', 'instagram', 'facebook']);

/**
 * POST /api/conversations/[id]/react
 * Adds or removes an emoji reaction to/from a specific message.
 *
 * Body: { 
 *   messageId: string, 
 *   reaction: string, 
 *   action: 'react' | 'unreact' 
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

    const bodyObj = body as { messageId: string; reaction: string; action: 'react' | 'unreact' };
    const { messageId, reaction, action } = bodyObj;

    if (!messageId) {
      return NextResponse.json({ error: 'Missing required field: messageId' }, { status: 400 });
    }

    if (action !== 'react' && action !== 'unreact') {
      return NextResponse.json(
        { error: 'Invalid action. Allowed values: react, unreact' },
        { status: 400 }
      );
    }

    if (action === 'react' && !reaction) {
      return NextResponse.json({ error: 'Missing required field: reaction emoji' }, { status: 400 });
    }

    // 2. Fetch target message details
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        platform_message_id: true,
        reactions: true,
        conversationId: true,
      },
    });

    if (!message || message.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Message not found in this conversation' }, { status: 404 });
    }

    // 3. Resolve conversation with account and token (needed for Meta API)
    const { data: conversation, error: convError } =
      await getConversationWithAccount(conversationId);

    if (convError || !conversation) {
      if (convError === 'CONVERSATION_NOT_FOUND') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: convError || 'Failed to load conversation' }, { status: 500 });
    }

    const { account } = conversation;

    // 4. Update the DB local reactions array
    let currentReactions: any[] = [];
    if (message.reactions && Array.isArray(message.reactions)) {
      currentReactions = [...message.reactions];
    }

    const senderId = account.platform_user_id; // The Agent (page id) is reacting

    if (action === 'react') {
      const existingIndex = currentReactions.findIndex((r: any) => r.senderId === senderId);
      if (existingIndex >= 0) {
        currentReactions[existingIndex].reaction = reaction;
      } else {
        currentReactions.push({
          senderId,
          reaction,
        });
      }
    } else if (action === 'unreact') {
      currentReactions = currentReactions.filter((r: any) => r.senderId !== senderId);
    }

    await db.message.update({
      where: { id: messageId },
      data: {
        reactions: currentReactions,
      },
    });

    // 5. Send reaction via Meta API (async)
    if (SUPPORTED_PLATFORMS.has(account.platform) && account.encryptedToken) {
      metaSendService.sendReaction({
        recipientId: conversation.platform_conversation_id,
        pageId: account.platform_user_id,
        encryptedToken: account.encryptedToken,
        messageId: message.platform_message_id,
        reaction: action === 'react' ? reaction : '', // Empty string triggers 'unreact' in client
        platform: account.platform as MessagingPlatform,
      }).catch(err => {
        console.error(`[API React] Meta sendReaction failed for message ${messageId}:`, err);
      });
    }

    return NextResponse.json({ success: true, reactions: currentReactions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API React] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
