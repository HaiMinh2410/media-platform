/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMetaGraphClient } from '@shared/api/meta/graph-api.client';
import type { 
  MetaInsightsResponse, 
  MetaMediaResponse,
  MetaMediaInsightsResponse,
  MetaApiResponse
} from '@shared/types/meta';
import { 
  parseDoubleBreakdown, 
  parseFollowType, 
  parseMediaProductType 
} from '../utils/meta-parser';

export const metaGraphSyncService = {
  /**
   * Helper to build 30-day chunks for a given range.
   * If currentStart is provided, it separates the chunks for current and previous periods.
   */
  buildPeriodChunks(since: Date, until: Date, currentStart?: Date): Array<{ since: Date; until: Date }> {
    const chunks: { since: Date; until: Date }[] = [];
    
    const buildPeriodChunksHelper = (start: Date, end: Date) => {
      let pStart = new Date(start);
      pStart.setUTCHours(0, 0, 0, 0);
      const pEnd = new Date(end);
      pEnd.setUTCHours(23, 59, 59, 999);
      
      while (pStart < pEnd) {
        let chunkEnd = new Date(pStart);
        chunkEnd.setUTCDate(chunkEnd.getUTCDate() + 30); // 30 days chunking
        if (chunkEnd > pEnd) {
          chunkEnd = new Date(pEnd);
        }
        chunks.push({ since: new Date(pStart), until: new Date(chunkEnd) });
        pStart = new Date(chunkEnd);
      }
    };

    if (currentStart) {
      buildPeriodChunksHelper(since, currentStart);
      buildPeriodChunksHelper(currentStart, until);
    } else {
      buildPeriodChunksHelper(since, until);
    }

    return chunks;
  },

  /**
   * Fetches media items and detailed insights for each media.
   * Calculates interactions and view breakdown by content type.
   */
  async fetchMediaAnalyticsAndDetails(params: {
    externalId: string;
    accessToken: string;
    accountId: string;
  }): Promise<{
    processedPosts: any[];
    byContentInteractions: any;
  }> {
    const { externalId, accessToken, accountId } = params;
    const client = getMetaGraphClient();
    const processedPosts: any[] = [];
    let byContentInteractions: any = null;

    try {
      const mediaRes = await client.request<MetaMediaResponse>(`${externalId}/media`, accessToken, { 
        fields: 'id,media_type,media_product_type,caption,media_url,thumbnail_url,children{media_url,media_type},like_count,comments_count,timestamp', 
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
            const productType = post.media_product_type;
            let metrics = '';
            if (productType === 'REELS') {
              metrics = 'reach,saved,shares,views,ig_reels_avg_watch_time,ig_reels_video_view_total_time,reels_skip_rate';
              return client.request<MetaMediaInsightsResponse>(`${post.id}/insights`, accessToken, { 
                metric: metrics 
              }, 'GET', accountId).then(async (res) => {
                let crosspostedRes: any = null;
                try {
                  crosspostedRes = await client.request<MetaMediaInsightsResponse>(`${post.id}/insights`, accessToken, {
                    metric: 'crossposted_views'
                  }, 'GET', accountId);
                } catch (err) {
                  console.warn(`[MetaGraphSyncService] crossposted_views query failed for reel ${post.id}:`, err);
                }
                if (res.data && res.data.data && crosspostedRes?.data?.data) {
                  res.data.data.push(...crosspostedRes.data.data);
                }
                return { post, res };
              });
            } else if (productType === 'STORY') {
              metrics = 'reach,replies,saved,shares,navigation';
            } else {
              // FEED or AD
              if (post.media_type === 'VIDEO') {
                metrics = 'reach,saved,shares,profile_visits,follows,views';
              } else {
                metrics = 'reach,views,saved,shares,profile_visits,follows';
              }
            }
              
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
            const pVisits = insights.find((i: any) => i.name === 'profile_visits')?.values[0]?.value || 0;
            const pFollows = insights.find((i: any) => i.name === 'follows')?.values[0]?.value || 0;
            
            const pReelsAvgWatchTime = post.media_product_type === 'REELS' 
              ? insights.find((i: any) => i.name === 'ig_reels_avg_watch_time')?.values[0]?.value ?? 0 
              : null;
            const pReelsVideoViewTotalTime = post.media_product_type === 'REELS' 
              ? insights.find((i: any) => i.name === 'ig_reels_video_view_total_time')?.values[0]?.value ?? 0 
              : null;
            const pReelsSkipRate = post.media_product_type === 'REELS' 
              ? insights.find((i: any) => i.name === 'reels_skip_rate')?.values[0]?.value ?? 0 
              : null;
            const pCrosspostedViews = post.media_product_type === 'REELS' 
              ? insights.find((i: any) => i.name === 'crossposted_views')?.values[0]?.value ?? 0 
              : null;

            const totalInt = pLikes + pComments + pSaved + pShares;

            if (post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') postInt += totalInt;
            else if (post.media_type === 'VIDEO' || post.media_type === 'REELS') reelInt += totalInt;
            else if (post.media_product_type === 'STORY') storyInt += totalInt;
            
            let thumbnailUrl = post.thumbnail_url || post.media_url || null;
            if (!thumbnailUrl && post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[0]) {
              thumbnailUrl = post.children.data[0].media_url;
            }

            const postReach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
            const postImpressions = insights.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
            const postViews = insights.find((i: any) => i.name === 'views')?.values[0]?.value || postImpressions || postReach;

            processedPosts.push({
              postId: post.id,
              mediaType: post.media_product_type === 'REELS' ? 'REELS' : post.media_type,
              caption: post.caption || null,
              thumbnailUrl: thumbnailUrl,
              mediaUrl: post.media_url || null,
              likeCount: pLikes,
              commentsCount: pComments,
              sharesCount: pShares,
              savedCount: pSaved,
              totalInteractions: totalInt,
              reach: postReach,
              views: postViews,
              profileVisits: pVisits,
              follows: pFollows,
              igReelsAvgWatchTime: pReelsAvgWatchTime,
              igReelsVideoViewTotalTime: pReelsVideoViewTotalTime,
              reelsSkipRate: pReelsSkipRate,
              crosspostedViews: pCrosspostedViews,
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
    } catch (err) {
      console.error('[MetaGraphSyncService] fetchMediaAnalyticsAndDetails failure:', err);
    }

    return { processedPosts, byContentInteractions };
  },

  /**
   * Fetches insights for a 30-day chunk for either Facebook or Instagram.
   */
  async fetchChunkInsights(params: {
    externalId: string;
    accessToken: string;
    accountId: string;
    platform: string;
    chunk: { since: Date; until: Date };
    insufficientData: boolean;
  }): Promise<{
    dailyMetrics: Record<string, any>;
    followersPct: number;
    nonfollowersPct: number;
    byContentViews: any;
    byContentInteractions: any;
    uniqueReach: number;
    uniqueViews: number;
    uniqueAccountsEngaged: number;
    uniqueInteractions: number;
    onlineFollowersValues: any[];
  }> {
    const { externalId, accessToken, accountId, platform, chunk, insufficientData } = params;
    const client = getMetaGraphClient();

    const sinceUnix = Math.floor(chunk.since.getTime() / 1000);
    const untilUnix = Math.floor(chunk.until.getTime() / 1000);

    const dailyMetrics: Record<string, any> = {};
    let chunkFollowersPct = 0;
    let chunkNonfollowersPct = 0;
    let chunkByContentViews: any = null;
    let chunkByContentInteractions: any = null;
    let uniqueReachVal = 0;
    let uniqueViewsVal = 0;
    let uniqueAccountsEngagedVal = 0;
    let uniqueInteractionsVal = 0;
    const onlineFollowersValues: any[] = [];

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
                  profileVisits: 0,
                  profileLinksTaps: 0,
                  accountsReached: 0,
                  accountsEngaged: 0,
                  followersPct: 0,
                  nonfollowersPct: 0,
                  byContentViews: null
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
    } else if (platform === 'instagram') {
      // Create daily chunks (1-day duration) to bypass IG Graph API limitations on daily metrics
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
        
        const nextDay = new Date(currentDay);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        currentDay = nextDay;
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
        // [0] Reach follow type breakdown
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
        // [2] Views double breakdown
        client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
          metric: 'views', 
          breakdown: 'media_product_type,follow_type', 
          period: 'day',
          metric_type: 'total_value',
          since: sinceUnix,
          until: untilUnix
        }, 'GET', accountId),
        // [3] True non-breakdown unique reach & views for range
        client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
          metric: 'reach,views', 
          period: 'day',
          metric_type: 'total_value',
          since: sinceUnix,
          until: untilUnix
        }, 'GET', accountId),
        // [4] True non-breakdown unique accounts engaged and total interactions
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
        // [6] follower_demographics
        otherPromises.push(
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'follower_demographics', 
            period: 'lifetime' 
          }, 'GET', accountId)
        );
        // [7] online_followers
        otherPromises.push(
          client.request<MetaInsightsResponse>(`${externalId}/insights`, accessToken, { 
            metric: 'online_followers', 
            period: 'lifetime',
            since: sinceUnix,
            until: untilUnix
          }, 'GET', accountId)
        );
      }

      const [dailyCoreResults, otherResults] = await Promise.all([
        Promise.allSettled(dailyCorePromises),
        Promise.allSettled(otherPromises)
      ]);

      // Parse daily core insights
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
                profileVisits: 0,
                profileLinksTaps: 0,
                accountsReached: 0,
                accountsEngaged: 0,
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

      // Parse follow type breakdown (otherResults[0])
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

      // Parse Views double breakdown (otherResults[2])
      const viewsBreakdownRes = otherResults[2];
      if (viewsBreakdownRes && viewsBreakdownRes.status === 'fulfilled' && viewsBreakdownRes.value.data) {
        const d = viewsBreakdownRes.value.data as MetaInsightsResponse;
        const doubleBreakdown = parseDoubleBreakdown(d.data, 'views');
        
        if (doubleBreakdown) {
          const totalAll = doubleBreakdown.all.posts + doubleBreakdown.all.reels + doubleBreakdown.all.stories;
          const totalFollowers = doubleBreakdown.followers.posts + doubleBreakdown.followers.reels + doubleBreakdown.followers.stories;
          const totalNonfollowers = doubleBreakdown.nonfollowers.posts + doubleBreakdown.nonfollowers.reels + doubleBreakdown.nonfollowers.stories;
          
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
        } else {
          // Fallback to single breakdown
          const viewsBreakdown = parseMediaProductType(d.data, 'views');
          const totalViews = viewsBreakdown.posts + viewsBreakdown.reels + viewsBreakdown.stories;
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

      // Parse true unique reach and views (otherResults[3])
      if (followTypeRes && followTypeRes.status === 'fulfilled' && followTypeRes.value.data) {
        const d = followTypeRes.value.data as MetaInsightsResponse;
        const reachItem = d.data?.find((i: any) => i.name === 'reach');
        uniqueReachVal = reachItem?.total_value?.value || 0;
      }

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

      // Parse unique accounts engaged and total interactions (otherResults[4])
      const engRes = otherResults[4];
      if (engRes && engRes.status === 'fulfilled' && engRes.value.data) {
        const d = engRes.value.data as MetaInsightsResponse;
        const engItem = d.data?.find((i: any) => i.name === 'accounts_engaged');
        uniqueAccountsEngagedVal = engItem?.total_value?.value || 0;
        const intItem = d.data?.find((i: any) => i.name === 'total_interactions');
        uniqueInteractionsVal = intItem?.total_value?.value || 0;
      }

      // Parse total interactions breakdown (otherResults[5])
      const interactionsBreakdownRes = otherResults[5];
      if (interactionsBreakdownRes && interactionsBreakdownRes.status === 'fulfilled' && interactionsBreakdownRes.value.data) {
        const d = interactionsBreakdownRes.value.data as MetaInsightsResponse;
        const parsedInt = parseMediaProductType(d.data, 'total_interactions');
        const totalIntVal = parsedInt.posts + parsedInt.reels + parsedInt.stories;
        const getPct = (val: number, total: number) => total > 0 ? Number((val / total * 100).toFixed(4)) : 0;
        
        if (totalIntVal > 0) {
          chunkByContentInteractions = {
            posts: getPct(parsedInt.posts, totalIntVal),
            reels: getPct(parsedInt.reels, totalIntVal),
            stories: getPct(parsedInt.stories, totalIntVal)
          };
        }
      }

      // Process online followers (otherResults[7])
      const onlineFollowersIdx = 7;
      if (!insufficientData && otherResults[onlineFollowersIdx] && otherResults[onlineFollowersIdx].status === 'fulfilled' && otherResults[onlineFollowersIdx].value.data) {
        const firstPageRes = otherResults[onlineFollowersIdx].value.data as MetaInsightsResponse;
        const onlineFollowersData = firstPageRes.data?.find((i: any) => i.name === 'online_followers');
        
        if (onlineFollowersData && Array.isArray(onlineFollowersData.values)) {
          onlineFollowersValues.push(...onlineFollowersData.values);
          
          let nextUrl = firstPageRes.paging?.next;
          while (nextUrl) {
            try {
              const pageRes = await fetch(nextUrl);
              if (!pageRes.ok) break;
              const pageData = await pageRes.json() as MetaInsightsResponse;
              if (pageData && Array.isArray(pageData.data)) {
                const pageMetric = pageData.data.find((i: any) => i.name === 'online_followers');
                if (pageMetric && Array.isArray(pageMetric.values)) {
                  onlineFollowersValues.push(...pageMetric.values);
                }
              }
              nextUrl = pageData.paging?.next;
            } catch (pageErr) {
              console.error('[MetaGraphSyncService] online_followers paging failure:', pageErr);
              break;
            }
          }
        }
      }
    }

    return {
      dailyMetrics,
      followersPct: chunkFollowersPct,
      nonfollowersPct: chunkNonfollowersPct,
      byContentViews: chunkByContentViews,
      byContentInteractions: chunkByContentInteractions,
      uniqueReach: uniqueReachVal,
      uniqueViews: uniqueViewsVal,
      uniqueAccountsEngaged: uniqueAccountsEngagedVal,
      uniqueInteractions: uniqueInteractionsVal,
      onlineFollowersValues
    };
  }
};
