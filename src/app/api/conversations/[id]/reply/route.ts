import { NextRequest, NextResponse } from 'next/server';
import { getConversationWithAccount } from '@/infrastructure/repositories/conversation.repository';
import { createOutgoingMessage } from '../../../../../../message.repository';
import { metaSendService } from '@/application/services/meta-send.service';
import type { MessagingPlatform, MessageAttachment } from '@/domain/types/messaging';
import { db } from '@/lib/db';

const SUPPORTED_PLATFORMS = new Set<string>(['messenger', 'instagram', 'facebook']);

/**
 * POST /api/conversations/[id]/reply
 * Sends an agent text reply, quote reply, and/or file attachments to the conversation.
 *
 * Body: { 
 *   text?: string, 
 *   parentMessageId?: string, 
 *   attachments?: MessageAttachment[] 
 * }
 *
 * Flow:
 * 1. Resolve conversation → platform account → encrypted Meta token
 * 2. Validate platform is supported (Meta only for MVP)
 * 3. Resolve parent platform message ID if parentMessageId is provided
 * 4. Send message text/reply/attachments via Meta Graph API
 * 5. Persist the outgoing message with relation and attachments to DB
 * 6. Return the created message IDs
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

    const bodyObj = body as { text?: string; parentMessageId?: string; attachments?: MessageAttachment[] };
    const text = bodyObj.text?.trim() || '';
    const parentMessageId = bodyObj.parentMessageId || null;
    const attachments = bodyObj.attachments || null;

    if (!text && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Missing content. Please provide either "text" or "attachments"' },
        { status: 400 }
      );
    }

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

    // 4. Resolve parent platform message ID (for reply quoting)
    let platformParentMessageId: string | null = null;
    if (parentMessageId) {
      const parentMsg = await db.message.findUnique({
        where: { id: parentMessageId },
        select: { platform_message_id: true }
      });
      if (parentMsg) {
        platformParentMessageId = parentMsg.platform_message_id;
      }
    }

    // 5. Send via Meta API
    let mainPlatformMessageId = '';
    let lastError = null;

    // Send text first (either reply-quote or standard text message)
    if (text) {
      if (platformParentMessageId) {
        const { data: sendData, error: sendError } = await metaSendService.sendTextWithReply({
          recipientId: conversation.platform_conversation_id,
          pageId: account.platform_user_id,
          encryptedToken: account.encryptedToken,
          text,
          replyToMessageId: platformParentMessageId,
          platform: account.platform as MessagingPlatform,
        });
        if (sendError) {
          lastError = sendError;
        } else if (sendData) {
          mainPlatformMessageId = sendData.messageId;
        }
      } else {
        const { data: sendData, error: sendError } = await metaSendService.sendText({
          recipientId: conversation.platform_conversation_id,
          pageId: account.platform_user_id,
          encryptedToken: account.encryptedToken,
          text,
          platform: account.platform as MessagingPlatform,
        });
        if (sendError) {
          lastError = sendError;
        } else if (sendData) {
          mainPlatformMessageId = sendData.messageId;
        }
      }
    }

    // Send attachments next
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const { data: sendData, error: sendError } = await metaSendService.sendAttachment({
          recipientId: conversation.platform_conversation_id,
          pageId: account.platform_user_id,
          encryptedToken: account.encryptedToken,
          text: text || '',
          platform: account.platform as MessagingPlatform,
          attachmentType: att.type,
          url: att.payload.url,
        });

        if (sendError) {
          lastError = sendError;
        } else if (sendData && !mainPlatformMessageId) {
          // If text was not sent, use the first attachment's message ID as main platform ID
          mainPlatformMessageId = sendData.messageId;
        }
      }
    }

    if (lastError && !mainPlatformMessageId) {
      console.error(`[API Reply] Meta send failed for conversation ${conversationId}:`, lastError);
      return NextResponse.json(
        { error: `Failed to send message: ${lastError}` },
        { status: 502 }
      );
    }

    // 6. Persist the outgoing message to DB
    const { data: created, error: dbError } = await createOutgoingMessage(
      conversationId,
      text,
      account.platform_user_id,
      mainPlatformMessageId || undefined,
      parentMessageId,
      attachments
    );

    if (dbError || !created) {
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
          platformMessageId: created.platformMessageId,
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
