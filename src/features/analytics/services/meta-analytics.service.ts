/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMetaGraphClient } from '@shared/api/meta/graph-api.client';
import { redisConnection } from '@shared/lib/queue/bullmq.provider';
import { getTokenEncryptionService } from '@features/settings/server';
import { db } from '@shared/lib/db';
import { upsertAnalyticsSnapshot, upsertPostAnalytics } from '@features/analytics/repositories/analytics.repository';
import type { 
  MetaPageFansResponse, 
  MetaIGFollowersResponse,
} from '@shared/types/meta';
import { aggregateActiveTimes } from '../utils/meta-parser';
import { metaGraphSyncService } from './meta-graph-sync.service';

/**
 * Service for syncing analytics data from Meta Graph API.
 * Handles both Facebook Pages and Instagram Business Accounts.
 * Serves as Orchestrator delegating API sync details to metaGraphSyncService and parsing to meta-parser.
 */
export const metaAnalyticsService = {
  /**
   * Fetches live analytics for a single Meta account for a given range.
   * Maps Meta metrics to our internal structures in-memory.
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

        // Fetch media list & aggregate interactions via sync service helper
        const mediaDetails = await metaGraphSyncService.fetchMediaAnalyticsAndDetails({
          externalId,
          accessToken,
          accountId
        });
        processedPosts = mediaDetails.processedPosts;
        byContentInteractions = mediaDetails.byContentInteractions;
      }

      // 3. Chunking range
      const chunks = metaGraphSyncService.buildPeriodChunks(since, until, currentStart);

      const allSnapshots: any[] = [];
      const chunkUniqueReaches: number[] = [];
      const chunkUniqueViews: number[] = [];
      const chunkUniqueAccountsEngaged: number[] = [];
      const chunkUniqueInteractions: number[] = [];
      const allOnlineFollowersValues: any[] = [];

      // 4. Fetch metrics for each chunk
      for (const chunk of chunks) {
        const chunkData = await metaGraphSyncService.fetchChunkInsights({
          externalId,
          accessToken,
          accountId,
          platform,
          chunk,
          insufficientData
        });

        // Add chunk-level unique totals
        if (platform === 'facebook' || platform === 'meta') {
          chunkUniqueReaches.push(0);
        } else if (platform === 'instagram') {
          chunkUniqueReaches.push(chunkData.uniqueReach);
          chunkUniqueViews.push(chunkData.uniqueViews);
          chunkUniqueAccountsEngaged.push(chunkData.uniqueAccountsEngaged);
          chunkUniqueInteractions.push(chunkData.uniqueInteractions);
          allOnlineFollowersValues.push(...chunkData.onlineFollowersValues);
        }

        // Map daily core metrics of this chunk
        for (const metric of Object.values(chunkData.dailyMetrics)) {
          allSnapshots.push({
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
            followersPct: chunkData.followersPct,
            nonfollowersPct: chunkData.nonfollowersPct,
            byContentViews: chunkData.byContentViews,
            byContentInteractions: chunkData.byContentInteractions || byContentInteractions,
            activeTimes: null, // Aggregated after loop
            insufficientData
          });
        }
      }

      // Aggregate historical active times for Instagram if we have demographics data
      if (platform === 'instagram' && allOnlineFollowersValues.length > 0) {
        activeTimes = aggregateActiveTimes(allOnlineFollowersValues);
        for (const snapshot of allSnapshots) {
          snapshot.activeTimes = activeTimes;
        }
      }

      // 5. Update reauth status to false since live fetch completed successfully
      try {
        const { getPlatformAccountRepository } = await import('@features/settings/server');
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
   * Syncs daily analytics for a single Meta account and writes to DB.
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

        // Fetch and process media list via Graph sync helper
        const mediaDetails = await metaGraphSyncService.fetchMediaAnalyticsAndDetails({
          externalId,
          accessToken,
          accountId
        });
        processedPosts = mediaDetails.processedPosts;
        byContentInteractions = mediaDetails.byContentInteractions;

        // Save post details to DB
        for (const postData of processedPosts) {
          await upsertPostAnalytics(accountId, postData);
        }

        // Cache Top 5 by views and interactions to Redis (TTL 6h)
        if (redisConnection && processedPosts.length > 0) {
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

      // 3. Chunking range selection
      let syncStart: Date;
      let syncEnd: Date;

      if (params.since && params.until) {
        syncStart = new Date(params.since);
        syncStart.setUTCHours(0, 0, 0, 0);
        syncEnd = new Date(params.until);
        syncEnd.setUTCHours(23, 59, 59, 999);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
        
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(23, 59, 59, 999);

        syncStart = thirtyDaysAgo;
        syncEnd = yesterday;
      }

      // Split into 30 days chunks
      const chunks = metaGraphSyncService.buildPeriodChunks(syncStart, syncEnd);
      const allOnlineFollowersValues: any[] = [];

      // 4. Fetch metrics and write daily snapshots to DB
      for (const chunk of chunks) {
        const chunkData = await metaGraphSyncService.fetchChunkInsights({
          externalId,
          accessToken,
          accountId,
          platform,
          chunk,
          insufficientData
        });

        if (platform === 'instagram') {
          allOnlineFollowersValues.push(...chunkData.onlineFollowersValues);
        }

        // Loop and upsert daily metrics in the database
        for (const [dateStr, metric] of Object.entries(chunkData.dailyMetrics)) {
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
            followersPct: chunkData.followersPct,
            nonfollowersPct: chunkData.nonfollowersPct,
            byContentViews: chunkData.byContentViews,
            byContentInteractions: chunkData.byContentInteractions || byContentInteractions,
            activeTimes: null, // Aggregated historically at the end
            insufficientData
          });

          if (upsertError) {
            console.error(`[MetaAnalyticsService] DB Upsert failed for ${accountId} on ${dateStr}:`, upsertError);
          }

          // Cache breakdown data in Redis (12h TTL) for the last parsed snapshot date
          if (redisConnection && platform === 'instagram') {
            try {
              const cacheKey = `analytics:breakdown:${accountId}:${dateStr}`;
              const cacheData = {
                byContentViews: chunkData.byContentViews,
                byContentInteractions: chunkData.byContentInteractions || byContentInteractions,
                activeTimes: null
              };
              await redisConnection.set(cacheKey, JSON.stringify(cacheData), 'EX', 12 * 60 * 60);
            } catch (cacheErr) {
              console.warn(`[MetaAnalyticsService] Redis cache failed for ${dateStr}:`, cacheErr);
            }
          }
        }
      }

      // 5. Update historical active times across all snapshots
      if (platform === 'instagram' && allOnlineFollowersValues.length > 0) {
        const finalActiveTimes = aggregateActiveTimes(allOnlineFollowersValues);
        try {
          await db.analytics_snapshots.updateMany({
            where: {
              account_id: accountId,
              date: {
                gte: syncStart,
                lte: syncEnd
              }
            },
            data: {
              active_times: finalActiveTimes as any
            }
          });

          // Refresh cache with activeTimes for each daily snapshot
          if (redisConnection) {
            let currentDay = new Date(syncStart);
            while (currentDay <= syncEnd) {
              const dateStr = currentDay.toISOString().split('T')[0];
              const cacheKey = `analytics:breakdown:${accountId}:${dateStr}`;
              try {
                const existingStr = await redisConnection.get(cacheKey);
                if (existingStr) {
                  const existingData = JSON.parse(existingStr);
                  existingData.activeTimes = finalActiveTimes;
                  await redisConnection.set(cacheKey, JSON.stringify(existingData), 'EX', 12 * 60 * 60);
                }
              } catch {
                // Ignore silent cache refresh errors
              }
              const nextDay = new Date(currentDay);
              nextDay.setUTCDate(nextDay.getUTCDate() + 1);
              currentDay = nextDay;
            }
          }
        } catch (dbErr) {
          console.error('[MetaAnalyticsService] Failed to update historical active_times in DB:', dbErr);
        }
      }

      // 6. Update reauth status to false since sync completed successfully
      try {
        const { getPlatformAccountRepository } = await import('@features/settings/server');
        await getPlatformAccountRepository().updateReauthStatus(accountId, false);
      } catch (reauthErr) {
        console.warn(`[MetaAnalyticsService] Failed to update reauth status:`, reauthErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error(`[MetaAnalyticsService] Sync critical failure for ${accountId}:`, err);
      return { success: false, error: err.message || 'UNKNOWN_ERROR' };
    }
  },

  /**
   * Fetches detailed follower demographics and daily follows/unfollows.
   */
  async fetchFollowerDetails(params: {
    accountId: string;
    externalId: string;
    platform: string;
    encryptedToken: string;
    since: Date;
    until: Date;
    timeframe: 'this_month' | 'this_week';
  }): Promise<{
    success: boolean;
    followersCount: number;
    username: string;
    insufficientData: boolean;
    followsAndUnfollows?: Array<{ date: string; follows: number; unfollows: number }>;
    demographics?: {
      age: Array<{ name: string; value: number }>;
      city: Array<{ name: string; value: number }>;
      country: Array<{ name: string; value: number }>;
      gender: Array<{ name: string; value: number }>;
    };
    error?: string;
  }> {
    const { accountId, externalId, platform, encryptedToken, since, until, timeframe } = params;

    if (platform !== 'instagram') {
      return {
        success: false,
        followersCount: 0,
        username: '',
        insufficientData: false,
        error: 'ONLY_INSTAGRAM_SUPPORTED'
      };
    }

    try {
      const encryptionService = getTokenEncryptionService();
      const { data: accessToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

      if (decryptError || !accessToken) {
        return {
          success: false,
          followersCount: 0,
          username: '',
          insufficientData: false,
          error: `TOKEN_DECRYPT_FAILED: ${decryptError}`
        };
      }

      const client = getMetaGraphClient();

      // Get total follower count and username
      const igRes = await client.request<MetaIGFollowersResponse>(
        externalId,
        accessToken,
        { fields: 'followers_count,username' },
        'GET',
        accountId
      );
      const followersCount = igRes.data?.followers_count || 0;
      const username = igRes.data?.username || '';

      if (followersCount < 100) {
        return {
          success: true,
          followersCount,
          username,
          insufficientData: true,
          followsAndUnfollows: [],
          demographics: { age: [], city: [], country: [], gender: [] }
        };
      }

      // Fetch follows_and_unfollows daily in parallel and demographics
      const dailyChunks: { dateStr: string; sinceUnix: number; untilUnix: number }[] = [];
      let currentDay = new Date(since);
      currentDay.setUTCHours(0, 0, 0, 0);
      
      while (currentDay <= until) {
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

      const followsPromises = dailyChunks.map(dChunk =>
        client.request<any>(
          `${externalId}/insights`,
          accessToken,
          {
            metric: 'follows_and_unfollows',
            metric_type: 'total_value',
            breakdown: 'follow_type',
            period: 'day',
            since: dChunk.sinceUnix,
            until: dChunk.untilUnix
          },
          'GET',
          accountId
        ).then(res => ({
          dateStr: dChunk.dateStr,
          res
        })).catch(err => {
          console.warn(`[MetaAnalyticsService] Failed to fetch follows_and_unfollows for ${dChunk.dateStr}:`, err);
          return { dateStr: dChunk.dateStr, res: null };
        })
      );

      const demoBreakdowns = ['age', 'city', 'country', 'gender'];
      
      // Fetch follower demographics
      const followerDemoPromises = demoBreakdowns.map(b => 
        client.request<any>(
          `${externalId}/insights`,
          accessToken,
          {
            metric: 'follower_demographics',
            metric_type: 'total_value',
            breakdown: b,
            period: 'lifetime',
            timeframe: timeframe
          },
          'GET',
          accountId
        ).catch(err => {
          console.warn(`[MetaAnalyticsService] Failed to fetch follower demographics for ${b}:`, err);
          return null;
        })
      );

      // Fetch engaged audience demographics
      const engagedDemoPromises = demoBreakdowns.map(b => 
        client.request<any>(
          `${externalId}/insights`,
          accessToken,
          {
            metric: 'engaged_audience_demographics',
            metric_type: 'total_value',
            breakdown: b,
            period: 'lifetime',
            timeframe: timeframe
          },
          'GET',
          accountId
        ).catch(err => {
          console.warn(`[MetaAnalyticsService] Failed to fetch engaged audience demographics for ${b}:`, err);
          return null;
        })
      );

      const [followsResults, ...demoAllResults] = await Promise.all([
        Promise.all(followsPromises),
        ...followerDemoPromises,
        ...engagedDemoPromises
      ]);

      // Parse follows_and_unfollows
      const followsData: Array<{ date: string; follows: number; unfollows: number }> = [];

      for (const itemResult of followsResults) {
        const { dateStr, res } = itemResult;
        let dayFollows = 0;
        let dayUnfollows = 0;

        if (res && res.data && Array.isArray(res.data.data)) {
          const item = res.data.data.find((i: any) => i.name === 'follows_and_unfollows');
          if (item && item.total_value) {
            const targetBreakdowns = item.total_value.breakdowns;
            if (Array.isArray(targetBreakdowns)) {
              for (const b of targetBreakdowns) {
                const keys = b.dimension_keys || [];
                const followTypeIdx = keys.indexOf('follow_type');
                if (followTypeIdx !== -1 && Array.isArray(b.results)) {
                  for (const r of b.results) {
                    const vals = r.dimension_values || [];
                    const val = r.value || 0;
                    const type = (vals[followTypeIdx] || '').toUpperCase();
                    if (type === 'FOLLOW' || type === 'FOLLOWS' || type === 'FOLLOWER') {
                      dayFollows += val;
                    } else if (type === 'UNFOLLOW' || type === 'UNFOLLOWS' || type === 'NON_FOLLOWER') {
                      dayUnfollows += val;
                    }
                  }
                }
              }
            }
          }
        }

        followsData.push({
          date: dateStr,
          follows: dayFollows,
          unfollows: dayUnfollows
        });
      }

      followsData.sort((a, b) => a.date.localeCompare(b.date));

      // Parse demographics
      const demographics: {
        age: Array<{ name: string; value: number }>;
        city: Array<{ name: string; value: number }>;
        country: Array<{ name: string; value: number }>;
        gender: Array<{ name: string; value: number }>;
        followers: {
          age: Array<{ name: string; value: number }>;
          city: Array<{ name: string; value: number }>;
          country: Array<{ name: string; value: number }>;
          gender: Array<{ name: string; value: number }>;
        };
        engaged: {
          age: Array<{ name: string; value: number }>;
          city: Array<{ name: string; value: number }>;
          country: Array<{ name: string; value: number }>;
          gender: Array<{ name: string; value: number }>;
        };
      } = {
        age: [],
        city: [],
        country: [],
        gender: [],
        followers: { age: [], city: [], country: [], gender: [] },
        engaged: { age: [], city: [], country: [], gender: [] }
      };

      // Parse follower demographics
      demoBreakdowns.forEach((b, idx) => {
        const res = demoAllResults[idx];
        const resData = (res as any)?.data || (res as any)?.value?.data;
        if (resData && Array.isArray(resData.data)) {
          const item = resData.data.find((i: any) => i.name === 'follower_demographics');
          if (item) {
            const valueObj = item.total_value || (item.values && item.values[0]) || item;
            const list: { name: string; value: number }[] = [];
            
            if (Array.isArray(valueObj.breakdowns)) {
              for (const bk of valueObj.breakdowns) {
                const keys = bk.dimension_keys || [];
                const bIdx = keys.indexOf(b);
                if (bIdx !== -1 && Array.isArray(bk.results)) {
                  for (const r of bk.results) {
                    const vals = r.dimension_values || [];
                    const label = vals[bIdx] || 'Unknown';
                    const val = r.value || 0;
                    list.push({ name: label, value: val });
                  }
                }
              }
            } else if (valueObj.value && typeof valueObj.value === 'object') {
              for (const [k, v] of Object.entries(valueObj.value)) {
                if (typeof v === 'number') {
                  list.push({ name: k, value: v });
                }
              }
            }
            
            list.sort((a, b) => b.value - a.value);
            
            if (b === 'age') {
              demographics.age = list;
              demographics.followers.age = list;
            } else if (b === 'city') {
              demographics.city = list;
              demographics.followers.city = list;
            } else if (b === 'country') {
              demographics.country = list;
              demographics.followers.country = list;
            } else if (b === 'gender') {
              demographics.gender = list;
              demographics.followers.gender = list;
            }
          }
        }
      });

      // Parse engaged demographics
      demoBreakdowns.forEach((b, idx) => {
        const res = demoAllResults[demoBreakdowns.length + idx];
        const resData = (res as any)?.data || (res as any)?.value?.data;
        if (resData && Array.isArray(resData.data)) {
          const item = resData.data.find((i: any) => i.name === 'engaged_audience_demographics');
          if (item) {
            const valueObj = item.total_value || (item.values && item.values[0]) || item;
            const list: { name: string; value: number }[] = [];
            
            if (Array.isArray(valueObj.breakdowns)) {
              for (const bk of valueObj.breakdowns) {
                const keys = bk.dimension_keys || [];
                const bIdx = keys.indexOf(b);
                if (bIdx !== -1 && Array.isArray(bk.results)) {
                  for (const r of bk.results) {
                    const vals = r.dimension_values || [];
                    const label = vals[bIdx] || 'Unknown';
                    const val = r.value || 0;
                    list.push({ name: label, value: val });
                  }
                }
              }
            } else if (valueObj.value && typeof valueObj.value === 'object') {
              for (const [k, v] of Object.entries(valueObj.value)) {
                if (typeof v === 'number') {
                  list.push({ name: k, value: v });
                }
              }
            }
            
            list.sort((a, b) => b.value - a.value);
            
            if (b === 'age') demographics.engaged.age = list;
            else if (b === 'city') demographics.engaged.city = list;
            else if (b === 'country') demographics.engaged.country = list;
            else if (b === 'gender') demographics.engaged.gender = list;
          }
        }
      });

      return {
        success: true,
        followersCount,
        username,
        insufficientData: false,
        followsAndUnfollows: followsData,
        demographics
      };

    } catch (err: any) {
      console.error('[MetaAnalyticsService] fetchFollowerDetails error:', err);
      return {
        success: false,
        followersCount: 0,
        username: '',
        insufficientData: false,
        error: err.message || 'UNKNOWN_ERROR'
      };
    }
  }
};
