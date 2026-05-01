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

/**
 * Creates a new account cluster (group).
 */
export async function createAccountGroupAction(
  workspaceId: string, 
  name: string, 
  accountIds: string[]
): Promise<{ data: AccountGroup | null; error: string | null }> {
  if (!workspaceId || !name || !accountIds.length) {
    return { data: null, error: 'MISSING_REQUIRED_FIELDS' };
  }

  const repo = getAccountGroupRepository();
  return await repo.create(workspaceId, name, accountIds);
}

/**
 * Deletes an account cluster (group).
 */
export async function deleteAccountGroupAction(groupId: string): Promise<{ success: boolean; error: string | null }> {
  if (!groupId) {
    return { success: false, error: 'GROUP_ID_REQUIRED' };
  }

  const repo = getAccountGroupRepository();
  return await repo.delete(groupId);
}
