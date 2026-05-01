'use server';

import { db } from '@/lib/db';
import { createClient } from '@/infrastructure/supabase/server';

export async function getCurrentWorkspaceUnreadCountAction(): Promise<{ data: number | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'UNAUTHORIZED' };
    }

    const workspace = await db.workspace.findFirst({
      where: {
        workspace_members: {
          some: {
            profile_id: user.id,
          },
        },
      },
    });

    if (!workspace) {
      return { data: null, error: 'NO_WORKSPACE_FOUND' };
    }

    // Sum unread messages across all conversations in this workspace
    const unreadCount = await db.message.count({
      where: {
        is_read: false,
        conversation: {
          platform_accounts: {
            workspaceId: workspace.id
          }
        }
      }
    });

    return { data: unreadCount, error: null };
  } catch (error: any) {
    console.error('[getCurrentWorkspaceUnreadCountAction] failed:', error);
    return { data: null, error: 'DATABASE_ERROR' };
  }
}

export async function getCurrentWorkspaceIdAction(): Promise<{ data: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'UNAUTHORIZED' };
    }

    const workspace = await db.workspace.findFirst({
      where: {
        workspace_members: {
          some: {
            profile_id: user.id,
          },
        },
      },
    });

    return { data: workspace?.id || null, error: null };
  } catch (error: any) {
    return { data: null, error: 'DATABASE_ERROR' };
  }
}

export async function getCurrentUserWorkspaceAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'UNAUTHORIZED' };

    const workspaceMember = await db.workspace_members.findFirst({
      where: { profile_id: user.id },
      include: {
        workspaces: true,
        profiles: true
      }
    });

    if (!workspaceMember) return { data: null, error: 'NOT_FOUND' };

    return {
      data: {
        user: {
          name: workspaceMember.profiles.full_name || 'User',
          avatar: workspaceMember.profiles.avatar_url,
          role: workspaceMember.role
        },
        workspace: {
          id: workspaceMember.workspaces.id,
          name: workspaceMember.workspaces.name
        }
      },
      error: null
    };
  } catch (error: any) {
    return { data: null, error: 'DATABASE_ERROR' };
  }
}

