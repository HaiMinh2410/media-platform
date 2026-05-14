import { db } from '@/lib/db';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getPublisherAccountRepository } from '@/infrastructure/repositories/publisher-account.repository';
import { getPublisherTokenRepository } from '@/infrastructure/repositories/publisher-token.repository';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';

export class AccountSyncService {
  private platformRepo = getPlatformAccountRepository();
  private publisherRepo = getPublisherAccountRepository();
  private publisherTokenRepo = getPublisherTokenRepository();
  private crypto = getTokenEncryptionService();

  /**
   * Tự động đồng bộ tài khoản từ hệ thống cũ (Settings) sang hệ thống mới (Publisher).
   */
  async syncLegacyAccounts(profileId: string, workspaceId: string) {
    try {
      console.log(`[AccountSync] Starting sync for user ${profileId} in workspace ${workspaceId}`);
      
      // 1. Lấy danh sách tài khoản cũ có Meta Token
      const { data: legacyAccounts } = await this.platformRepo.findByWorkspaceId(workspaceId);
      if (!legacyAccounts || legacyAccounts.length === 0) return { success: true };

      for (const oldAcc of legacyAccounts) {
        // Chỉ xử lý Facebook và Instagram
        if (oldAcc.platform !== 'facebook' && oldAcc.platform !== 'instagram') continue;

        const platformUpper = oldAcc.platform.toUpperCase();
        
        // 2. Kiểm tra xem đã có ở hệ thống mới chưa
        const existing = await db.account.findUnique({
          where: {
            profile_id_platform_platform_id: {
              profile_id: profileId,
              platform: platformUpper,
              platform_id: oldAcc.externalId
            }
          }
        });

        if (!existing) {
          console.log(`[AccountSync] Migrating account: ${oldAcc.name} (${platformUpper})`);
          
          // 3. Lấy và giải mã Token từ hệ thống cũ
          // Chúng ta cần query trực tiếp vì platformRepo không trả về token mặc định
          const oldTokenRecord = await db.meta_tokens.findFirst({
            where: { account_id: oldAcc.id },
            orderBy: { updated_at: 'desc' }
          });

          if (oldTokenRecord && oldTokenRecord.encrypted_access_token) {
            const decryptedRes = await this.crypto.decrypt(oldTokenRecord.encrypted_access_token);
            
            if (decryptedRes.data) {
              // 4. Tạo tài khoản mới ở hệ thống Publisher
              const newAccRes = await this.publisherRepo.upsert({
                profile_id: profileId,
                platform: platformUpper as any,
                platform_id: oldAcc.externalId,
                name: oldAcc.name,
                avatar_url: (oldAcc as any).avatar_url
              });

              if (newAccRes.data) {
                // 5. Lưu Token vào hệ thống Publisher (Repo này sẽ tự mã hóa lại)
                await this.publisherTokenRepo.saveToken(newAccRes.data.id, {
                  accessToken: decryptedRes.data,
                  expiresAt: oldTokenRecord.expires_at
                });
                console.log(`[AccountSync] Successfully migrated ${oldAcc.name}`);
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[AccountSync] Critical sync error:', error);
      return { success: false, error };
    }
  }
}

let instance: AccountSyncService | null = null;
export function getAccountSyncService() {
  if (!instance) instance = new AccountSyncService();
  return instance;
}
