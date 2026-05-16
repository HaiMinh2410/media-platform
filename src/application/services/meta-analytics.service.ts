import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { upsertAnalyticsSnapshot, upsertPostAnalytics } from '@/infrastructure/repositories/analytics.repository';
import type { 
  MetaInsightsResponse, 
  MetaPageFansResponse, 
  MetaIGFollowersResponse,
  MetaMediaResponse,
  MetaMediaInsightsResponse
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
        // page_impressions_unique is the standard "Reach" metric for FB Pages
        const insightsRes = await client.request<MetaInsightsResponse>(
          `${externalId}/insights`,
          accessToken,
          { metric: 'page_impressions_unique,page_post_engagements,page_impressions', period: 'day' }
        );

        if (insightsRes.data && Array.isArray(insightsRes.data.data)) {
          reach = insightsRes.data.data.find(i => i.name === 'page_impressions_unique')?.values[0]?.value || 0;
          impressions = insightsRes.data.data.find(i => i.name === 'page_impressions')?.values[0]?.value || 0;
          engagement = insightsRes.data.data.find(i => i.name === 'page_post_engagements')?.values[0]?.value || 0;
          
          // Fallback if reach is 0 but impressions exist
          if (reach === 0 && impressions > 0) reach = Math.floor(impressions * 0.8);
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

        if (insightsRes.data && Array.isArray(insightsRes.data.data)) {
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

      // 4. Sync Posts (Currently prioritizing Instagram based on spec)
      if (platform === 'instagram') {
        const mediaRes = await client.request<MetaMediaResponse>(
          `${externalId}/media`,
          accessToken,
          { fields: 'id,media_type,caption,media_url,thumbnail_url,children{media_url,media_type},like_count,comments_count,timestamp', limit: 50 }
        );

        if (mediaRes.data && Array.isArray(mediaRes.data.data)) {
          for (const post of mediaRes.data.data) {
            let postReach = 0;
            let postImpressions = 0;
            let postSaved = 0;
            let postShares = 0;

            try {
              const postInsights = await client.request<MetaMediaInsightsResponse>(
                `${post.id}/insights`,
                accessToken,
                { metric: 'reach,impressions,saved,shares' }
              );

              if (postInsights.data && Array.isArray(postInsights.data.data)) {
                postReach = postInsights.data.data.find(i => i.name === 'reach')?.values[0]?.value || 0;
                postImpressions = postInsights.data.data.find(i => i.name === 'impressions')?.values[0]?.value || 0;
                postSaved = postInsights.data.data.find(i => i.name === 'saved')?.values[0]?.value || 0;
                postShares = postInsights.data.data.find(i => i.name === 'shares')?.values[0]?.value || 0;
              }
            } catch (err) {
              // Might fail due to missing scope or unsupported media type (e.g. IGTV/Stories might differ)
              console.warn(`[MetaAnalyticsService] Could not fetch insights for post ${post.id}`, err);
            }

            // Determine best thumbnail URL
            let thumbnailUrl = post.thumbnail_url || post.media_url || null;

            // For Carousels, media_url might be omitted at top level, so we check children
            if (!thumbnailUrl && post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[0]) {
              thumbnailUrl = post.children.data[0].media_url;
            }

            await upsertPostAnalytics(accountId, {
              postId: post.id,
              mediaType: post.media_type,
              caption: post.caption || null,
              thumbnailUrl: thumbnailUrl,
              likeCount: post.like_count || 0,
              commentsCount: post.comments_count || 0,
              sharesCount: postShares,
              savedCount: postSaved,
              reach: postReach,
              impressions: postImpressions,
              postedAt: new Date(post.timestamp)
            });
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[MetaAnalyticsService] Sync critical failure for ${accountId}:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  }
};
