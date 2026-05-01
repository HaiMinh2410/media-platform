import { NextRequest, NextResponse } from 'next/server';
import { getConversationWithAccount } from '@/infrastructure/repositories/conversation.repository';
import { createOutgoingMessage } from '../../../../../../message.repository';
import { metaSendService } from '@/application/services/meta-send.service';
import type { MessagingPlatform } from '@/domain/types/messaging';

const SUPPORTED_PLATFORMS = new Set<string>(['messenger', 'instagram', 'facebook']);

/**
 * POST /api/conversations/[id]/reply
 * Sends an agent text reply to the conversation.
 *
 * Body: { text: string }
 *
 * Flow:
 * 1. Resolve conversation → platform account → encrypted Meta token
 * 2. Validate platform is supported (Meta only for MVP)
 * 3. Send message via Meta Graph API (metaSendService)
 * 4. Persist the outgoing message to DB
 * 5. Return the created message IDs
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

    if (
      !body ||
      typeof body !== 'object' ||
      !('text' in body) ||
      typeof (body as Record<string, unknown>).text !== 'string' ||
      !(body as { text: string }).text.trim()
    ) {
      return NextResponse.json(
        { error: 'Missing or empty required field: text' },
        { status: 400 }
      );
    }

    const text = ((body as { text: string }).text).trim();

    // 2. Resolve conversation with account and token
    const { data: conversation, error: convError } =
      await getConversationWithAccount(conversationId);

    if (convError || !conversation) {
      if (convError === 'CONVERSATION_NOT_FOUND') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: convError || 'Failed to load conversation' }, { status: 500 });
    }

    const { account } = conversation;

    // 3. Validate platform is supported
    if (!SUPPORTED_PLATFORMS.has(account.platform)) {
      return NextResponse.json(
        { error: `Unsupported platform for replies: ${account.platform}` },
        { status: 422 }
      );
    }

    if (!account.encryptedToken) {
      return NextResponse.json(
        { error: 'No access token available for this account' },
        { status: 422 }
      );
    }

    // 4. Send via Meta API
    const { data: sendData, error: sendError } = await metaSendService.sendText({
      recipientId: conversation.platform_conversation_id,
      pageId: account.platform_user_id,
      encryptedToken: account.encryptedToken,
      text,
      platform: account.platform as MessagingPlatform,
    });

    if (sendError || !sendData) {
      console.error(`[API Reply] Meta send failed for conversation ${conversationId}:`, sendError);
      return NextResponse.json(
        { error: `Failed to send message: ${sendError}` },
        { status: 502 }
      );
    }

    // 5. Persist the outgoing message to DB
    const { data: created, error: dbError } = await createOutgoingMessage(
      conversationId,
      text,
      account.platform_user_id
    );

    if (dbError || !created) {
      // Message was sent but DB persistence failed — log it as a warning, not a hard error.
      // The agent's message has been delivered; this is a non-critical failure.
      console.error(
        `[API Reply] Message sent to Meta but DB persistence failed for conversation ${conversationId}:`,
        dbError
      );
      return NextResponse.json(
        { error: 'Message sent but failed to persist to database', code: 'DB_PERSIST_FAILED' },
        { status: 207 }
      );
    }

    return NextResponse.json(
      {
        data: {
          messageId: created.messageId,
          platformMessageId: sendData.messageId,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API Reply] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
