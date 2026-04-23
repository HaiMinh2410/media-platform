import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { upsertAnalyticsSnapshot } from '@/infrastructure/repositories/analytics.repository';
import type { 
  MetaInsightsResponse, 
  MetaPageFansResponse, 
  MetaIGFollowersResponse 
} from '@/domain/types/meta';

/**
 * Service for syncing analytics data from Meta Graph API.
 * Handles both Facebook Pages and Instagram Business Accounts.
 */
export const metaAnalyticsService = {
  /**
   * Syncs daily analytics for a single Meta account.
   * Maps Meta metrics to our internal AnalyticsSnapshot model.
   */
  async syncAccount(params: {
    accountId: string;      // Internal DB ID
    externalId: string;     // FB Page ID or IG Business Account ID
    platform: string;       // 'facebook' or 'instagram'
    encryptedToken: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { accountId, externalId, platform, encryptedToken } = params;

    try {
      // 1. Decrypt access token
      const encryptionService = getTokenEncryptionService();
      const { data: accessToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

      if (decryptError || !accessToken) {
        return { success: false, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
      }

      const client = getMetaGraphClient();
      let reach = 0;
      let impressions = 0;
      let engagement = 0;
      let followers = 0;

      // 2. Fetch platform-specific metrics
      if (platform === 'facebook' || platform === 'meta') {
        // Facebook Page Insights (Reach & Engagement)
        // Note: page_impressions is often used as a proxy for reach if page_reach is restricted
        const insightsRes = await client.request<MetaInsightsResponse>(
          `${externalId}/insights`,
          accessToken,
          { metric: 'page_impressions,page_post_engagements', period: 'day' }
        );

        if (insightsRes.data) {
          impressions = insightsRes.data.data.find(i => i.name === 'page_impressions')?.values[0]?.value || 0;
          engagement = insightsRes.data.data.find(i => i.name === 'page_post_engagements')?.values[0]?.value || 0;
          reach = impressions; // Using impressions as reach proxy for FB page level in MVP
        }

        // Facebook Page Fans
        const pageRes = await client.request<MetaPageFansResponse>(
          externalId,
          accessToken,
          { fields: 'fan_count' }
        );
        followers = pageRes.data?.fan_count || 0;

      } else if (platform === 'instagram') {
        // Instagram Business Insights
        const insightsRes = await client.request<MetaInsightsResponse>(
          `${externalId}/insights`,
          accessToken,
          { metric: 'impressions,reach,engagement', period: 'day' }
        );

        if (insightsRes.data) {
          impressions = insightsRes.data.data.find(i => i.name === 'impressions')?.values[0]?.value || 0;
          reach = insightsRes.data.data.find(i => i.name === 'reach')?.values[0]?.value || 0;
          engagement = insightsRes.data.data.find(i => i.name === 'engagement')?.values[0]?.value || 0;
        }

        // Instagram Followers
        const igRes = await client.request<MetaIGFollowersResponse>(
          externalId,
          accessToken,
          { fields: 'followers_count' }
        );
        followers = igRes.data?.followers_count || 0;
      }

      // 3. Upsert snapshot for TODAY (UTC midnight)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const { error: upsertError } = await upsertAnalyticsSnapshot({
        accountId,
        date: today,
        reach,
        impressions,
        engagement,
        followers,
      });

      if (upsertError) {
        console.error(`[MetaAnalyticsService] Upsert failed for ${accountId}:`, upsertError);
        return { success: false, error: upsertError };
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[MetaAnalyticsService] Sync critical failure for ${accountId}:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  }
};
