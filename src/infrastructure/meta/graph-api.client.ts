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
   * Fetches the list of Facebook Pages that the user has access to.
   */
  async getPages(accessToken: string): Promise<MetaApiResponse<{ data: any[] }>> {
    const url = `${this.baseUrl}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'FAILED_TO_GET_PAGES',
          details: data.error
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[MetaGraphClient] getPages error:', err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Exchanges a short-lived token for a long-lived token (60 days).
   */
  async exchangeLongLivedToken(shortLivedToken: string): Promise<MetaApiResponse<MetaTokenResponse>> {
    const url = `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortLivedToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'FAILED_TO_EXCHANGE_TOKEN',
          details: data.error
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[MetaGraphClient] exchangeLongLivedToken error:', err);
      return { data: null, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Universal fetch helper for custom Graph API calls.
   * Supports both GET and POST.
   */
  async request<T>(
    endpoint: string, 
    accessToken: string, 
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<MetaApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append('access_token', accessToken);

    const options: RequestInit = { method };

    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    } else {
      // Meta Graph API typically accepts POST parameters as x-www-form-urlencoded
      const bodyParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          bodyParams.append(key, String(value));
        }
      });
      options.body = bodyParams;
    }

    try {
      const response = await fetch(url.toString(), options);
      const data = await response.json();

      if (!response.ok) {
        return { 
          data: null, 
          error: data.error?.message || 'API_REQUEST_FAILED', 
          details: data.error 
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error(`[MetaGraphClient] request error (${method} ${endpoint}):`, err);
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
