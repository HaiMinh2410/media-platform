import { db } from '../../lib/db';
import type { CreatePlatformAccountInput, PlatformAccount } from '../../domain/types/platform-account';

export class PlatformAccountRepository {
  /**
   * Upserts a platform account (Facebook/Instagram/TikTok).
   * Updates the tokens if the account already exists for the same platform/externalId.
   */
  async upsert(input: CreatePlatformAccountInput): Promise<{ data: PlatformAccount | null, error: string | null }> {
    console.log('>>> [Repository] UPSERT START - Platform:', input.platform, 'Token present:', !!input.accessToken);
    try {
      const result = await db.$transaction(async (tx) => {
        // 1. Upsert the main platform account
        const account = await tx.platformAccount.upsert({
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
        });

        console.log('>>> [Repository] Account ID preserved:', account.id);

        // 2. Handle Meta tokens
        const isMeta = input.platform === 'facebook' || input.platform === 'instagram';
        if (isMeta && input.accessToken) {
          console.log('>>> [Repository] Persisting Meta Token...');
          // Using create for now since meta_tokens doesn't have a simple unique constraint on account_id in the current schema
          // but we want to ensure at least one exists. 
          await tx.meta_tokens.create({
             data: {
               account_id: account.id,
               encrypted_access_token: input.accessToken,
               expires_at: input.expiresAt || new Date(Date.now() + 60 * 60 * 24 * 60 * 1000),
             }
          });
          console.log('>>> [Repository] Meta Token created.');
        }

        return account;
      });

      console.log(`[PlatformAccountRepository] SUCCESS: ${result.platform_user_name}`);

      return {
        data: {
          id: result.id,
          workspaceId: result.workspaceId,
          platform: result.platform as any,
          externalId: result.platform_user_id,
          name: result.platform_user_name,
          metadata: result.metadata,
        },
        error: null
      };
    } catch (err: any) {
      console.error('!!! [Repository] UPSERT CRITICAL ERROR:', err);
      return { data: null, error: `DATABASE_ERROR: ${err.message}` };
    }
  }

  /**
   * Finds an account by ID.
   */
  async findById(id: string): Promise<{ data: PlatformAccount | null, error: string | null }> {
    try {
      const account = await db.platformAccount.findUnique({
        where: { id },
      });
      if (!account) return { data: null, error: 'Account not found' };

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
    } catch (error) {
      console.error('[PlatformAccountRepository] findById failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Finds all accounts for a given workspace.
   */
  async findByWorkspaceId(workspaceId: string): Promise<{ data: PlatformAccount[] | null, error: string | null }> {
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

      const mappedAccounts: PlatformAccount[] = accounts.map(acc => ({
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

  /**
   * Finds all accounts that have Meta tokens attached.
   * Useful for background sync services (Analytics, Scheduler).
   */
  async findAllWithMetaTokens() {
    try {
      const accounts = await db.platformAccount.findMany({
        where: {
          platform: { in: ['facebook', 'instagram'] },
        },
        include: {
          meta_tokens: {
            orderBy: { updated_at: 'desc' },
            take: 1,
          },
        },
      });

      return {
        data: accounts.map(acc => ({
          id: acc.id,
          externalId: acc.platform_user_id,
          platform: acc.platform,
          encryptedToken: acc.meta_tokens[0]?.encrypted_access_token,
        })).filter(acc => !!acc.encryptedToken),
        error: null,
      };
    } catch (error) {
      console.error('[PlatformAccountRepository] findAllWithMetaTokens failed:', error);
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
