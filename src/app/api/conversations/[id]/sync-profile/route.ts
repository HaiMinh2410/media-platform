import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { metaProfileService } from '@/application/services/meta-profile.service';

/**
 * POST /api/conversations/[id]/sync-profile
 * Forces a profile sync from the platform API.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { platform_accounts: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const platform = conversation.platform_accounts.platform;
    const externalSenderId = conversation.platform_conversation_id;
    const externalPageId = conversation.platform_accounts.platform_user_id;

    await metaProfileService.syncCustomerProfile({
      conversationId: id,
      platform,
      externalSenderId,
      externalPageId
    });

    // Fetch updated data
    const updated = await db.conversation.findUnique({
      where: { id },
      select: {
        customer_name: true,
        customer_avatar: true,
        customer_username: true,
        customer_link: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PROFILE_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
