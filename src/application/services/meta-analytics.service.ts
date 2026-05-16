import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { upsertAnalyticsSnapshot, upsertPostAnalytics } from '@/infrastructure/repositories/analytics.repository';
import type { 
  MetaInsightsResponse, 
  MetaPageFansResponse, 
  MetaIGFollowersResponse,
  MetaMediaResponse,
  MetaMediaInsightsResponse,
  MetaApiResponse
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
      let profileVisits = 0;
      let profileLinksTaps = 0;
      let accountsReached = 0;
      let followersPct = 0;
      let nonfollowersPct = 0;
      let byContentViews: any = null;
      let byContentInteractions: any = null;
      let activeTimes: any = null;
      let insufficientData = false;

      // 2. Fetch platform-specific metrics
      if (platform === 'facebook' || platform === 'meta') {
        // Facebook Page Insights (Reach & Engagement)
        const insightsRes = await client.request<MetaInsightsResponse>(
          `${externalId}/insights`,
          accessToken,
          { metric: 'page_impressions_unique,page_post_engagements,page_impressions', period: 'day' },
          'GET',
          accountId
        );

        if (insightsRes.data && Array.isArray(insightsRes.data.data)) {
          reach = insightsRes.data.data.find((i: any) => i.name === 'page_impressions_unique')?.values[0]?.value || 0;
          impressions = insightsRes.data.data.find((i: any) => i.name === 'page_impressions')?.values[0]?.value || 0;
          engagement = insightsRes.data.data.find((i: any) => i.name === 'page_post_engagements')?.values[0]?.value || 0;
        }

        const pageRes = await client.request<MetaPageFansResponse>(
          externalId,
          accessToken,
          { fields: 'fan_count' },
          'GET',
          accountId
        );
        followers = pageRes.data?.fan_count || 0;

      } else if (platform === 'instagram') {
        // A. Get followers count first to check 100 followers limit
        const igRes = await client.request<MetaIGFollowersResponse>(
          externalId,
          accessToken,
          { fields: 'followers_count' },
          'GET',
          accountId
        );
        followers = igRes.data?.followers_count || 0;
        insufficientData = followers < 100;

        // B. Prepare parallel requests
        const promises = [
          // 1. Core daily insights
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'reach,impressions,profile_links_taps', 
            period: 'day' 
          }, 'GET', accountId),
          // 2. Reach by follower type
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'reach', 
            breakdown: 'follower_type', 
            period: 'day' 
          }, 'GET', accountId),
          // 3. Views by media product type
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'views', 
            breakdown: 'media_product_type', 
            period: 'day' 
          }, 'GET', accountId),
          // 4. Media list for aggregation (Top 50)
          client.request<MetaMediaResponse>(`${externalId}/media`, accessToken, { 
            fields: 'id,media_type,caption,media_url,thumbnail_url,children{media_url,media_type},like_count,comments_count,timestamp', 
            limit: 50 
          }, 'GET', accountId)
        ];

        // 5. Lifetime metrics (only if followers >= 100)
        if (!insufficientData) {
          promises.push(
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'online_followers,follower_demographics', 
              period: 'lifetime' 
            }, 'GET', accountId)
          );
        }

        const results = await Promise.allSettled(promises);

        // C. Process Results
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.data) {
            const data = result.value.data;
            
            if (idx === 0) { // Core insights
              const d = data as MetaInsightsResponse;
              reach = d.data.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
              impressions = d.data.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
              profileLinksTaps = d.data.find((i: any) => i.name === 'profile_links_taps')?.values[0]?.value || 0;
              accountsReached = reach;
            } else if (idx === 1) { // Reach breakdown
              const d = data as MetaInsightsResponse;
              const reachVal = d.data.find((i: any) => i.name === 'reach')?.values[0]?.value;
              if (reachVal && typeof reachVal === 'object') {
                const total = (reachVal.follower || 0) + (reachVal['non-follower'] || 0);
                if (total > 0) {
                  followersPct = (reachVal.follower || 0) / total;
                  nonfollowersPct = (reachVal['non-follower'] || 0) / total;
                }
              }
            } else if (idx === 2) { // Views breakdown
              const d = data as MetaInsightsResponse;
              const viewsVal = d.data.find((i: any) => i.name === 'views')?.values[0]?.value;
              if (viewsVal && typeof viewsVal === 'object') {
                byContentViews = {
                  all: {
                    posts: viewsVal.POST || 0,
                    reels: viewsVal.REELS || 0,
                    stories: viewsVal.STORY || 0
                  },
                  followers: { posts: 0, reels: 0, stories: 0 },
                  nonfollowers: { posts: 0, reels: 0, stories: 0 }
                };
              }
            } else if (idx === 3) { // Media & Aggregation
              // We will process this after the loop
            } else if (idx === 4 && !insufficientData) { // Lifetime metrics
              const d = data as MetaInsightsResponse;
              const onlineFollowers = d.data.find((i: any) => i.name === 'online_followers')?.values[0]?.value;
              if (onlineFollowers && typeof onlineFollowers === 'object') {
                activeTimes = onlineFollowers;
              }
            }
          }
        });

        // D. Aggregation Logic (Media level)
        const mediaResult = results[3];
        if (mediaResult.status === 'fulfilled' && mediaResult.value.data) {
          const mediaData = mediaResult.value.data as MetaMediaResponse;
          let totalProfileVisits = 0;
          let postInt = 0, reelInt = 0, storyInt = 0;

          // Fetch insights for each media in chunks to avoid rate limits
          const mediaInsights: PromiseSettledResult<{ post: any, res: MetaApiResponse<MetaMediaInsightsResponse> }>[] = [];
          const chunkSize = 10;
          for (let i = 0; i < mediaData.data.length; i += chunkSize) {
            const batch = mediaData.data.slice(i, i + chunkSize);
            const batchPromises = batch.map(post => 
              client.request<MetaMediaInsightsResponse>(`${post.id}/insights`, accessToken, { 
                metric: 'reach,impressions,saved,shares,profile_visits' 
              }, 'GET', accountId).then(res => ({ post, res }))
            );
            const batchResults = await Promise.allSettled(batchPromises);
            mediaInsights.push(...batchResults);
            
            if (i + chunkSize < mediaData.data.length) {
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms throttle
            }
          }
          
          const processedPosts = [];
          
          for (const m of mediaInsights) {
            if (m.status === 'fulfilled' && m.value.res.data) {
              const { post, res } = m.value;
              const insights = res.data!.data;
              
              const pVisits = insights.find((i: any) => i.name === 'profile_visits')?.values[0]?.value || 0;
              totalProfileVisits += pVisits;

              // Aggregate interactions for ContentBreakdown
              const pLikes = post.like_count || 0;
              const pComments = post.comments_count || 0;
              const pSaved = insights.find((i: any) => i.name === 'saved')?.values[0]?.value || 0;
              const pShares = insights.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;
              const totalInt = pLikes + pComments + pSaved + pShares;

              if (post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') postInt += totalInt;
              else if (post.media_type === 'VIDEO' || post.media_type === 'REELS') reelInt += totalInt;
              
              // Standard upsert post analytics
              let thumbnailUrl = post.thumbnail_url || post.media_url || null;
              if (!thumbnailUrl && post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[0]) {
                thumbnailUrl = post.children.data[0].media_url;
              }

              const postReach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
              const postImpressions = insights.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;

              const postData = {
                postId: post.id,
                mediaType: post.media_type,
                caption: post.caption || null,
                thumbnailUrl: thumbnailUrl,
                mediaUrl: post.media_url || null,
                likeCount: pLikes,
                commentsCount: pComments,
                sharesCount: pShares,
                savedCount: pSaved,
                totalInteractions: totalInt,
                reach: postReach,
                impressions: postImpressions,
                views: postImpressions, // Use impressions as proxy for views if not specific
                postedAt: new Date(post.timestamp)
              };

              processedPosts.push(postData);

              await upsertPostAnalytics(accountId, postData);
            }
          }
          profileVisits = totalProfileVisits;
          byContentInteractions = { posts: postInt, reels: reelInt, stories: storyInt };

          // Cache Top 5 by views and interactions (TTL 6h)
          if (redisConnection) {
            const topByViews = [...processedPosts].sort((a, b) => b.views - a.views).slice(0, 5);
            const topByInteractions = [...processedPosts].sort((a, b) => b.totalInteractions - a.totalInteractions).slice(0, 5);
            try {
              await redisConnection.set(`top_content:views:${accountId}`, JSON.stringify(topByViews), 'EX', 6 * 60 * 60);
              await redisConnection.set(`top_content:interactions:${accountId}`, JSON.stringify(topByInteractions), 'EX', 6 * 60 * 60);
            } catch (err) {
              console.warn('[MetaAnalyticsService] Failed to cache top content to Redis:', err);
            }
          }
        }
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
        profileVisits,
        profileLinksTaps,
        accountsReached,
        followersPct,
        nonfollowersPct,
        byContentViews,
        byContentInteractions,
        activeTimes,
        insufficientData
      });

      if (upsertError) {
        console.error(`[MetaAnalyticsService] Upsert failed for ${accountId}:`, upsertError);
        return { success: false, error: upsertError };
      }

      // 4. Cache breakdown data in Redis (12h TTL)
      if (redisConnection) {
        try {
          const dateStr = today.toISOString().split('T')[0];
          const cacheKey = `analytics:breakdown:${accountId}:${dateStr}`;
          const cacheData = {
            byContentViews,
            byContentInteractions,
            activeTimes
          };
          await redisConnection.set(cacheKey, JSON.stringify(cacheData), 'EX', 12 * 60 * 60);
        } catch (cacheErr) {
          console.warn(`[MetaAnalyticsService] Redis cache failed:`, cacheErr);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[MetaAnalyticsService] Sync critical failure for ${accountId}:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  }
};
