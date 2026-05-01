'use server';

import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { PlatformAccount } from '@/domain/types/platform-account';

/**
 * Fetches all platform accounts for a specific workspace.
 */
export async function getPlatformAccountsAction(workspaceId: string): Promise<{ data: PlatformAccount[] | null; error: string | null }> {
  if (!workspaceId) {
    return { data: null, error: 'WORKSPACE_ID_REQUIRED' };
  }

  const repo = getPlatformAccountRepository();
  const { data, error } = await repo.findByWorkspaceId(workspaceId);

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
