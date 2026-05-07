import { NextRequest, NextResponse } from 'next/server';
import { getConversationWithAccount } from '@/infrastructure/repositories/conversation.repository';
import { metaSendService } from '@/application/services/meta-send.service';
import { createClient } from '@/infrastructure/supabase/server';
import type { MessagingPlatform } from '@/domain/types/messaging';

const SUPPORTED_PLATFORMS = new Set<string>(['messenger', 'instagram', 'facebook']);

/**
 * POST /api/conversations/[id]/typing
 * Receives Agent UI keystroke typing state and propagates it to Meta and internal clients.
 *
 * Body: { action: 'typing_on' | 'typing_off' }
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

    if (!body || typeof body !== 'object' || !('action' in body)) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
    }

    const action = (body as { action: string }).action;
    const reqSenderId = (body as { senderId?: string }).senderId;
    if (action !== 'typing_on' && action !== 'typing_off') {
      return NextResponse.json(
        { error: 'Invalid action. Allowed values: typing_on, typing_off' },
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

    // 3. Send sender action via Meta API if platform is supported
    if (SUPPORTED_PLATFORMS.has(account.platform) && account.encryptedToken) {
      // Async call so we don't block the UI wait time
      metaSendService.sendSenderAction({
        recipientId: conversation.platform_conversation_id,
        pageId: account.platform_user_id,
        encryptedToken: account.encryptedToken,
        action,
        platform: account.platform as MessagingPlatform,
      }).catch(err => {
        console.error(`[API Typing] Meta sendSenderAction failed for conversation ${conversationId}:`, err);
      });
    }

    // 4. Broadcast the typing state to all internal connected agents via Supabase Realtime
    const supabase = await createClient();
    const channelName = `conversation:${conversationId}`;
    const channel = supabase.channel(channelName);

    await new Promise<void>((resolve) => {
      let isCleanedUp = false;
      const cleanup = async () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        try {
          await supabase.removeChannel(channel);
        } catch {}
        resolve();
      };

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.send({
              type: 'broadcast',
              event: 'typing',
              payload: {
                conversationId,
                senderId: reqSenderId || account.platform_user_id, // Sent by Agent
                eventType: action, // 'typing_on' or 'typing_off'
                ttl: 8,
              },
            });
            console.log(`[API Typing] Successfully broadcasted ${action} on ${channelName}`);
          } catch (e: any) {
            console.error(`[API Typing] Broadcast channel send error: ${e.message}`);
          } finally {
            await cleanup();
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          await cleanup();
        }
      });
    });

    return NextResponse.json({ success: true, action });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API Typing] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
