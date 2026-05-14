import { getMetaGraphClient } from '../graph-api.client';
import { getPublisherTokenRepository } from '../../repositories/publisher-token.repository';
import { mapMetaError } from '@/utils/meta-error-mapper';

/**
 * Adapter cơ sở cho các thao tác với Meta API.
 * Tự động xử lý việc lấy và giải mã token trước khi gọi API.
 */
export class MetaBaseAdapter {
  protected graphClient = getMetaGraphClient();
  protected tokenRepo = getPublisherTokenRepository();

  /**
   * Gọi Meta Graph API.
   * @param accountId - UUID nội bộ trong DB (dùng để lấy token từ publisher_tokens)
   * @param endpoint  - Endpoint Graph API đầy đủ, ví dụ: "123456789/feed"
   * @param params    - Các tham số body/query
   * @param method    - HTTP method
   */
  async request<T>(
    accountId: string,
    endpoint: string,
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<{ data: T | null; error: string | null; details?: any }> {

    // 1. Lấy token đã giải mã từ DB (dùng UUID nội bộ)
    const { data: token, error: tokenError } = await this.tokenRepo.getDecryptedToken(accountId);

    if (tokenError || !token) {
      return { data: null, error: tokenError || 'TOKEN_NOT_FOUND' };
    }

    // 2. Thực hiện request qua GraphClient (endpoint dùng platform_id thực)
    const response = await this.graphClient.request<T>(endpoint, token.accessToken, params, method);

    // 3. Xử lý lỗi Meta API phổ biến (ví dụ: Token expired)
    if (response.error) {
      const errorDetail = response.details as any;

      // Chuyển đổi sang user-friendly message
      const friendlyMessage = mapMetaError(errorDetail);

      // Error codes: https://developers.facebook.com/docs/graph-api/overview/error-handling
      if (errorDetail?.code === 190 || errorDetail?.code === 102) {
        console.warn(`[MetaBaseAdapter] Token for account ${accountId} is invalid or expired.`);
        return { data: null, error: friendlyMessage || 'TOKEN_INVALID', details: errorDetail };
      }

      if (errorDetail?.code === 4 || errorDetail?.code === 17 || errorDetail?.code === 32) {
        return { data: null, error: friendlyMessage || 'RATE_LIMIT_REACHED', details: errorDetail };
      }

      return { data: null, error: friendlyMessage || response.error, details: errorDetail };
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
