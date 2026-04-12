import { getMetaGraphClient } from '../../infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../../infrastructure/crypto/token-encryption.service';
import { getPlatformAccountRepository } from '../../infrastructure/repositories/platform-account.repository';
import { Platform } from '../../domain/types/platform-account';

export class MetaConnectionService {
  /**
   * Completes the Meta OAuth flow: exchange code, encrypt token, save account.
   */
  async connectAccount(code: string, workspaceId: string, redirectUri: string, profileId: string) {
    const metaClient = getMetaGraphClient();
    const encryption = getTokenEncryptionService();
    const repository = getPlatformAccountRepository();

    // 1. Exchange code for user access token
    const tokenResponse = await metaClient.getAccessToken(code, redirectUri);
    if (tokenResponse.error || !tokenResponse.data) {
      return { data: null, error: tokenResponse.error || 'TOKEN_EXCHANGE_FAILED' };
    }

    const accessToken = tokenResponse.data.access_token;
    const expiresSeconds = tokenResponse.data.expires_in;
    const expiresAt = expiresSeconds ? new Date(Date.now() + expiresSeconds * 1000) : null;

    // 2. Fetch user profile to get External ID and Name
    const profileResponse = await metaClient.getMe(accessToken);
    if (profileResponse.error || !profileResponse.data) {
      return { data: null, error: profileResponse.error || 'PROFILE_FETCH_FAILED' };
    }

    const profile = profileResponse.data;

    // 3. Encrypt the access token before storing
    const encrypted = await encryption.encrypt(accessToken);
    if (encrypted.error || !encrypted.data) {
      return { data: null, error: 'ENCRYPTION_FAILED' };
    }

    // 4. Save to Database
    // Defaulting to FACEBOOK for Meta OAuth connection, can be refined later for Instagram
    const saveResult = await repository.upsert({
      profileId,
      workspaceId,
      platform: 'facebook' as Platform,
      externalId: profile.id,
      name: profile.name,
      accessToken: encrypted.data,
      expiresAt: expiresAt,
    });

    if (saveResult.error || !saveResult.data) {
      return { data: null, error: saveResult.error || 'DATABASE_SAVE_FAILED' };
    }

    return { 
      data: {
        accountId: saveResult.data.id,
        name: saveResult.data.name,
        platform: saveResult.data.platform,
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
