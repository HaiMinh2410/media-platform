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

/**
 * Disconnects an account (soft delete).
 */
export async function disconnectAccountAction(accountId: string): Promise<{ success: boolean; error: string | null }> {
  if (!accountId) return { success: false, error: 'ACCOUNT_ID_REQUIRED' };

  const repo = getPlatformAccountRepository();
  const { data: account } = await repo.findById(accountId);
  
  if (!account) return { success: false, error: 'ACCOUNT_NOT_FOUND' };

  // Use update directly to set disconnected_at
  // (Alternatively, I could add a disconnect method to repo, but I've already added cleanupOrphanedAccounts)
  // For single account disconnect:
  try {
    const { db } = await import('@/lib/db');
    await db.platformAccount.update({
      where: { id: accountId },
      data: { disconnected_at: new Date() }
    });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'DATABASE_ERROR' };
  }
}

/**
 * Purges accounts that have been disconnected for more than X days.
 */
export async function purgeOldAccountsAction(workspaceId: string, days: number = 30): Promise<{ count: number; error: string | null }> {
  if (!workspaceId) return { count: 0, error: 'WORKSPACE_ID_REQUIRED' };

  const repo = getPlatformAccountRepository();
  return repo.purgeDeletedAccounts(workspaceId, days);
}
