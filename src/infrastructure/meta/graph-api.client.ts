import { 
  MetaTokenResponse, 
  MetaUserProfile, 
  MetaDebugTokenData, 
  MetaApiResponse 
} from '@/domain/types/meta';
import { metaFetch } from '@/lib/meta-fetch';

/**
 * Client for interacting with Meta Graph API (Facebook/Instagram).
 * Base URL: https://graph.facebook.com/v25.0
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
    return metaFetch<MetaTokenResponse>(url, '', { serviceName: 'meta-auth' });
  }

  /**
   * Inspects an access token to see its validity, scopes, and user ID.
   */
  async debugToken(inputToken: string): Promise<MetaApiResponse<MetaDebugTokenData>> {
    const appToken = `${this.appId}|${this.appSecret}`;
    const url = `${this.baseUrl}/debug_token?input_token=${inputToken}`;
    return metaFetch<MetaDebugTokenData>(url, appToken, { serviceName: 'meta-debug' });
  }

  /**
   * Fetches basic profile information for the authenticated user.
   */
  async getMe(accessToken: string): Promise<MetaApiResponse<MetaUserProfile>> {
    const url = `${this.baseUrl}/me?fields=id,name,email,picture`;
    return metaFetch<MetaUserProfile>(url, accessToken, { serviceName: 'meta-me' });
  }

  /**
   * Fetches the list of Facebook Pages that the user has access to.
   */
  async getPages(accessToken: string): Promise<MetaApiResponse<{ data: any[] }>> {
    const url = `${this.baseUrl}/me/accounts?fields=id,name,access_token,category,instagram_business_account`;
    return metaFetch<{ data: any[] }>(url, accessToken, { serviceName: 'meta-pages' });
  }

  /**
   * Exchanges a short-lived token for a long-lived token (60 days).
   */
  async exchangeLongLivedToken(shortLivedToken: string): Promise<MetaApiResponse<MetaTokenResponse>> {
    const url = `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortLivedToken}`;
    return metaFetch<MetaTokenResponse>(url, '', { serviceName: 'meta-refresh' });
  }

  /**
   * Universal fetch helper for custom Graph API calls.
   * Supports both GET and POST.
   */
  async request<T>(
    endpoint: string, 
    accessToken: string, 
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET',
    accountId?: string
  ): Promise<MetaApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return metaFetch<T>(url.toString(), accessToken, { accountId, serviceName: `meta-${endpoint.split('/')[1] || endpoint}` });
    } else {
      // For POST, metaFetch needs to be extended to support body if needed.
      // Currently, most Meta Analytics calls are GET.
      // If POST is needed, we'll use raw fetch for now or extend metaFetch.
      const bodyParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          bodyParams.append(key, String(value));
        }
      });
      
      try {
        const urlWithToken = new URL(url.toString());
        urlWithToken.searchParams.append('access_token', accessToken);
        const response = await fetch(urlWithToken.toString(), { method, body: bodyParams });
        const data = await response.json();
        if (!response.ok) return { data: null, error: data.error?.message || 'API_REQUEST_FAILED', details: data.error };
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: 'NETWORK_ERROR', details: err };
      }
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
