import { getMetaGraphClient } from '../graph-api.client';
import { getPublisherTokenRepository } from '../../repositories/publisher-token.repository';

/**
 * Adapter cơ sở cho các thao tác với Meta API.
 * Tự động xử lý việc lấy và giải mã token trước khi gọi API.
 */
export class MetaBaseAdapter {
  protected graphClient = getMetaGraphClient();
  protected tokenRepo = getPublisherTokenRepository();

  /**
   * Gọi Meta Graph API với token của tài khoản được chỉ định.
   */
  async request<T>(
    accountId: string, 
    endpoint: string, 
    params: Record<string, string> = {}
  ): Promise<{ data: T | null; error: string | null; details?: any }> {
    
    // 1. Lấy token đã giải mã từ DB
    const { data: token, error: tokenError } = await this.tokenRepo.getDecryptedToken(accountId);
    
    if (tokenError || !token) {
      return { data: null, error: tokenError || 'TOKEN_NOT_FOUND' };
    }

    // 2. Thực hiện request qua GraphClient
    const response = await this.graphClient.request<T>(endpoint, token.accessToken, params);

    // 3. Xử lý lỗi Meta API phổ biến (ví dụ: Token expired)
    if (response.error) {
      const errorDetail = response.details as any;
      
      // Error codes: https://developers.facebook.com/docs/graph-api/overview/error-handling
      if (errorDetail?.code === 190 || errorDetail?.code === 102) {
        console.warn(`[MetaBaseAdapter] Token for account ${accountId} is invalid or expired.`);
        // Note: Logic refresh tự động sẽ được xử lý ở Application Layer (T174)
        return { data: null, error: 'TOKEN_INVALID', details: errorDetail };
      }

      if (errorDetail?.code === 4 || errorDetail?.code === 17 || errorDetail?.code === 32) {
        return { data: null, error: 'RATE_LIMIT_REACHED', details: errorDetail };
      }
    }

    return response;
  }
}

// Singleton helper
let instance: MetaBaseAdapter | null = null;

export function getMetaBaseAdapter() {
  if (!instance) {
    instance = new MetaBaseAdapter();
  }
  return instance;
}
