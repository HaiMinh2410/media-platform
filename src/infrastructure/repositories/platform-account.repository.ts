import { db } from '../../lib/db';
import type { CreatePlatformAccountInput, PlatformAccount, Platform } from '../../domain/types/platform-account';
import { getTokenEncryptionService } from '../crypto/token-encryption.service';

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
            disconnected_at: null, // Reactivate if it was disconnected
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

        // 2. Handle Meta tokens (Facebook/Instagram)
        const isMeta = input.platform === 'facebook' || input.platform === 'instagram';
        if (isMeta && input.accessToken) {
          console.log('>>> [Repository] Persisting Meta Token...');
          
          // Check if token exists to avoid duplicates
          const existingToken = await tx.meta_tokens.findFirst({
            where: { account_id: account.id }
          });

          if (existingToken) {
            await tx.meta_tokens.update({
              where: { id: existingToken.id },
              data: {
                encrypted_access_token: input.accessToken,
                expires_at: input.expiresAt || new Date(Date.now() + 60 * 60 * 24 * 60 * 1000),
                updated_at: new Date(),
              }
            });
            console.log('>>> [Repository] Meta Token updated.');
          } else {
            await tx.meta_tokens.create({
              data: {
                account_id: account.id,
                encrypted_access_token: input.accessToken,
                expires_at: input.expiresAt || new Date(Date.now() + 60 * 60 * 24 * 60 * 1000),
              }
            });
            console.log('>>> [Repository] Meta Token created.');
          }
        }

        // 3. Handle TikTok tokens
        if (input.platform === 'tiktok' && input.accessToken) {
          console.log('>>> [Repository] Persisting TikTok Token...');
          await tx.tiktok_tokens.upsert({
            where: { account_id: account.id },
            update: {
              encrypted_access_token: input.accessToken,
              encrypted_refresh_token: input.refreshToken,
              expires_at: input.expiresAt || new Date(Date.now() + 60 * 60 * 24 * 60 * 1000),
              updated_at: new Date(),
            },
            create: {
              account_id: account.id,
              encrypted_access_token: input.accessToken,
              encrypted_refresh_token: input.refreshToken,
              expires_at: input.expiresAt || new Date(Date.now() + 60 * 60 * 24 * 60 * 1000),
            }
          });
          console.log('>>> [Repository] TikTok Token upserted.');
        }

        return account;
      });

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
   * Cleans up orphaned accounts for a workspace/platform.
   * Marks accounts as disconnected if they are not in the provided list of valid external IDs.
   */
  async cleanupOrphanedAccounts(workspaceId: string, platform: Platform, activeExternalIds: string[]) {
    try {
      const result = await db.platformAccount.updateMany({
        where: {
          workspaceId,
          platform,
          platform_user_id: { notIn: activeExternalIds },
          disconnected_at: null, // Only disconnect currently active ones
        },
        data: {
          disconnected_at: new Date(),
        }
      });

      console.log(`[PlatformAccountRepository] Cleaned up ${result.count} orphaned ${platform} accounts.`);
      return { count: result.count, error: null };
    } catch (error) {
      console.error('[PlatformAccountRepository] cleanupOrphanedAccounts failed:', error);
      return { count: 0, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Permanently deletes accounts that have been disconnected for a long time.
   * "Dọn dẹp dữ liệu cũ" implementation.
   */
  async purgeDeletedAccounts(workspaceId: string, olderThanDays: number = 30) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - olderThanDays);

    try {
      const result = await db.platformAccount.deleteMany({
        where: {
          workspaceId,
          disconnected_at: { lt: threshold },
        }
      });

      console.log(`[PlatformAccountRepository] Purged ${result.count} old disconnected accounts.`);
      return { count: result.count, error: null };
    } catch (error) {
      console.error('[PlatformAccountRepository] purgeDeletedAccounts failed:', error);
      return { count: 0, error: 'DATABASE_ERROR' };
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
   * Finds all active accounts for a given workspace.
   */
  async findByWorkspaceId(workspaceId: string): Promise<{ data: PlatformAccount[] | null, error: string | null }> {
    try {
      const accounts = await db.platformAccount.findMany({
        where: { 
          workspaceId,
          disconnected_at: null, // Default to only active accounts
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
          disconnected_at: null,
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

  /**
   * Finds all accounts for a workspace with their associated tokens.
   * Useful for developer debug views.
   */
  async findWithTokensByWorkspaceId(workspaceId: string) {
    try {
      const crypto = getTokenEncryptionService();
      const accounts = await db.platformAccount.findMany({
        where: {
          workspaceId,
          disconnected_at: null,
        },
        include: {
          meta_tokens: {
            orderBy: { updated_at: 'desc' },
            take: 1,
          },
          tiktok_tokens: true,
        },
      });

      const result = await Promise.all(accounts.map(async (acc) => {
        let rawMetaToken = null;
        if (acc.meta_tokens[0]) {
          const decrypted = await crypto.decrypt(acc.meta_tokens[0].encrypted_access_token);
          rawMetaToken = {
            id: acc.meta_tokens[0].id,
            token: decrypted.data || 'DECRYPTION_FAILED',
            expiresAt: acc.meta_tokens[0].expires_at,
            updatedAt: acc.meta_tokens[0].updated_at,
          };
        }

        let rawTiktokToken = null;
        if (acc.tiktok_tokens) {
          const decrypted = await crypto.decrypt(acc.tiktok_tokens.encrypted_access_token);
          rawTiktokToken = {
            id: acc.tiktok_tokens.id,
            token: decrypted.data || 'DECRYPTION_FAILED',
            expiresAt: acc.tiktok_tokens.expires_at,
            updatedAt: acc.tiktok_tokens.updated_at,
          };
        }

        return {
          id: acc.id,
          platform: acc.platform,
          platform_user_id: acc.platform_user_id,
          platform_user_name: acc.platform_user_name,
          metaToken: rawMetaToken,
          tiktokToken: rawTiktokToken,
        };
      }));

      return { data: result, error: null };
    } catch (error) {
      console.error('[PlatformAccountRepository] findWithTokensByWorkspaceId failed:', error);
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
