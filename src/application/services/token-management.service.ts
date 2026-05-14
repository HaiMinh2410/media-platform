import { getPublisherAccountRepository } from '@/infrastructure/repositories/publisher-account.repository';
import { getPublisherTokenRepository } from '@/infrastructure/repositories/publisher-token.repository';
import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';

export class TokenManagementService {
  private accountRepo = getPublisherAccountRepository();
  private tokenRepo = getPublisherTokenRepository();
  private graphClient = getMetaGraphClient();

  /**
   * Đổi short-lived token sang long-lived token hoặc gia hạn long-lived token hiện tại.
   */
  async refreshLongLivedToken(accountId: string) {
    // 1. Lấy token hiện tại
    const { data: tokenData, error: fetchError } = await this.tokenRepo.getDecryptedToken(accountId);
    if (fetchError || !tokenData) {
      return { error: fetchError || 'TOKEN_NOT_FOUND' };
    }

    // 2. Gọi Meta API để đổi token
    const response = await this.graphClient.exchangeLongLivedToken(tokenData.accessToken);

    if (response.error) {
      console.error(`[TokenManagementService] Failed to exchange token for account ${accountId}:`, response.error);
      
      // Nếu lỗi là do token cũ không còn hợp lệ, deactivate account
      if (response.details?.code === 190) {
        await this.deactivateAccount(accountId);
      }
      
      return { error: response.error };
    }

    const newToken = response.data!;

    // 3. Cập nhật vào DB
    const expiresAt = newToken.expires_in 
      ? new Date(Date.now() + newToken.expires_in * 1000) 
      : undefined;

    await this.tokenRepo.saveToken(accountId, {
      accessToken: newToken.access_token,
      expiresAt,
    });

    return { data: { expiresAt }, error: null };
  }

  /**
   * Kiểm tra sức khỏe của token.
   */
  async validateTokenHealth(accountId: string) {
    // 1. Lấy token
    const { data: tokenData, error: fetchError } = await this.tokenRepo.getDecryptedToken(accountId);
    if (fetchError || !tokenData) {
      return { is_valid: false, error: fetchError || 'TOKEN_NOT_FOUND' };
    }

    // 2. Gọi API /me để kiểm tra tính hợp lệ
    const response = await this.graphClient.getMe(tokenData.accessToken);

    if (response.error) {
      console.warn(`[TokenManagementService] Token health check failed for ${accountId}:`, response.error);
      
      const errorCode = response.details?.code;
      // Error code 190: Access token has expired, been revoked, or is otherwise invalid.
      if (errorCode === 190 || errorCode === 102) {
        await this.deactivateAccount(accountId);
        return { is_valid: false, error: 'TOKEN_INVALID' };
      }
      
      return { is_valid: false, error: response.error };
    }

    // 3. Cập nhật last_validated_at
    await this.tokenRepo.touchValidation(accountId);

    return { is_valid: true, error: null };
  }

  /**
   * Vô hiệu hóa tài khoản khi token không còn hiệu lực.
   */
  private async deactivateAccount(accountId: string) {
    const { data: account } = await this.accountRepo.findById(accountId);
    if (account) {
      await this.accountRepo.upsert({
        profile_id: account.profile_id,
        platform: account.platform,
        platform_id: account.platform_id,
        name: account.name,
        is_active: false
      });
      console.log(`[TokenManagementService] Account ${accountId} has been deactivated due to invalid token.`);
    }
  }
}

// Singleton helper
let instance: TokenManagementService | null = null;

export function getTokenManagementService() {
  if (!instance) {
    instance = new TokenManagementService();
  }
  return instance;
}
