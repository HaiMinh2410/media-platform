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
 * Helper to parse a single dimension breakdown for follow_type from Meta insights.
 */
function parseFollowType(insightsData: any[], metricName: string) {
  if (!insightsData || !Array.isArray(insightsData)) {
    return { follower: 0, nonFollower: 0 };
  }
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return { follower: 0, nonFollower: 0 };
  }
  
  const valueObj = metricItem.total_value || (metricItem.values && metricItem.values[0]) || metricItem;
  if (!valueObj) {
    return { follower: 0, nonFollower: 0 };
  }
  
  let follower = 0;
  let nonFollower = 0;
  
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const followIdx = keys.indexOf('follow_type');
      
      if (followIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const val = res.value || 0;
          const rawFollow = (vals[followIdx] || '').toUpperCase().replace('-', '_');
          
          if (rawFollow === 'FOLLOWER') {
            follower += val;
          } else if (rawFollow === 'NON_FOLLOWER') {
            nonFollower += val;
          }
        }
      }
    }
  } else if (valueObj.value && typeof valueObj.value === 'object') {
    const val = valueObj.value;
    follower = val.FOLLOWER || val.follower || 0;
    nonFollower = val.NON_FOLLOWER || val['non-follower'] || val.non_follower || 0;
  }
  
  return { follower, nonFollower };
}

/**
 * Helper to parse a single dimension breakdown for media_product_type from Meta insights.
 */
function parseMediaProductType(insightsData: any[], metricName: string) {
  if (!insightsData || !Array.isArray(insightsData)) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  const metricItem = insightsData.find((i: any) => i.name === metricName);
  if (!metricItem) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  
  const valueObj = metricItem.total_value || (metricItem.values && metricItem.values[0]) || metricItem;
  if (!valueObj) {
    return { posts: 0, reels: 0, stories: 0 };
  }
  
  let posts = 0;
  let reels = 0;
  let stories = 0;
  
  if (Array.isArray(valueObj.breakdowns)) {
    for (const b of valueObj.breakdowns) {
      const keys = b.dimension_keys || [];
      const mediaIdx = keys.indexOf('media_product_type');
      
      if (mediaIdx !== -1 && Array.isArray(b.results)) {
        for (const res of b.results) {
          const vals = res.dimension_values || [];
          const val = res.value || 0;
          const rawMedia = (vals[mediaIdx] || '').toUpperCase().replace('-', '_');
          
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
  } else if (valueObj.value && typeof valueObj.value === 'object') {
    for (const [rawKey, val] of Object.entries(valueObj.value)) {
      if (typeof val !== 'number') continue;
      const normalizedKey = rawKey.toUpperCase().replace('-', '_');
      if (normalizedKey === 'POST' || normalizedKey === 'FEED' || normalizedKey === 'AD' || normalizedKey === 'CAROUSEL_CONTAINER' || normalizedKey === 'CAROUSEL_ALBUM') {
        posts += val;
      } else if (normalizedKey === 'REELS' || normalizedKey === 'REEL' || normalizedKey === 'VIDEO') {
        reels += val;
      } else if (normalizedKey === 'STORY' || normalizedKey === 'STORIES') {
        stories += val;
      }
    }
  }
  
  return { posts, reels, stories };
}


/**
 * Service for syncing analytics data from Meta Graph API.
 * Handles both Facebook Pages and Instagram Business Accounts.
 */
export const metaAnalyticsService = {
  /**
   * Fetches live analytics for a single Meta account for a given range (with chunking & paging).
   * Maps Meta metrics to our internal structures.
   */
  async fetchLiveAnalytics(params: {
    accountId: string;      // Internal DB ID
    externalId: string;     // FB Page ID or IG Business Account ID
    platform: string;       // 'facebook' or 'instagram'
    encryptedToken: string;
    since: Date;
    until: Date;
    currentStart?: Date;    // Precise start of the current period
  }): Promise<{
    success: boolean;
    snapshots?: any[];
    insufficientData?: boolean;
    activeTimes?: any;
    byContentInteractions?: any;
    posts?: any[];
    chunkUniqueReaches?: number[];
    chunkUniqueViews?: number[];
    chunkUniqueAccountsEngaged?: number[];
    chunkUniqueInteractions?: number[];
    error?: string;
  }> {
    const { accountId, externalId, platform, encryptedToken, since, until, currentStart } = params;

    try {
      // 1. Decrypt access token
      const encryptionService = getTokenEncryptionService();
      const { data: accessToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

      if (decryptError || !accessToken) {
        return { success: false, error: `TOKEN_DECRYPT_FAILED: ${decryptError}` };
      }

      const client = getMetaGraphClient();

      let followers = 0;
      let insufficientData = false;
      let byContentInteractions: any = null;
      let activeTimes: any = null;
      let processedPosts: any[] = [];

      // 2. Fetch platform-specific lifetime metrics first
      if (platform === 'facebook' || platform === 'meta') {
        const pageRes = await client.request<MetaPageFansResponse>(
          externalId,
          accessToken,
          { fields: 'fan_count' },
          'GET',
          accountId
        );
        followers = pageRes.data?.fan_count || 0;
      } else if (platform === 'instagram') {
        const igRes = await client.request<MetaIGFollowersResponse>(
          externalId,
          accessToken,
          { fields: 'followers_count' },
          'GET',
          accountId
        );
        followers = igRes.data?.followers_count || 0;
        insufficientData = followers < 100;

        // Fetch media list & aggregate interactions
        try {
          const mediaRes = await client.request<MetaMediaResponse>(`${externalId}/media`, accessToken, { 
            fields: 'id,media_type,caption,media_url,thumbnail_url,children{media_url,media_type},like_count,comments_count,timestamp', 
            limit: 50 
          }, 'GET', accountId);

          if (mediaRes.data && Array.isArray(mediaRes.data.data)) {
            let postInt = 0, reelInt = 0, storyInt = 0;

            // Fetch insights for each media in chunks to avoid rate limits
            const mediaInsights: PromiseSettledResult<{ post: any, res: MetaApiResponse<MetaMediaInsightsResponse> }>[] = [];
            const chunkSize = 10;
            for (let i = 0; i < mediaRes.data.data.length; i += chunkSize) {
              const batch = mediaRes.data.data.slice(i, i + chunkSize);
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
              
              if (i + chunkSize < mediaRes.data.data.length) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms throttle
              }
            }

            for (const m of mediaInsights) {
              if (m.status === 'fulfilled' && m.value.res.data) {
                const { post, res } = m.value;
                const insights = res.data!.data;
                
                const pLikes = post.like_count || 0;
                const pComments = post.comments_count || 0;
                const pSaved = insights.find((i: any) => i.name === 'saved')?.values[0]?.value || 0;
                const pShares = insights.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;
                const totalInt = pLikes + pComments + pSaved + pShares;

                if (post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') postInt += totalInt;
                else if (post.media_type === 'VIDEO' || post.media_type === 'REELS') reelInt += totalInt;
                
                let thumbnailUrl = post.thumbnail_url || post.media_url || null;
                if (!thumbnailUrl && post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[0]) {
                  thumbnailUrl = post.children.data[0].media_url;
                }

                const postReach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
                const postImpressions = insights.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
                const postViews = insights.find((i: any) => i.name === 'views')?.values[0]?.value || postImpressions;

                processedPosts.push({
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
                });
              }
            }

            const totalIntSum = postInt + reelInt + storyInt;
            const getIntPct = (val: number) => totalIntSum > 0 ? Number((val / totalIntSum * 100).toFixed(4)) : 0;
            byContentInteractions = {
              posts: getIntPct(postInt),
              reels: getIntPct(reelInt),
              stories: getIntPct(storyInt)
            };
          }
        } catch (mediaErr) {
          console.error('[MetaAnalyticsService] Media aggregation failed:', mediaErr);
        }
      }

      // 3. Chunking logic
      const chunks: { since: Date; until: Date }[] = [];
      
      const buildPeriodChunks = (start: Date, end: Date) => {
        let pStart = new Date(start);
        pStart.setUTCHours(0, 0, 0, 0);
        const pEnd = new Date(end);
        pEnd.setUTCHours(23, 59, 59, 999);
        
        while (pStart < pEnd) {
          let chunkEnd = new Date(pStart);
          chunkEnd.setUTCDate(chunkEnd.getUTCDate() + 30); // Exactly 30 days
          if (chunkEnd > pEnd) {
            chunkEnd = new Date(pEnd);
          }
          chunks.push({ since: new Date(pStart), until: new Date(chunkEnd) });
          pStart = new Date(chunkEnd);
        }
      };

      if (currentStart) {
        // Build chunks for previous period and current period separately to get precise unique values for short periods
        buildPeriodChunks(since, currentStart);
        buildPeriodChunks(currentStart, until);
      } else {
        buildPeriodChunks(since, until);
      }

      const allSnapshots: any[] = [];
      const chunkUniqueReaches: number[] = [];
      const chunkUniqueViews: number[] = [];
      const chunkUniqueAccountsEngaged: number[] = [];
      const chunkUniqueInteractions: number[] = [];

      // 4. Fetch metrics for each chunk
      for (const chunk of chunks) {
        const sinceUnix = Math.floor(chunk.since.getTime() / 1000);
        const untilUnix = Math.floor(chunk.until.getTime() / 1000);

        const dailyMetrics: Record<string, any> = {};

        if (platform === 'facebook' || platform === 'meta') {
          const insightsRes = await client.request<MetaInsightsResponse>(
            `${externalId}/insights`,
            accessToken,
            { 
              metric: 'page_impressions_unique,page_post_engagements,page_impressions', 
              period: 'day',
              since: sinceUnix,
              until: untilUnix
            },
            'GET',
            accountId
          );

          if (insightsRes.data && Array.isArray(insightsRes.data.data)) {
            for (const item of insightsRes.data.data) {
              const metricName = item.name;
              if (item.values && Array.isArray(item.values)) {
                for (const val of item.values) {
                  const date = new Date(val.end_time);
                  date.setUTCDate(date.getUTCDate() - 1);
                  date.setUTCHours(0, 0, 0, 0);
                  const dateKey = date.toISOString().split('T')[0];

                  if (!dailyMetrics[dateKey]) {
                    dailyMetrics[dateKey] = {
                      date,
                      reach: 0,
                      impressions: 0,
                      engagement: 0,
                      followers,
                      profileVisits: 0,
                      profileLinksTaps: 0,
                      accountsReached: 0,
                      accountsEngaged: 0,
                      followersPct: 0,
                      nonfollowersPct: 0,
                      byContentViews: null,
                      byContentInteractions: null,
                      activeTimes: null,
                      insufficientData: false
                    };
                  }

                  const value = val.value || 0;
                  if (metricName === 'page_impressions_unique') {
                    dailyMetrics[dateKey].reach = value;
                    dailyMetrics[dateKey].accountsReached = value;
                  } else if (metricName === 'page_impressions') {
                    dailyMetrics[dateKey].impressions = value;
                  } else if (metricName === 'page_post_engagements') {
                    dailyMetrics[dateKey].engagement = value;
                  }
                }
              }
            }
          }
          chunkUniqueReaches.push(0);
        } else if (platform === 'instagram') {
          let chunkFollowersPct = 0;
          let chunkNonfollowersPct = 0;
          let chunkByContentViews: any = null;

          // Tạo các daily chunks
          const dailyChunks: { dateStr: string; sinceUnix: number; untilUnix: number }[] = [];
          const chunkStart = new Date(chunk.since);
          const chunkEnd = new Date(chunk.until);
          
          let currentDay = new Date(chunkStart);
          currentDay.setUTCHours(0, 0, 0, 0);
          
          while (currentDay < chunkEnd) {
            const dayStart = new Date(currentDay);
            const sinceUnixVal = Math.floor(dayStart.getTime() / 1000);
            
            const dayEnd = new Date(currentDay);
            dayEnd.setUTCHours(23, 59, 59, 999);
            const untilUnixVal = Math.floor(dayEnd.getTime() / 1000);
            
            dailyChunks.push({
              dateStr: dayStart.toISOString().split('T')[0],
              sinceUnix: sinceUnixVal,
              untilUnix: untilUnixVal
            });
            
            currentDay.setUTCDate(currentDay.getUTCDate() + 1);
          }

          // Promises
          const dailyCorePromises = dailyChunks.map(dChunk =>
            client.request<MetaInsightsResponse>(
              `${externalId}/insights`,
              accessToken,
              {
                metric: 'reach,views,profile_views,profile_links_taps,accounts_engaged,total_interactions',
                period: 'day',
                metric_type: 'total_value',
                since: dChunk.sinceUnix,
                until: dChunk.untilUnix
              },
              'GET',
              accountId
            ).then(res => ({
              dateStr: dChunk.dateStr,
              res
            }))
          );

          const otherPromises = [
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach', 
              breakdown: 'follow_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach', 
              breakdown: 'media_product_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'views', 
              breakdown: 'media_product_type,follow_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [3] True non-breakdown unique reach and views for the entire chunk range
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach,views', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [4] True non-breakdown unique accounts engaged and total interactions for the entire chunk range
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'accounts_engaged,total_interactions', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [5] Total interactions breakdown by Content Type
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'total_interactions', 
              breakdown: 'media_product_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId)
          ];

          if (!insufficientData) {
            otherPromises.push(
              client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
                metric: 'online_followers,follower_demographics', 
                period: 'lifetime' 
              }, 'GET', accountId)
            );
          }

          const [dailyCoreResults, otherResults] = await Promise.all([
            Promise.allSettled(dailyCorePromises),
            Promise.allSettled(otherPromises)
          ]);

          // Parse daily core
          for (const itemResult of dailyCoreResults) {
            if (itemResult.status === 'fulfilled') {
              const { dateStr, res } = itemResult.value;
              if (res.data && Array.isArray(res.data.data)) {
                const date = new Date(dateStr);
                date.setUTCHours(0, 0, 0, 0);

                if (!dailyMetrics[dateStr]) {
                  dailyMetrics[dateStr] = {
                    date,
                    reach: 0,
                    impressions: 0,
                    engagement: 0,
                    followers,
                    profileVisits: 0,
                    profileLinksTaps: 0,
                    accountsReached: 0,
                    accountsEngaged: 0,
                    followersPct: 0,
                    nonfollowersPct: 0,
                    byContentViews: null,
                    byContentInteractions: null,
                    activeTimes: null,
                    insufficientData
                  };
                }

                for (const item of res.data.data) {
                  const metricName = item.name;
                  const value = item.total_value?.value || 0;

                  if (metricName === 'reach') {
                    dailyMetrics[dateStr].reach = value;
                    dailyMetrics[dateStr].accountsReached = value;
                  } else if (metricName === 'views') {
                    dailyMetrics[dateStr].impressions = value;
                  } else if (metricName === 'profile_views') {
                    dailyMetrics[dateStr].profileVisits = value;
                  } else if (metricName === 'profile_links_taps') {
                    dailyMetrics[dateStr].profileLinksTaps = value;
                  } else if (metricName === 'accounts_engaged') {
                    dailyMetrics[dateStr].accountsEngaged = value;
                  } else if (metricName === 'total_interactions') {
                    dailyMetrics[dateStr].engagement = value;
                  }
                }
              }
            }
          }

          // Process follow type breakdown
          const followTypeRes = otherResults[0];
          if (followTypeRes && followTypeRes.status === 'fulfilled' && followTypeRes.value.data) {
            const d = followTypeRes.value.data as MetaInsightsResponse;
            const parsedFollow = parseFollowType(d.data, 'reach');
            const totalFollowReach = parsedFollow.follower + parsedFollow.nonFollower;
            if (totalFollowReach > 0) {
              chunkFollowersPct = Math.round((parsedFollow.follower / totalFollowReach) * 100);
              chunkNonfollowersPct = 100 - chunkFollowersPct;
            }
          }

          // Process Views media product type & follower type double breakdown
          const viewsBreakdownRes = otherResults[2];
          if (viewsBreakdownRes && viewsBreakdownRes.status === 'fulfilled' && viewsBreakdownRes.value.data) {
            const d = viewsBreakdownRes.value.data as MetaInsightsResponse;
            const doubleBreakdown = parseDoubleBreakdown(d.data, 'views');
            
            if (doubleBreakdown) {
              const totalAll = doubleBreakdown.all.posts + doubleBreakdown.all.reels + doubleBreakdown.all.stories;
              const totalFollowers = doubleBreakdown.followers.posts + doubleBreakdown.followers.reels + doubleBreakdown.followers.stories;
              const totalNonfollowers = doubleBreakdown.nonfollowers.posts + doubleBreakdown.nonfollowers.reels + doubleBreakdown.nonfollowers.stories;
              
              if (totalAll > 0 || totalFollowers > 0 || totalNonfollowers > 0) {
                const getPct = (val: number, total: number) => total > 0 ? Number((val / total * 100).toFixed(4)) : 0;
                
                chunkByContentViews = {
                  all: {
                    posts: getPct(doubleBreakdown.all.posts, totalAll),
                    reels: getPct(doubleBreakdown.all.reels, totalAll),
                    stories: getPct(doubleBreakdown.all.stories, totalAll)
                  },
                  followers: {
                    posts: getPct(doubleBreakdown.followers.posts, totalFollowers),
                    reels: getPct(doubleBreakdown.followers.reels, totalFollowers),
                    stories: getPct(doubleBreakdown.followers.stories, totalFollowers)
                  },
                  nonfollowers: {
                    posts: getPct(doubleBreakdown.nonfollowers.posts, totalNonfollowers),
                    reels: getPct(doubleBreakdown.nonfollowers.reels, totalNonfollowers),
                    stories: getPct(doubleBreakdown.nonfollowers.stories, totalNonfollowers)
                  }
                };
              }
            } else {
              // Fallback to single breakdown
              const viewsBreakdown = parseMediaProductType(d.data, 'views');
              const totalViews = viewsBreakdown.posts + viewsBreakdown.reels + viewsBreakdown.stories;
              
              if (totalViews > 0) {
                const getPct = (val: number, total: number) => total > 0 ? Number((val / total * 100).toFixed(4)) : 0;
                
                chunkByContentViews = {
                  all: {
                    posts: getPct(viewsBreakdown.posts, totalViews),
                    reels: getPct(viewsBreakdown.reels, totalViews),
                    stories: getPct(viewsBreakdown.stories, totalViews)
                  },
                  followers: {
                    posts: getPct(viewsBreakdown.posts, totalViews),
                    reels: getPct(viewsBreakdown.reels, totalViews),
                    stories: getPct(viewsBreakdown.stories, totalViews)
                  },
                  nonfollowers: {
                    posts: getPct(viewsBreakdown.posts, totalViews),
                    reels: getPct(viewsBreakdown.reels, totalViews),
                    stories: getPct(viewsBreakdown.stories, totalViews)
                  }
                };
              }
            }
          }

          // Process true unique reach and views directly from the API (otherResults[3])
          let uniqueReachVal = 0;
          let uniqueViewsVal = 0;
          
          // First try to get reach from follow_type breakdown (otherResults[0])
          if (followTypeRes && followTypeRes.status === 'fulfilled' && followTypeRes.value.data) {
            const d = followTypeRes.value.data as MetaInsightsResponse;
            const reachItem = d.data?.find((i: any) => i.name === 'reach');
            uniqueReachVal = reachItem?.total_value?.value || 0;
          }

          // Fallback reach / get views from otherResults[3] non-breakdown metrics
          const trueReachRes = otherResults[3];
          if (trueReachRes && trueReachRes.status === 'fulfilled' && trueReachRes.value.data) {
            const d = trueReachRes.value.data as MetaInsightsResponse;
            if (uniqueReachVal === 0) {
              const reachItem = d.data?.find((i: any) => i.name === 'reach');
              uniqueReachVal = reachItem?.total_value?.value || 0;
            }
            const viewsItem = d.data?.find((i: any) => i.name === 'views');
            uniqueViewsVal = viewsItem?.total_value?.value || 0;
          }

          chunkUniqueReaches.push(uniqueReachVal);
          chunkUniqueViews.push(uniqueViewsVal);

          // Process unique accounts engaged and unique total interactions (otherResults[4])
          let uniqueAccountsEngagedVal = 0;
          let uniqueInteractionsVal = 0;
          const engRes = otherResults[4];
          if (engRes && engRes.status === 'fulfilled' && engRes.value.data) {
            const d = engRes.value.data as MetaInsightsResponse;
            const engItem = d.data?.find((i: any) => i.name === 'accounts_engaged');
            uniqueAccountsEngagedVal = engItem?.total_value?.value || 0;
            const intItem = d.data?.find((i: any) => i.name === 'total_interactions');
            uniqueInteractionsVal = intItem?.total_value?.value || 0;
          }
          chunkUniqueAccountsEngaged.push(uniqueAccountsEngagedVal);
          chunkUniqueInteractions.push(uniqueInteractionsVal);

          // Process total interactions media product type breakdown (otherResults[5])
          let chunkByContentInteractions: any = null;
          const interactionsBreakdownRes = otherResults[5];
          if (interactionsBreakdownRes && interactionsBreakdownRes.status === 'fulfilled' && interactionsBreakdownRes.value.data) {
            const d = interactionsBreakdownRes.value.data as MetaInsightsResponse;
            const parsedInt = parseMediaProductType(d.data, 'total_interactions');
            const totalIntVal = parsedInt.posts + parsedInt.reels + parsedInt.stories;
            
            if (totalIntVal > 0) {
              const getPct = (val: number, total: number) => total > 0 ? Number((val / total * 100).toFixed(4)) : 0;
              chunkByContentInteractions = {
                posts: getPct(parsedInt.posts, totalIntVal),
                reels: getPct(parsedInt.reels, totalIntVal),
                stories: getPct(parsedInt.stories, totalIntVal)
              };
            }
          }

          // Process online followers (otherResults[6])
          const onlineFollowersIdx = 6;
          if (!insufficientData && otherResults[onlineFollowersIdx] && otherResults[onlineFollowersIdx].status === 'fulfilled' && otherResults[onlineFollowersIdx].value.data) {
            const d = otherResults[onlineFollowersIdx].value.data as MetaInsightsResponse;
            const onlineFollowers = d.data.find((i: any) => i.name === 'online_followers')?.values[0]?.value;
            if (onlineFollowers && typeof onlineFollowers === 'object') {
              activeTimes = onlineFollowers;
            }
          }

          // Apply chunk breakdowns to daily metrics
          for (const key of Object.keys(dailyMetrics)) {
            dailyMetrics[key].followersPct = chunkFollowersPct;
            dailyMetrics[key].nonfollowersPct = chunkNonfollowersPct;
            dailyMetrics[key].byContentViews = chunkByContentViews;
            dailyMetrics[key].byContentInteractions = chunkByContentInteractions || byContentInteractions;
            dailyMetrics[key].activeTimes = activeTimes;
          }
        }

        // Add to global snapshots
        for (const metric of Object.values(dailyMetrics)) {
          allSnapshots.push({
            accountId,
            date: metric.date,
            reach: metric.reach,
            impressions: metric.impressions,
            engagement: metric.engagement,
            followers: metric.followers,
            profileVisits: metric.profileVisits,
            profileLinksTaps: metric.profileLinksTaps,
            accountsReached: metric.accountsReached,
            accountsEngaged: metric.accountsEngaged,
            followersPct: metric.followersPct,
            nonfollowersPct: metric.nonfollowersPct,
            byContentViews: metric.byContentViews,
            byContentInteractions: metric.byContentInteractions,
            activeTimes: metric.activeTimes,
            insufficientData: metric.insufficientData
          });
        }
      }

      // 5. Update reauth status to false since live fetch completed successfully
      try {
        const { getPlatformAccountRepository } = await import('@/infrastructure/repositories/platform-account.repository');
        await getPlatformAccountRepository().updateReauthStatus(accountId, false);
      } catch (reauthErr) {
        console.warn(`[MetaAnalyticsService] Failed to update reauth status:`, reauthErr);
      }

      return {
        success: true,
        snapshots: allSnapshots.sort((a, b) => a.date.getTime() - b.date.getTime()),
        insufficientData,
        activeTimes,
        byContentInteractions,
        posts: processedPosts,
        chunkUniqueReaches,
        chunkUniqueViews,
        chunkUniqueAccountsEngaged,
        chunkUniqueInteractions
      };

    } catch (err: any) {
      console.error(`[MetaAnalyticsService] fetchLiveAnalytics critical failure:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  },

  /**
   * Syncs daily analytics for a single Meta account.
   * Maps Meta metrics to our internal AnalyticsSnapshot model.
   */
  async syncAccount(params: {
    accountId: string;      // Internal DB ID
    externalId: string;     // FB Page ID or IG Business Account ID
    platform: string;       // 'facebook' or 'instagram'
    encryptedToken: string;
    since?: Date;
    until?: Date;
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

      let followers = 0;
      let insufficientData = false;
      let byContentInteractions: any = null;
      let activeTimes: any = null;

      // 2. Fetch platform-specific lifetime metrics first
      if (platform === 'facebook' || platform === 'meta') {
        const pageRes = await client.request<MetaPageFansResponse>(
          externalId,
          accessToken,
          { fields: 'fan_count' },
          'GET',
          accountId
        );
        followers = pageRes.data?.fan_count || 0;
      } else if (platform === 'instagram') {
        const igRes = await client.request<MetaIGFollowersResponse>(
          externalId,
          accessToken,
          { fields: 'followers_count' },
          'GET',
          accountId
        );
        followers = igRes.data?.followers_count || 0;
        insufficientData = followers < 100;

        // Fetch media list & aggregate interactions (only once per sync session)
        try {
          const mediaRes = await client.request<MetaMediaResponse>(`${externalId}/media`, accessToken, { 
            fields: 'id,media_type,caption,media_url,thumbnail_url,children{media_url,media_type},like_count,comments_count,timestamp', 
            limit: 50 
          }, 'GET', accountId);

          if (mediaRes.data && Array.isArray(mediaRes.data.data)) {
            let totalProfileVisits = 0;
            let postInt = 0, reelInt = 0, storyInt = 0;
            const processedPosts = [];

            // Fetch insights for each media in chunks to avoid rate limits
            const mediaInsights: PromiseSettledResult<{ post: any, res: MetaApiResponse<MetaMediaInsightsResponse> }>[] = [];
            const chunkSize = 10;
            for (let i = 0; i < mediaRes.data.data.length; i += chunkSize) {
              const batch = mediaRes.data.data.slice(i, i + chunkSize);
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
              
              if (i + chunkSize < mediaRes.data.data.length) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms throttle
              }
            }

            for (const m of mediaInsights) {
              if (m.status === 'fulfilled' && m.value.res.data) {
                const { post, res } = m.value;
                const insights = res.data!.data;
                
                const pVisits = insights.find((i: any) => i.name === 'profile_visits')?.values[0]?.value || 0;
                totalProfileVisits += pVisits;

                const pLikes = post.like_count || 0;
                const pComments = post.comments_count || 0;
                const pSaved = insights.find((i: any) => i.name === 'saved')?.values[0]?.value || 0;
                const pShares = insights.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;
                const totalInt = pLikes + pComments + pSaved + pShares;

                if (post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') postInt += totalInt;
                else if (post.media_type === 'VIDEO' || post.media_type === 'REELS') reelInt += totalInt;
                
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
        } catch (mediaErr) {
          console.error('[MetaAnalyticsService] Media aggregation failed:', mediaErr);
        }
      }

      // 3. Chunking logic
      const chunks: { since: Date; until: Date }[] = [];
      if (params.since && params.until) {
        let currentStart = new Date(params.since);
        currentStart.setUTCHours(0, 0, 0, 0);
        const endLimit = new Date(params.until);
        endLimit.setUTCHours(23, 59, 59, 999);
        
        while (currentStart < endLimit) {
          let currentEnd = new Date(currentStart);
          currentEnd.setUTCDate(currentEnd.getUTCDate() + 29); // 30 days
          if (currentEnd > endLimit) {
            currentEnd = new Date(endLimit);
          }
          chunks.push({ since: new Date(currentStart), until: new Date(currentEnd) });
          currentStart = new Date(currentEnd);
          currentStart.setUTCDate(currentStart.getUTCDate() + 1);
        }
      } else {
        // Default: last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
        
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(23, 59, 59, 999);
        
        let currentStart = new Date(thirtyDaysAgo);
        while (currentStart < yesterday) {
          let currentEnd = new Date(currentStart);
          currentEnd.setUTCDate(currentEnd.getUTCDate() + 29); // 30 days limit
          if (currentEnd > yesterday) {
            currentEnd = new Date(yesterday);
          }
          chunks.push({ since: new Date(currentStart), until: new Date(currentEnd) });
          currentStart = new Date(currentEnd);
          currentStart.setUTCDate(currentStart.getUTCDate() + 1);
        }
      }

      // 4. Fetch metrics for each chunk
      for (const chunk of chunks) {
        const sinceUnix = Math.floor(chunk.since.getTime() / 1000);
        const untilUnix = Math.floor(chunk.until.getTime() / 1000);

        const dailyMetrics: Record<string, {
          date: Date;
          reach: number;
          impressions: number;
          engagement: number;
          accountsEngaged: number;
          profileVisits: number;
          profileLinksTaps: number;
          followersPct: number;
          nonfollowersPct: number;
          byContentViews: any;
          byContentInteractions?: any;
          activeTimes?: any;
        }> = {};

        if (platform === 'facebook' || platform === 'meta') {
          const insightsRes = await client.request<MetaInsightsResponse>(
            `${externalId}/insights`,
            accessToken,
            { 
              metric: 'page_impressions_unique,page_post_engagements,page_impressions', 
              period: 'day',
              since: sinceUnix,
              until: untilUnix
            },
            'GET',
            accountId
          );

          if (insightsRes.data && Array.isArray(insightsRes.data.data)) {
            for (const item of insightsRes.data.data) {
              const metricName = item.name;
              if (item.values && Array.isArray(item.values)) {
                for (const val of item.values) {
                  const date = new Date(val.end_time);
                  date.setUTCDate(date.getUTCDate() - 1);
                  date.setUTCHours(0, 0, 0, 0);
                  const dateKey = date.toISOString().split('T')[0];

                  if (!dailyMetrics[dateKey]) {
                    dailyMetrics[dateKey] = {
                      date,
                      reach: 0,
                      impressions: 0,
                      engagement: 0,
                      accountsEngaged: 0,
                      profileVisits: 0,
                      profileLinksTaps: 0,
                      followersPct: 0,
                      nonfollowersPct: 0,
                      byContentViews: null
                    };
                  }

                  const value = val.value || 0;
                  if (metricName === 'page_impressions_unique') {
                    dailyMetrics[dateKey].reach = value;
                  } else if (metricName === 'page_impressions') {
                    dailyMetrics[dateKey].impressions = value;
                  } else if (metricName === 'page_post_engagements') {
                    dailyMetrics[dateKey].engagement = value;
                  }
                }
              }
            }
          }
        } else if (platform === 'instagram') {
          let chunkFollowersPct = 0;
          let chunkNonfollowersPct = 0;
          let chunkByContentViews: any = null;

          // 1. Tạo các daily chunks (mỗi chunk là 1 ngày) nằm trong khoảng since -> until của chunk hiện tại
          const dailyChunks: { dateStr: string; sinceUnix: number; untilUnix: number }[] = [];
          const startLimit = new Date(chunk.since);
          const endLimit = new Date(chunk.until);
          
          let currentDay = new Date(startLimit);
          currentDay.setUTCHours(0, 0, 0, 0);
          
          while (currentDay <= endLimit) {
            const dayStart = new Date(currentDay);
            const sinceUnixVal = Math.floor(dayStart.getTime() / 1000);
            
            const dayEnd = new Date(currentDay);
            dayEnd.setUTCHours(23, 59, 59, 999);
            const untilUnixVal = Math.floor(dayEnd.getTime() / 1000);
            
            dailyChunks.push({
              dateStr: dayStart.toISOString().split('T')[0],
              sinceUnix: sinceUnixVal,
              untilUnix: untilUnixVal
            });
            
            currentDay.setUTCDate(currentDay.getUTCDate() + 1);
          }

          // 2. Định nghĩa các promises
          // 2a. Gọi core daily insights song song cho từng ngày
          const dailyCorePromises = dailyChunks.map(dChunk =>
            client.request<MetaInsightsResponse>(
              `${externalId}/insights`,
              accessToken,
              {
                metric: 'reach,views,profile_views,profile_links_taps,accounts_engaged,total_interactions',
                period: 'day',
                metric_type: 'total_value',
                since: dChunk.sinceUnix,
                until: dChunk.untilUnix
              },
              'GET',
              accountId
            ).then(res => ({
              dateStr: dChunk.dateStr,
              res
            }))
          );

          // 2b. Gọi các breakdown API và lifetime API dài hạn cho toàn bộ chu kỳ chunk
          const otherPromises = [
            // [0] Reach, accounts engaged & total interactions follow type breakdown
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach', 
              breakdown: 'follow_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [1] Reach media product type breakdown
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach', 
              breakdown: 'media_product_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [2] Views double breakdown (follower_type and media_product_type)
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'views', 
              breakdown: 'media_product_type,follow_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [3] True non-breakdown unique reach for the entire chunk range
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'reach', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId),
            // [4] Total interactions breakdown by Content Type
            client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
              metric: 'total_interactions', 
              breakdown: 'media_product_type', 
              period: 'day',
              metric_type: 'total_value',
              since: sinceUnix,
              until: untilUnix
            }, 'GET', accountId)
          ];

          if (!insufficientData) {
            otherPromises.push(
              client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
                metric: 'online_followers,follower_demographics', 
                period: 'lifetime' 
              }, 'GET', accountId)
            );
          }

          // 3. Thực thi song song tất cả các request
          const [dailyCoreResults, otherResults] = await Promise.all([
            Promise.allSettled(dailyCorePromises),
            Promise.allSettled(otherPromises)
          ]);

          // 4. Parse core daily insights từng ngày
          for (const itemResult of dailyCoreResults) {
            if (itemResult.status === 'fulfilled') {
              const { dateStr, res } = itemResult.value;
              if (res.data && Array.isArray(res.data.data)) {
                const date = new Date(dateStr);
                date.setUTCHours(0, 0, 0, 0);

                if (!dailyMetrics[dateStr]) {
                  dailyMetrics[dateStr] = {
                    date,
                    reach: 0,
                    impressions: 0,
                    engagement: 0,
                    accountsEngaged: 0,
                    profileVisits: 0,
                    profileLinksTaps: 0,
                    followersPct: 0,
                    nonfollowersPct: 0,
                    byContentViews: null
                  };
                }

                for (const item of res.data.data) {
                  const metricName = item.name;
                  const value = item.total_value?.value || 0;

                  if (metricName === 'reach') {
                    dailyMetrics[dateStr].reach = value;
                  } else if (metricName === 'views') {
                    dailyMetrics[dateStr].impressions = value;
                  } else if (metricName === 'profile_views') {
                    dailyMetrics[dateStr].profileVisits = value;
                  } else if (metricName === 'profile_links_taps') {
                    dailyMetrics[dateStr].profileLinksTaps = value;
                  } else if (metricName === 'accounts_engaged') {
                    dailyMetrics[dateStr].accountsEngaged = value;
                  } else if (metricName === 'total_interactions') {
                    dailyMetrics[dateStr].engagement = value;
                  }
                }
              }
            }
          }

          // 5. Process follow type breakdown (otherResults[0])
          const followTypeRes = otherResults[0];
          if (followTypeRes && followTypeRes.status === 'fulfilled' && followTypeRes.value.data) {
            const d = followTypeRes.value.data as MetaInsightsResponse;
            const parsedFollow = parseFollowType(d.data, 'reach');
            const totalFollowReach = parsedFollow.follower + parsedFollow.nonFollower;
            if (totalFollowReach > 0) {
              chunkFollowersPct = Math.round((parsedFollow.follower / totalFollowReach) * 100);
              chunkNonfollowersPct = 100 - chunkFollowersPct;
            }
          }

          // 6. Process Views media product type & follower type double breakdown (otherResults[2])
          const viewsBreakdownRes = otherResults[2];
          if (viewsBreakdownRes && viewsBreakdownRes.status === 'fulfilled' && viewsBreakdownRes.value.data) {
            const d = viewsBreakdownRes.value.data as MetaInsightsResponse;
            const doubleBreakdown = parseDoubleBreakdown(d.data, 'views');
            
            if (doubleBreakdown) {
              const totalAll = doubleBreakdown.all.posts + doubleBreakdown.all.reels + doubleBreakdown.all.stories;
              const totalFollowers = doubleBreakdown.followers.posts + doubleBreakdown.followers.reels + doubleBreakdown.followers.stories;
              const totalNonfollowers = doubleBreakdown.nonfollowers.posts + doubleBreakdown.nonfollowers.reels + doubleBreakdown.nonfollowers.stories;
              
              const getPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;
              
              chunkByContentViews = {
                all: {
                  posts: getPct(doubleBreakdown.all.posts, totalAll),
                  reels: getPct(doubleBreakdown.all.reels, totalAll),
                  stories: getPct(doubleBreakdown.all.stories, totalAll)
                },
                followers: {
                  posts: getPct(doubleBreakdown.followers.posts, totalFollowers),
                  reels: getPct(doubleBreakdown.followers.reels, totalFollowers),
                  stories: getPct(doubleBreakdown.followers.stories, totalFollowers)
                },
                nonfollowers: {
                  posts: getPct(doubleBreakdown.nonfollowers.posts, totalNonfollowers),
                  reels: getPct(doubleBreakdown.nonfollowers.reels, totalNonfollowers),
                  stories: getPct(doubleBreakdown.nonfollowers.stories, totalNonfollowers)
                }
              };
            } else {
              // Fallback to single breakdown
              const viewsBreakdown = parseMediaProductType(d.data, 'views');
              const totalViews = viewsBreakdown.posts + viewsBreakdown.reels + viewsBreakdown.stories;
              const getPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;
              
              chunkByContentViews = {
                all: {
                  posts: getPct(viewsBreakdown.posts, totalViews),
                  reels: getPct(viewsBreakdown.reels, totalViews),
                  stories: getPct(viewsBreakdown.stories, totalViews)
                },
                followers: {
                  posts: getPct(viewsBreakdown.posts, totalViews),
                  reels: getPct(viewsBreakdown.reels, totalViews),
                  stories: getPct(viewsBreakdown.stories, totalViews)
                },
                nonfollowers: {
                  posts: getPct(viewsBreakdown.posts, totalViews),
                  reels: getPct(viewsBreakdown.reels, totalViews),
                  stories: getPct(viewsBreakdown.stories, totalViews)
                }
              };
            }
          }

          // Process total interactions media product type breakdown (otherResults[4])
          let chunkByContentInteractions: any = null;
          const interactionsBreakdownRes = otherResults[4];
          if (interactionsBreakdownRes && interactionsBreakdownRes.status === 'fulfilled' && interactionsBreakdownRes.value.data) {
            const d = interactionsBreakdownRes.value.data as MetaInsightsResponse;
            const parsedInt = parseMediaProductType(d.data, 'total_interactions');
            const totalIntVal = parsedInt.posts + parsedInt.reels + parsedInt.stories;
            const getPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;
            
            chunkByContentInteractions = {
              posts: getPct(parsedInt.posts, totalIntVal),
              reels: getPct(parsedInt.reels, totalIntVal),
              stories: getPct(parsedInt.stories, totalIntVal)
            };
          }

          // 7. Process online followers (otherResults[5])
          const onlineFollowersIdx = 5;
          if (!insufficientData && otherResults[onlineFollowersIdx] && otherResults[onlineFollowersIdx].status === 'fulfilled' && otherResults[onlineFollowersIdx].value.data) {
            const d = otherResults[onlineFollowersIdx].value.data as MetaInsightsResponse;
            const onlineFollowers = d.data.find((i: any) => i.name === 'online_followers')?.values[0]?.value;
            if (onlineFollowers && typeof onlineFollowers === 'object') {
              activeTimes = onlineFollowers;
            }
          }

          // 8. Apply chunk-level breakdown to all days in the chunk
          for (const key of Object.keys(dailyMetrics)) {
            dailyMetrics[key].followersPct = chunkFollowersPct;
            dailyMetrics[key].nonfollowersPct = chunkNonfollowersPct;
            dailyMetrics[key].byContentViews = chunkByContentViews;
            dailyMetrics[key].byContentInteractions = chunkByContentInteractions || byContentInteractions;
            dailyMetrics[key].activeTimes = activeTimes;
          }
        }

        // Loop and upsert daily metrics in the database
        for (const [dateStr, metric] of Object.entries(dailyMetrics)) {
          const { error: upsertError } = await upsertAnalyticsSnapshot({
            accountId,
            date: metric.date,
            reach: metric.reach,
            impressions: metric.impressions,
            engagement: metric.engagement,
            followers,
            profileVisits: metric.profileVisits,
            profileLinksTaps: metric.profileLinksTaps,
            accountsReached: metric.reach,
            accountsEngaged: metric.accountsEngaged,
            followersPct: metric.followersPct,
            nonfollowersPct: metric.nonfollowersPct,
            byContentViews: metric.byContentViews,
            byContentInteractions: metric.byContentInteractions || byContentInteractions,
            activeTimes: platform === 'instagram' ? (metric.activeTimes || activeTimes) : null,
            insufficientData
          });

          if (upsertError) {
            console.error(`[MetaAnalyticsService] Upsert failed for ${accountId} on ${dateStr}:`, upsertError);
          }

          // Cache breakdown data in Redis (12h TTL) for the last parsed snapshot date
          if (redisConnection && platform === 'instagram') {
            try {
              const cacheKey = `analytics:breakdown:${accountId}:${dateStr}`;
              const cacheData = {
                byContentViews: metric.byContentViews,
                byContentInteractions: metric.byContentInteractions || byContentInteractions,
                activeTimes: metric.activeTimes || activeTimes
              };
              await redisConnection.set(cacheKey, JSON.stringify(cacheData), 'EX', 12 * 60 * 60);
            } catch (cacheErr) {
              console.warn(`[MetaAnalyticsService] Redis cache failed for ${dateStr}:`, cacheErr);
            }
          }
      }
    }
      // 9. Update reauth status to false since sync completed successfully
      try {
        const { getPlatformAccountRepository } = await import('@/infrastructure/repositories/platform-account.repository');
        await getPlatformAccountRepository().updateReauthStatus(accountId, false);
      } catch (reauthErr) {
        console.warn(`[MetaAnalyticsService] Failed to update reauth status:`, reauthErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[MetaAnalyticsService] Sync critical failure for ${accountId}:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  }
};
