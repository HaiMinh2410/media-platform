import { getMetaGraphClient } from '../../infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../../infrastructure/crypto/token-encryption.service';
import { getPlatformAccountRepository } from '../../infrastructure/repositories/platform-account.repository';
import { Platform } from '../../domain/types/platform-account';

export class MetaConnectionService {
  /**
   * Completes the Meta OAuth flow: exchange code, encrypt token, save account.
   * Logic dọn dẹp: 
   * 1. Lấy danh sách Pages từ token mới.
   * 2. Upsert từng Page vào Database.
   * 3. Ngắt kết nối (soft delete) các Page cũ không có trong danh sách mới.
   */
  async connectAccount(code: string, workspaceId: string, redirectUri: string, profileId: string) {
    const metaClient = getMetaGraphClient();
    const encryption = getTokenEncryptionService();
    const repository = getPlatformAccountRepository();

    console.log('>>> [MetaService] Starting account connection sync...');

    // 1. Exchange code for user access token
    const tokenResponse = await metaClient.getAccessToken(code, redirectUri);
    if (tokenResponse.error || !tokenResponse.data) {
      return { data: null, error: tokenResponse.error || 'TOKEN_EXCHANGE_FAILED' };
    }

    const userToken = tokenResponse.data.access_token;

    // 2. Fetch Pages authorized by this token
    const pagesResponse = await metaClient.getPages(userToken);
    if (pagesResponse.error || !pagesResponse.data) {
      // Fallback: If no pages, maybe it's just a user profile? 
      // But for our platform, we usually expect pages.
      console.warn('>>> [MetaService] No pages found for this token.');
    }

    const pages = pagesResponse.data?.data || [];
    const connectedExternalIds: string[] = [];

    // 3. Process each Page
    for (const page of pages) {
      console.log(`>>> [MetaService] Syncing page: ${page.name} (${page.id})`);
      
      const encryptedPageToken = await encryption.encrypt(page.access_token);
      if (encryptedPageToken.error || !encryptedPageToken.data) continue;

      const saveResult = await repository.upsert({
        profileId,
        workspaceId,
        platform: 'facebook' as Platform,
        externalId: page.id,
        name: page.name,
        accessToken: encryptedPageToken.data,
        expiresAt: null, // Page tokens from /me/accounts are often long-lived or handled differently
        metadata: {
          category: page.category,
          instagram_id: page.instagram_business_account?.id
        }
      });

      if (saveResult.data) {
        connectedExternalIds.push(page.id);
      }
    }

    // 4. Also upsert the User Profile itself (optional, but good for tracking who connected)
    const profileResponse = await metaClient.getMe(userToken);
    if (profileResponse.data) {
      const encryptedUserToken = await encryption.encrypt(userToken);
      if (encryptedUserToken.data) {
        await repository.upsert({
          profileId,
          workspaceId,
          platform: 'facebook' as Platform, // We mark the user as a 'facebook' account too
          externalId: profileResponse.data.id,
          name: `${profileResponse.data.name} (User Profile)`,
          accessToken: encryptedUserToken.data,
          expiresAt: null,
          metadata: { is_user_profile: true }
        });
        connectedExternalIds.push(profileResponse.data.id);
      }
    }

    // 5. [CLEANUP] Ngắt kết nối các tài khoản cũ không còn trong session này
    // Điều này đảm bảo workspace chỉ chứa các tài khoản mà token hiện tại có quyền truy cập.
    console.log('>>> [MetaService] Cleaning up orphaned accounts...');
    await repository.cleanupOrphanedAccounts(workspaceId, 'facebook', connectedExternalIds);

    return { 
      data: {
        count: connectedExternalIds.length,
        status: 'SYNCED'
      }, 
      error: null 
    };
  }
}

// Singleton helper
let instance: MetaConnectionService | null = null;

export function getMetaConnectionService() {
  if (!instance) {
    instance = new MetaConnectionService();
  }
  return instance;
}
