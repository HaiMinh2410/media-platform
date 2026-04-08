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
          platform_externalId: {
            platform: input.platform,
            externalId: input.externalId,
          },
        },
        update: {
          name: input.name,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          expiresAt: input.expiresAt,
          workspaceId: input.workspaceId, // Allow moving accounts between workspaces if needed, or keep same
        },
        create: {
          workspaceId: input.workspaceId,
          platform: input.platform,
          externalId: input.externalId,
          name: input.name,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          expiresAt: input.expiresAt,
        },
        select: {
          id: true,
          workspaceId: true,
          platform: true,
          externalId: true,
          name: true,
        },
      });

      return { data: account, error: null };
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
}

// Singleton helper
let instance: PlatformAccountRepository | null = null;

export function getPlatformAccountRepository() {
  if (!instance) {
    instance = new PlatformAccountRepository();
  }
  return instance;
}
