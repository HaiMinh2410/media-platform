import { db } from '../../lib/db';
import type { CreatePlatformAccountInput, PlatformAccountResult } from '../../domain/types/platform-account';

export class PlatformAccountRepository {
  /**
   * Upserts a platform account (Facebook/Instagram/TikTok).
   * Updates the tokens if the account already exists for the same platform/externalId.
   */
  async upsert(input: CreatePlatformAccountInput): Promise<{ data: PlatformAccountResult | null, error: string | null }> {
    try {
      const account = await db.platformAccount.upsert({
        where: {
          platform_platform_user_id: {
            platform: input.platform,
            platform_user_id: input.externalId,
          },
        },
        update: {
          platform_user_name: input.name,
          workspaceId: input.workspaceId,
          metadata: input.metadata || {},
        },
        create: {
          workspaceId: input.workspaceId,
          profile_id: input.profileId,
          platform: input.platform,
          platform_user_id: input.externalId,
          platform_user_name: input.name,
          metadata: input.metadata || {},
        },
        select: {
          id: true,
          workspaceId: true,
          platform: true,
          platform_user_id: true,
          platform_user_name: true,
          metadata: true,
        },
      });

      return {
        data: {
          id: account.id,
          workspaceId: account.workspaceId,
          platform: account.platform as any,
          externalId: account.platform_user_id,
          name: account.platform_user_name,
          metadata: account.metadata,
        },
        error: null
      };
    } catch (err: any) {
      console.error('[PlatformAccountRepository] Upsert failed:', err);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Finds an account by ID.
   */
  async findById(id: string) {
    try {
      const account = await db.platformAccount.findUnique({
        where: { id },
      });
      return { data: account, error: null };
    } catch (error) {
      console.error('[PlatformAccountRepository] findById failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Finds all accounts for a given workspace.
   */
  async findByWorkspaceId(workspaceId: string): Promise<{ data: PlatformAccountResult[] | null, error: string | null }> {
    try {
      const accounts = await db.platformAccount.findMany({
        where: { workspaceId },
        select: {
          id: true,
          workspaceId: true,
          platform: true,
          platform_user_id: true,
          platform_user_name: true,
          metadata: true,
        },
      });

      const mappedAccounts: PlatformAccountResult[] = accounts.map(acc => ({
        id: acc.id,
        workspaceId: acc.workspaceId,
        platform: acc.platform as any,
        externalId: acc.platform_user_id,
        name: acc.platform_user_name,
        metadata: acc.metadata,
      }));

      return { data: mappedAccounts, error: null };
    } catch (error) {
      console.error('[PlatformAccountRepository] findByWorkspaceId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }
}

// Singleton helper
let instance: PlatformAccountRepository | null = null;

export function getPlatformAccountRepository() {
  if (!instance) {
    instance = new PlatformAccountRepository();
  }
  return instance;
}
