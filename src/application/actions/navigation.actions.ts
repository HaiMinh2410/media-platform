'use server';

import { db } from '@/lib/db';
import { createClient } from '@/infrastructure/supabase/server';

export async function getCommandPaletteItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'UNAUTHORIZED' };
  }

  // For MVP, we get the first workspace the user belongs to
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

  try {
    // 1. Fetch Accounts
    const accounts = await db.platformAccount.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        platform: true,
        platform_user_name: true,
      },
    });

    // 2. Fetch Groups
    // Using string indexing to bypass potential ghost TS errors in IDE
    const groups = await (db as any).accountGroup.findMany({
      where: { workspace_id: workspace.id },
      select: {
        id: true,
        name: true,
      },
    });

    // 3. Fetch Tags (Distinct from conversations in this workspace)
    const conversations = await db.conversation.findMany({
      where: {
        platform_accounts: {
          workspaceId: workspace.id,
        },
      },
      select: {
        tags: true,
      },
    });

    const tags = Array.from(new Set(conversations.flatMap(c => c.tags)));

    return {
      data: {
        accounts: accounts.map(a => ({
          id: a.id,
          name: a.platform_user_name,
          platform: a.platform,
        })),
        groups: groups.map((g: any) => ({
          id: g.id,
          name: g.name,
        })),
        tags: tags.map(t => ({
          name: t,
        })),
      },
      error: null,
    };
  } catch (error) {
    console.error('[navigation.actions] getCommandPaletteItems failed:', error);
    return { data: null, error: 'DATABASE_ERROR' };
  }
}
