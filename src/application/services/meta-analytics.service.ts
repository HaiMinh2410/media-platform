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
 * Helper to parse a double breakdown (e.g. media_product_type, follow_type) from Meta insights.
 * Handles both the nested breakdowns structure and direct flat values.
 */
function parseDoubleBreakdown(insightsData: any[], metricName: string) {
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return null;
  }
  
  const valueObj = (metricItem.values && metricItem.values[0]) || metricItem.total_value || metricItem;
  if (!valueObj) {
    return null;
  }
  
  const counts = {
    all: { posts: 0, reels: 0, stories: 0 },
    followers: { posts: 0, reels: 0, stories: 0 },
    nonfollowers: { posts: 0, reels: 0, stories: 0 }
  };
  
  // 1. Array-based nested breakdowns structure (standard modern format)
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const mediaIdx = keys.indexOf('media_product_type');
      const followIdx = keys.indexOf('follow_type');
      
      if (mediaIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const rawMedia = vals[mediaIdx] || '';
          
          let category: 'posts' | 'reels' | 'stories' | null = null;
          if (rawMedia === 'POST' || rawMedia === 'FEED' || rawMedia === 'AD' || rawMedia === 'CAROUSEL_CONTAINER' || rawMedia === 'CAROUSEL_ALBUM') {
            category = 'posts';
          } else if (rawMedia === 'REELS' || rawMedia === 'REEL' || rawMedia === 'VIDEO') {
            category = 'reels';
          } else if (rawMedia === 'STORY' || rawMedia === 'STORIES') {
            category = 'stories';
          }
          
          if (!category) continue;
          
          const val = res.value || 0;
          
          if (followIdx !== -1) {
            const rawFollow = vals[followIdx] || '';
            if (rawFollow === 'FOLLOWER') {
              counts.followers[category] += val;
            } else if (rawFollow === 'NON_FOLLOWER') {
              counts.nonfollowers[category] += val;
            }
          }
          
          counts.all[category] += val;
        }
      }
    }
    return counts;
  }
  
  // 2. Simple object structure where key is the media type (fallback for single breakdowns)
  const val = valueObj.value;
  if (val && typeof val === 'object') {
    for (const [rawKey, innerVal] of Object.entries(val)) {
      let category: 'posts' | 'reels' | 'stories' | null = null;
      if (rawKey === 'POST' || rawKey === 'FEED' || rawKey === 'AD' || rawKey === 'CAROUSEL_CONTAINER' || rawKey === 'CAROUSEL_ALBUM') {
        category = 'posts';
      } else if (rawKey === 'REELS' || rawKey === 'REEL' || rawKey === 'VIDEO') {
        category = 'reels';
      } else if (rawKey === 'STORY' || rawKey === 'STORIES') {
        category = 'stories';
      }
      
      if (!category) continue;
      
      if (typeof innerVal === 'number') {
        counts.all[category] += innerVal;
      } else if (innerVal && typeof innerVal === 'object') {
        const followerVal = (innerVal as any).FOLLOWER || (innerVal as any).follower || 0;
        const nonFollowerVal = (innerVal as any).NON_FOLLOWER || (innerVal as any)['non-follower'] || (innerVal as any).non_follower || 0;
        
        counts.followers[category] += followerVal;
        counts.nonfollowers[category] += nonFollowerVal;
        counts.all[category] += followerVal + nonFollowerVal;
      }
    }
    return counts;
  }
  
  return null;
}

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
            metric: 'reach,views,profile_views,profile_links_taps', 
            period: 'day',
            metric_type: 'total_value'
          }, 'GET', accountId),
          // 2. Reach by content type and follow type (double breakdown)
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'reach', 
            breakdown: 'media_product_type,follow_type', 
            period: 'day',
            metric_type: 'total_value'
          }, 'GET', accountId),
          // 3. Views by media product type (fallback)
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'views', 
            breakdown: 'media_product_type', 
            period: 'day',
            metric_type: 'total_value'
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
              const reachObj = d.data.find((i: any) => i.name === 'reach');
              const viewsObj = d.data.find((i: any) => i.name === 'views');
              const profileViewsObj = d.data.find((i: any) => i.name === 'profile_views');
              const profileLinksTapsObj = d.data.find((i: any) => i.name === 'profile_links_taps');

              reach = reachObj?.total_value?.value || reachObj?.values?.[0]?.value || 0;
              impressions = viewsObj?.total_value?.value || viewsObj?.values?.[0]?.value || 0;
              profileVisits = profileViewsObj?.total_value?.value || profileViewsObj?.values?.[0]?.value || 0;
              profileLinksTaps = profileLinksTapsObj?.total_value?.value || profileLinksTapsObj?.values?.[0]?.value || 0;
              accountsReached = reach;
            } else if (idx === 1) { // Reach double breakdown
              const d = data as MetaInsightsResponse;
              const parsedBreakdown = parseDoubleBreakdown(d.data, 'reach');
              if (parsedBreakdown) {
                const totalFollowers = parsedBreakdown.followers.posts + parsedBreakdown.followers.reels + parsedBreakdown.followers.stories;
                const totalNonFollowers = parsedBreakdown.nonfollowers.posts + parsedBreakdown.nonfollowers.reels + parsedBreakdown.nonfollowers.stories;
                const totalReach = totalFollowers + totalNonFollowers;
                
                if (totalReach > 0) {
                  followersPct = Math.round((totalFollowers / totalReach) * 100);
                  nonfollowersPct = Math.round((totalNonFollowers / totalReach) * 100);
                }
                
                const getPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;
                
                const allTotal = parsedBreakdown.all.posts + parsedBreakdown.all.reels + parsedBreakdown.all.stories;
                
                byContentViews = {
                  all: {
                    posts: getPct(parsedBreakdown.all.posts, allTotal),
                    reels: getPct(parsedBreakdown.all.reels, allTotal),
                    stories: getPct(parsedBreakdown.all.stories, allTotal)
                  },
                  followers: {
                    posts: getPct(parsedBreakdown.followers.posts, totalFollowers),
                    reels: getPct(parsedBreakdown.followers.reels, totalFollowers),
                    stories: getPct(parsedBreakdown.followers.stories, totalFollowers)
                  },
                  nonfollowers: {
                    posts: getPct(parsedBreakdown.nonfollowers.posts, totalNonFollowers),
                    reels: getPct(parsedBreakdown.nonfollowers.reels, totalNonFollowers),
                    stories: getPct(parsedBreakdown.nonfollowers.stories, totalNonFollowers)
                  }
                };
              }
            } else if (idx === 2) { // Views breakdown (fallback)
              if (!byContentViews) {
                const d = data as MetaInsightsResponse;
                const viewsObj = d.data.find((i: any) => i.name === 'views');
                
                const totalValue = viewsObj?.total_value;
                if (totalValue && Array.isArray(totalValue.breakdowns)) {
                  let posts = 0, reels = 0, stories = 0;
                  for (const b of totalValue.breakdowns) {
                    const keys = b.dimension_keys || [];
                    const mediaIdx = keys.indexOf('media_product_type');
                    if (mediaIdx !== -1 && Array.isArray(b.results)) {
                      for (const res of b.results) {
                        const vals = res.dimension_values || [];
                        const rawMedia = vals[mediaIdx] || '';
                        const val = res.value || 0;
                        
                        if (rawMedia === 'POST' || rawMedia === 'FEED' || rawMedia === 'AD' || rawMedia === 'CAROUSEL_CONTAINER' || rawMedia === 'CAROUSEL_ALBUM') {
                          posts += val;
                        } else if (rawMedia === 'REELS' || rawMedia === 'REEL' || rawMedia === 'VIDEO') {
                          reels += val;
                        } else if (rawMedia === 'STORY' || rawMedia === 'STORIES') {
                          stories += val;
                        }
                      }
                    }
                  }
                  
                  const total = posts + reels + stories;
                  const getPct = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;
                  
                  byContentViews = {
                    all: {
                      posts: getPct(posts),
                      reels: getPct(reels),
                      stories: getPct(stories)
                    },
                    followers: { posts: 0, reels: 0, stories: 0 },
                    nonfollowers: { posts: 0, reels: 0, stories: 0 }
                  };
                } else {
                  const viewsVal = viewsObj?.values?.[0]?.value;
                  if (viewsVal && typeof viewsVal === 'object') {
                    const posts = viewsVal.POST || viewsVal.FEED || viewsVal.CAROUSEL_CONTAINER || viewsVal.CAROUSEL_ALBUM || 0;
                    const reels = viewsVal.REELS || viewsVal.REEL || 0;
                    const stories = viewsVal.STORY || 0;
                    const total = posts + reels + stories;
                    
                    const getPct = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;
                    
                    byContentViews = {
                      all: {
                        posts: getPct(posts),
                        reels: getPct(reels),
                        stories: getPct(stories)
                      },
                      followers: { posts: 0, reels: 0, stories: 0 },
                      nonfollowers: { posts: 0, reels: 0, stories: 0 }
                    };
                  }
                }
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
            const batchPromises = batch.map(post => {
              const isVideoOrReel = post.media_type === 'VIDEO' || post.media_type === 'REELS';
              const metrics = isVideoOrReel 
                ? 'reach,impressions,saved,shares,profile_visits,views' 
                : 'reach,impressions,saved,shares,profile_visits';
                
              return client.request<MetaMediaInsightsResponse>(`${post.id}/insights`, accessToken, { 
                metric: metrics 
              }, 'GET', accountId).then(res => ({ post, res }));
            });
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
              const postViews = insights.find((i: any) => i.name === 'views')?.values[0]?.value || postImpressions;

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
                views: postViews,
                postedAt: new Date(post.timestamp)
              };

              processedPosts.push(postData);

              await upsertPostAnalytics(accountId, postData);
            }
          }
          profileVisits = totalProfileVisits;
          
          const totalIntSum = postInt + reelInt + storyInt;
          const getIntPct = (val: number) => totalIntSum > 0 ? Math.round((val / totalIntSum) * 100) : 0;
          byContentInteractions = {
            posts: getIntPct(postInt),
            reels: getIntPct(reelInt),
            stories: getIntPct(storyInt)
          };

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
