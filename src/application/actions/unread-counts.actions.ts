'use server';

import { db } from '@/lib/db';

export type UnreadCounts = {
  all: number;
  facebook: number;
  instagram: number;
};

export async function getUnreadCountsAction(
  workspaceId: string, 
  groupId?: string | null
): Promise<{ data: UnreadCounts | null; error: string | null }> {
  try {
    if (!workspaceId) return { data: null, error: 'WORKSPACE_ID_REQUIRED' };

    // Find all conversations in the workspace/group that have unread messages
    const conversations = await db.conversation.findMany({
      where: {
        platform_accounts: {
          workspaceId: workspaceId,
          ...(groupId ? {
            account_memberships: {
              some: { group_id: groupId }
            }
          } : {})
        },
        messages: {
          some: { is_read: false }
        }
      },
      include: {
        platform_accounts: {
          select: { platform: true }
        },
        _count: {
          select: {
            messages: {
              where: { is_read: false }
            }
          }
        }
      }
    });

    const counts: UnreadCounts = {
      all: 0,
      facebook: 0,
      instagram: 0
    };

    conversations.forEach(conv => {
      counts.all += 1;
      if (conv.platform_accounts.platform === 'facebook') {
        counts.facebook += 1;
      } else if (conv.platform_accounts.platform === 'instagram') {
        counts.instagram += 1;
      }
    });

    return { data: counts, error: null };
  } catch (error: any) {
    console.error('[getUnreadCountsAction] failed:', error);
    return { data: null, error: error.message || 'DATABASE_ERROR' };
  }
}
