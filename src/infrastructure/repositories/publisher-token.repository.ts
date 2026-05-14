import { db } from '../../lib/db';
import { getTokenEncryptionService } from '../crypto/token-encryption.service';

export type SaveTokenInput = {
  accessToken: string;
  refreshToken?: string;
  scopes?: string[];
  expiresAt?: Date;
};

export class PublisherTokenRepository {
  private crypto = getTokenEncryptionService();

  /**
   * Lưu trữ token mã hóa. Tự động mã hóa access_token và refresh_token (nếu có).
   */
  async saveToken(accountId: string, data: SaveTokenInput) {
    try {
      const encryptedAccess = await this.crypto.encrypt(data.accessToken);
      if (encryptedAccess.error) return { data: null, error: 'ENCRYPTION_FAILED' };

      let encryptedRefresh = null;
      if (data.refreshToken) {
        const res = await this.crypto.encrypt(data.refreshToken);
        encryptedRefresh = res.data;
      }

      const token = await db.accountToken.upsert({
        where: { account_id: accountId },
        update: {
          access_token: encryptedAccess.data!,
          refresh_token: encryptedRefresh,
          scopes: data.scopes || [],
          expires_at: data.expiresAt,
          last_validated_at: new Date(),
        },
        create: {
          account_id: accountId,
          access_token: encryptedAccess.data!,
          refresh_token: encryptedRefresh,
          scopes: data.scopes || [],
          expires_at: data.expiresAt,
        },
      });
      return { data: token, error: null };
    } catch (error: any) {
      console.error('[PublisherTokenRepository] saveToken failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Lấy token đã giải mã cho một account.
   */
  async getDecryptedToken(accountId: string) {
    try {
      const tokenRecord = await db.accountToken.findUnique({
        where: { account_id: accountId }
      });
      
      if (!tokenRecord) return { data: null, error: 'TOKEN_NOT_FOUND' };

      const decryptedAccess = await this.crypto.decrypt(tokenRecord.access_token);
      if (decryptedAccess.error) return { data: null, error: 'DECRYPTION_FAILED' };

      let decryptedRefresh = null;
      if (tokenRecord.refresh_token) {
        const res = await this.crypto.decrypt(tokenRecord.refresh_token);
        decryptedRefresh = res.data;
      }

      return {
        data: {
          accessToken: decryptedAccess.data!,
          refreshToken: decryptedRefresh,
          scopes: tokenRecord.scopes,
          expiresAt: tokenRecord.expires_at,
          lastValidatedAt: tokenRecord.last_validated_at
        },
        error: null
      };
    } catch (error: any) {
      console.error('[PublisherTokenRepository] getDecryptedToken failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Cập nhật thời gian kiểm tra token cuối cùng.
   */
  async touchValidation(accountId: string) {
    try {
      await db.accountToken.update({
        where: { account_id: accountId },
        data: { last_validated_at: new Date() }
      });
      return { error: null };
    } catch (error: any) {
      console.error('[PublisherTokenRepository] touchValidation failed:', error);
      return { error: 'DATABASE_ERROR' };
    }
  }
}

// Singleton helper
let instance: PublisherTokenRepository | null = null;

export function getPublisherTokenRepository() {
  if (!instance) {
    instance = new PublisherTokenRepository();
  }
  return instance;
}
