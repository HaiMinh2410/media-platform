import { getMetaGraphClient } from '../../infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../../infrastructure/crypto/token-encryption.service';
import { getPlatformAccountRepository } from '../../infrastructure/repositories/platform-account.repository';
import { getPublisherAccountRepository } from '../../infrastructure/repositories/publisher-account.repository';
import { getPublisherTokenRepository } from '../../infrastructure/repositories/publisher-token.repository';
import { Platform } from '../../domain/types/platform-account';

export class MetaConnectionService {
  private publisherAccountRepo = getPublisherAccountRepository();
  private publisherTokenRepo = getPublisherTokenRepository();

  /**
   * Completes the Meta OAuth flow: exchange code, encrypt token, save account.
   */
  async connectAccount(code: string, workspaceId: string, redirectUri: string, profileId: string) {
    const metaClient = getMetaGraphClient();
    const encryption = getTokenEncryptionService();
    const repository = getPlatformAccountRepository(); // Vẫn giữ cho hệ thống cũ

    console.log('>>> [MetaService] Starting account connection sync...');

    // 1. Exchange code for user access token
    const tokenResponse = await metaClient.getAccessToken(code, redirectUri);
    if (tokenResponse.error || !tokenResponse.data) {
      return { data: null, error: tokenResponse.error || 'TOKEN_EXCHANGE_FAILED' };
    }

    let userToken = tokenResponse.data.access_token;
    let userScopes: string[] = [];

    // 1a. Debug token to get scopes and validity
    const debugResponse = await metaClient.debugToken(userToken);
    if (debugResponse.data) {
      userScopes = debugResponse.data.data.scopes;
      console.log(`>>> [MetaService] Scopes granted: ${userScopes.join(', ')}`);
    }

    // 1b. Exchange for LONG-LIVED user token (60 days)
    console.log('>>> [MetaService] Exchanging for long-lived user token...');
    const longLivedResponse = await metaClient.exchangeLongLivedToken(userToken);
    if (longLivedResponse.data) {
      userToken = longLivedResponse.data.access_token;
      console.log('>>> [MetaService] Long-lived token acquired.');
    }

    // 2. Fetch Pages authorized by this token
    // Page tokens derived from long-lived user tokens are also long-lived (no expiry)
    const pagesResponse = await metaClient.getPages(userToken);
    const pages = pagesResponse.data?.data || [];
    
    const connectedFbIds: string[] = [];
    const connectedIgIds: string[] = [];

    // 3. Process each Page
    for (const page of pages) {
      console.log(`>>> [MetaService] Syncing page: ${page.name} (${page.id})`);
      
      const pageToken = page.access_token;
      
      // --- LƯU VÀO HỆ THỐNG MỚI (Social Publisher Pro) ---
      const publisherFb = await this.publisherAccountRepo.upsert({
        profile_id: profileId,
        platform: 'FACEBOOK',
        platform_id: page.id,
        name: page.name,
        avatar_url: `https://graph.facebook.com/${page.id}/picture?type=normal`
      });

      if (publisherFb.data) {
        await this.publisherTokenRepo.saveToken(publisherFb.data.id, {
          accessToken: pageToken,
          scopes: userScopes,
          expiresAt: undefined // Page tokens are long-lived and don't expire easily
        });
        connectedFbIds.push(page.id);
      }

      // Instagram Account if linked
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        console.log(`>>> [MetaService] Found linked Instagram: ${ig.id}`);

        const publisherIg = await this.publisherAccountRepo.upsert({
          profile_id: profileId,
          platform: 'INSTAGRAM',
          platform_id: ig.id,
          name: `${page.name} (Instagram)`,
          avatar_url: undefined
        });

        if (publisherIg.data) {
          await this.publisherTokenRepo.saveToken(publisherIg.data.id, {
            accessToken: pageToken,
            scopes: userScopes,
            expiresAt: undefined
          });
          connectedIgIds.push(ig.id);
        }
      }

      // --- LƯU VÀO HỆ THỐNG CŨ (Inbox/Chat) ---
      const encryptedPageToken = await encryption.encrypt(pageToken);
      if (encryptedPageToken.data) {
        await repository.upsert({
          profileId,
          workspaceId,
          platform: 'facebook' as Platform,
          externalId: page.id,
          name: page.name,
          accessToken: encryptedPageToken.data,
          expiresAt: null,
          metadata: {
            category: page.category,
            instagram_id: page.instagram_business_account?.id
          }
        });

        if (page.instagram_business_account) {
          await repository.upsert({
            profileId,
            workspaceId,
            platform: 'instagram' as Platform,
            externalId: page.instagram_business_account.id,
            name: `${page.name} (Instagram)`,
            accessToken: encryptedPageToken.data,
            expiresAt: null,
            metadata: { facebook_page_id: page.id }
          });
        }
      }
    }

    // 4. [CLEANUP] Ngắt kết nối các tài khoản cũ (Hệ thống cũ)
    await repository.cleanupOrphanedAccounts(workspaceId, 'facebook', connectedFbIds);
    await repository.cleanupOrphanedAccounts(workspaceId, 'instagram', connectedIgIds);

    return { 
      data: {
        facebookCount: connectedFbIds.length,
        instagramCount: connectedIgIds.length,
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
