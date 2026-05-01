import { 
  MetaTokenResponse, 
  MetaUserProfile, 
  MetaDebugTokenData, 
  MetaApiResponse 
} from '@/domain/types/meta';

/**
 * Client for interacting with Meta Graph API (Facebook/Instagram).
 * Base URL: https://graph.facebook.com/v19.0
 */
export class MetaGraphClient {
  private readonly baseUrl = 'https://graph.facebook.com/v25.0';
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.META_APP_ID || '';
    this.appSecret = process.env.META_APP_SECRET || '';

    if (!this.appId || !this.appSecret) {
      console.warn('[MetaGraphClient] Missing META_APP_ID or META_APP_SECRET in environment.');
    }
  }

  /**
   * Exchanges an authorization code for an access token.
   */
  async getAccessToken(code: string, redirectUri: string): Promise<MetaApiResponse<MetaTokenResponse>> {
    const url = `${this.baseUrl}/oauth/access_token?client_id=${this.appId}&redirect_uri=${redirectUri}&client_secret=${this.appSecret}&code=${code}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'FAILED_TO_GET_ACCESS_TOKEN',
          details: data.error
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[MetaGraphClient] getAccessToken error:', err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Inspects an access token to see its validity, scopes, and user ID.
   * Requires an App Access Token (client_id|client_secret) or a valid user token.
   */
  async debugToken(inputToken: string): Promise<MetaApiResponse<MetaDebugTokenData>> {
    // App access token is used to inspect other tokens
    const appToken = `${this.appId}|${this.appSecret}`;
    const url = `${this.baseUrl}/debug_token?input_token=${inputToken}&access_token=${appToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'FAILED_TO_DEBUG_TOKEN',
          details: data.error
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[MetaGraphClient] debugToken error:', err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Fetches basic profile information for the authenticated user.
   */
  async getMe(accessToken: string): Promise<MetaApiResponse<MetaUserProfile>> {
    const url = `${this.baseUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'FAILED_TO_GET_USER_PROFILE',
          details: data.error
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[MetaGraphClient] getMe error:', err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Universal fetch helper for custom Graph API calls.
   */
  async request<T>(endpoint: string, accessToken: string, params: Record<string, string> = {}): Promise<MetaApiResponse<T>> {
    const searchParams = new URLSearchParams({ ...params, access_token: accessToken });
    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error?.message || 'API_REQUEST_FAILED', details: data.error };
      }

      return { data, error: null };
    } catch (err) {
      console.error(`[MetaGraphClient] request error (${endpoint}):`, err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }
}

// Singleton helper
let instance: MetaGraphClient | null = null;

export function getMetaGraphClient() {
  if (!instance) {
    instance = new MetaGraphClient();
  }
  return instance;
}
