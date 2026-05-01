'use server';

import { getAccountGroupRepository } from '@/infrastructure/repositories/account-group.repository';
import { AccountGroup } from '@/domain/types/account-group';

/**
 * Fetches all account clusters (groups) for a specific workspace.
 */
export async function getAccountGroupsAction(workspaceId: string): Promise<{ data: AccountGroup[] | null; error: string | null }> {
  if (!workspaceId) {
    return { data: null, error: 'WORKSPACE_ID_REQUIRED' };
  }

  const repo = getAccountGroupRepository();
  const { data, error } = await repo.findByWorkspaceId(workspaceId);

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
