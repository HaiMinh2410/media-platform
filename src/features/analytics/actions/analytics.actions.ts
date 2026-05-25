'use server';

import { 
  getAnalyticsForPeriod, 
  getTopPosts, 
  getEngagementBreakdown, 
  getPostFrequency, 
  getTopContentFromDB,
  upsertAnalyticsSnapshot,
  upsertPostAnalytics,
  mapLiveAnalyticsToPeriodData,
  createSyncLog
} from '@features/analytics/repositories/analytics.repository';
import { redisConnection } from '@shared/lib/queue/bullmq.provider';
import { getPlatformAccountRepository } from '@features/settings/server';
import { metaAnalyticsService } from '../services/meta-analytics.service';
import { AnalyticsFilter, AnalyticsRange } from '@features/analytics/types';
import { subDays, differenceInDays } from 'date-fns';
import { db } from '@shared/lib/db';
import { buildDeepAnalytics } from '@features/analytics/services/post-analytics-engine';
import { groqClient } from '@features/ai-agent/services/groq-client';
import { AI_AGENT_DEFAULTS } from '@features/ai-agent/types-agent';
import { Platform, ViewMode, getRatingLabel, getRatingKey, PLATFORM_CONTEXT, PLATFORM_BENCHMARKS } from '@features/analytics/constants/platformBenchmarks';
import { PerformanceInsight } from '@features/analytics/types/performanceInsight';


/**
 * Server Action to fetch analytics with Period-over-Period support.
 * Prioritizes calling Live Meta API, asynchronously caches snapshots/posts, and falls back to DB on error.
 */
export async function getAnalyticsAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = {
    accountId,
    range,
    customStart,
    customEnd
  };

  try {
    // 1. Check Platform Account and encrypted Token
    const repo = getPlatformAccountRepository();
    const { data: account, error: accountError } = await repo.findById(accountId);

    if (accountError || !account) {
      console.warn(`[getAnalyticsAction] Account not found: ${accountId}, falling back to DB.`);
      const { data, error } = await getAnalyticsForPeriod(filter);
      return { data, error };
    }

    // Get Meta Tokens
    const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
    const accountWithToken = accountsWithTokens?.find(a => a.id === accountId);

    // Calculate time boundaries for the query (current + previous periods combined)
    const now = new Date();
    const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    let currentEnd = new Date(Date.UTC(
      localTime.getUTCFullYear(),
      localTime.getUTCMonth(),
      localTime.getUTCDate(),
      23, 59, 59, 999
    ));
    let currentStart: Date;
    let previousStart: Date;

    if (range === 'custom' && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentStart.setUTCHours(0, 0, 0, 0);
      currentEnd = new Date(customEnd);
      currentEnd.setUTCHours(23, 59, 59, 999);
      const diff = differenceInDays(currentEnd, currentStart) + 1;
      previousStart = subDays(currentStart, diff);
      previousStart.setUTCHours(0, 0, 0, 0);
    } else {
      const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setUTCHours(0, 0, 0, 0);
      previousStart = subDays(currentStart, days);
      previousStart.setUTCHours(0, 0, 0, 0);
    }

    // Define dynamic range suffix for caching (handles custom range properly based on exact date boundary)
    const rangeSuffix = range === 'custom' && customStart && customEnd 
      ? `custom_${new Date(customStart).toISOString().split('T')[0]}_${new Date(customEnd).toISOString().split('T')[0]}`
      : range;

    // 1.5 Check Redis period data cache (supports all ranges including custom for extreme speed and reliability)
    const periodCacheKey = `live_analytics_period_cache:${accountId}:${rangeSuffix}`;
    if (redisConnection) {
      try {
        const cachedDataStr = await redisConnection.get(periodCacheKey);
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          // Parse date strings back to Date objects in snapshots
          if (cachedData.current) {
            cachedData.current = cachedData.current.map((s: any) => ({
              ...s,
              date: s.date ? new Date(s.date) : null
            }));
          }
          if (cachedData.previous) {
            cachedData.previous = cachedData.previous.map((s: any) => ({
              ...s,
              date: s.date ? new Date(s.date) : null
            }));
          }
          if (cachedData.currentStart) cachedData.currentStart = new Date(cachedData.currentStart);
          if (cachedData.currentEnd) cachedData.currentEnd = new Date(cachedData.currentEnd);
          if (cachedData.previousStart) cachedData.previousStart = new Date(cachedData.previousStart);
          if (cachedData.previousEnd) cachedData.previousEnd = new Date(cachedData.previousEnd);
          
          console.log(`[getAnalyticsAction] Mapped PeriodData hit Redis cache for account: ${accountId}, range: ${rangeSuffix}`);
          return { data: cachedData, error: null };
        }
      } catch (cacheErr) {
        console.error('[getAnalyticsAction] Failed to read from Redis period cache:', cacheErr);
      }
    }

    // 2. If encryptedToken is available, fetch Live Analytics from Meta API
    let isLongPeriod = false;
    if (range === 'custom' && customStart && customEnd) {
      const diff = differenceInDays(new Date(customEnd), new Date(customStart)) + 1;
      isLongPeriod = diff > 30;
    } else {
      isLongPeriod = range === '90d';
    }

    let skipLiveFetch = false;
    const freshCacheKey = `live_analytics_fresh:${accountId}:${rangeSuffix}`;
    // Only skip live fetch for long periods (>30 days). For short periods (<=30 days), we must always fetch live to get precise unique counts.
    if (isLongPeriod && redisConnection && accountWithToken?.encryptedToken) {
      try {
        const isFresh = await redisConnection.get(freshCacheKey);
        if (isFresh === 'true') {
          console.log(`[getAnalyticsAction] DB cache is fresh (Redis key exists). Skipping live fetch for account: ${accountId}, range: ${rangeSuffix}`);
          skipLiveFetch = true;
        }
      } catch (err) {
        console.error('[getAnalyticsAction] Failed to check Redis fresh indicator:', err);
      }
    }

    if (accountWithToken?.encryptedToken && !skipLiveFetch) {
      console.log(`[getAnalyticsAction] Found Meta Token. Fetching Live Analytics from ${previousStart.toISOString()} to ${currentEnd.toISOString()} with currentStart ${currentStart.toISOString()}`);
      
      const liveResult = await metaAnalyticsService.fetchLiveAnalytics({
        accountId: account.id,
        externalId: account.externalId,
        platform: account.platform,
        encryptedToken: accountWithToken.encryptedToken,
        since: previousStart,
        until: currentEnd,
        currentStart: currentStart
      });

      if (liveResult.success && liveResult.snapshots) {
        console.log(`[getAnalyticsAction] Live fetch succeeded with ${liveResult.snapshots.length} snapshots and ${liveResult.posts?.length || 0} posts.`);

        // Set Redis fresh indicator key to prevent constant API calling on F5/tab changes (TTL: 15 minutes = 900 seconds)
        if (redisConnection) {
          redisConnection.set(freshCacheKey, 'true', 'EX', 900)
            .catch(err => console.error('[getAnalyticsAction] Failed to set Redis fresh key:', err));
        }

        // Asynchronously upsert snapshots and posts to DB as cache (non-blocking for fast UI response)
        const snapshotsToUpsert = liveResult.snapshots;
        const postsToUpsert = liveResult.posts || [];

        Promise.all([
          ...snapshotsToUpsert.map(s => upsertAnalyticsSnapshot({
            accountId: s.accountId,
            date: s.date,
            reach: s.reach,
            impressions: s.impressions,
            engagement: s.engagement,
            followers: s.followers,
            profileVisits: s.profileVisits,
            profileLinksTaps: s.profileLinksTaps,
            accountsReached: s.accountsReached,
            accountsEngaged: s.accountsEngaged,
            followersPct: s.followersPct,
            nonfollowersPct: s.nonfollowersPct,
            byContentViews: s.byContentViews,
            byContentInteractions: s.byContentInteractions,
            activeTimes: s.activeTimes,
            insufficientData: s.insufficientData
          })),
          ...postsToUpsert.map(p => upsertPostAnalytics(accountId, {
            postId: p.postId,
            mediaType: p.mediaType,
            caption: p.caption,
            thumbnailUrl: p.thumbnailUrl,
            mediaUrl: p.mediaUrl,
            likeCount: p.likeCount,
            commentsCount: p.commentsCount,
            sharesCount: p.sharesCount,
            savedCount: p.savedCount,
            totalInteractions: p.totalInteractions,
            views: p.views,
            reach: p.reach,
            profileVisits: p.profileVisits || 0,
            follows: p.follows || 0,
            igReelsAvgWatchTime: p.igReelsAvgWatchTime ?? 0,
            igReelsVideoViewTotalTime: p.igReelsVideoViewTotalTime ?? 0,
            reelsSkipRate: p.reelsSkipRate ?? 0,
            crosspostedViews: p.crosspostedViews ?? 0,
            postedAt: p.postedAt
          }))
        ]).catch(upsertErr => {
          console.error(`[getAnalyticsAction] Background upsert cache failed:`, upsertErr);
        });

        // Cache live data in Redis for other parallel actions to use (TTL: 15s)
        if (redisConnection) {
          const cachePayload = JSON.stringify({
            snapshots: liveResult.snapshots,
            posts: liveResult.posts || []
          });
          redisConnection.set(`live_analytics_cache:${accountId}`, cachePayload, 'EX', 15)
            .catch(redisErr => console.error('[getAnalyticsAction] Failed to cache live data in Redis:', redisErr));
        }

        const periodData = mapLiveAnalyticsToPeriodData({
          snapshots: liveResult.snapshots,
          posts: liveResult.posts || [],
          filter,
          chunkUniqueReaches: liveResult.chunkUniqueReaches,
          chunkUniqueViews: liveResult.chunkUniqueViews,
          chunkUniqueAccountsEngaged: liveResult.chunkUniqueAccountsEngaged,
          chunkUniqueInteractions: liveResult.chunkUniqueInteractions
        });

        // Cache the mapped periodData in Redis (TTL: 15 minutes = 900 seconds)
        if (redisConnection) {
          redisConnection.set(periodCacheKey, JSON.stringify(periodData), 'EX', 900)
            .catch(err => console.error('[getAnalyticsAction] Failed to cache periodData in Redis:', err));
        }

        return { data: periodData, error: null };
      } else {
        const errStr = liveResult.error || 'LIVE_FETCH_FAILED';
        console.error(`[getAnalyticsAction] Live fetch failed: ${errStr}. Falling back to DB.`);

        // Detect Meta Auth or Token expiration errors and update reauth status
        const isAuthError = errStr.includes('TOKEN') || errStr.includes('auth') || errStr.includes('190') || errStr.includes('100');
        if (isAuthError) {
          try {
            await repo.updateReauthStatus(accountId, true);
            account.needs_reauth = true; // Update local state for immediate fallback warning injection
            await createSyncLog({
              accountId,
              service: 'live_analytics',
              status: 'failed',
              errorMessage: errStr,
              errorCode: 'META_AUTH_ERROR'
            });
          } catch (dbErr) {
            console.error('[getAnalyticsAction] Failed to update reauth status in DB:', dbErr);
          }
        }
      }
    } else {
      console.log(`[getAnalyticsAction] Missing Meta Token for account: ${accountId}. Falling back to DB.`);
    }

    // 3. Fallback: Retrieve historical snapshot data from Database
    const { data, error } = await getAnalyticsForPeriod(filter);
    
    // Inject reauth warning if account is flagged
    if (data && account.needs_reauth) {
      (data as any).needsReauth = true;
    }

    return { data, error };

  } catch (err: any) {
    console.error(`[getAnalyticsAction] Critical exception:`, err);
    const { data, error } = await getAnalyticsForPeriod(filter);
    return { data, error: error || err.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Legacy support: Calls getAnalyticsAction with filter object.
 */
export async function getAnalyticsActionLegacy(filter: AnalyticsFilter) {
  return getAnalyticsAction(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

/**
 * Triggers a manual sync for an account.
 */
export async function syncAnalyticsAction(accountId: string) {
  const repo = getPlatformAccountRepository();
  const { data: account, error: fetchError } = await repo.findById(accountId);

  if (fetchError || !account) {
    return { success: false, error: fetchError || 'ACCOUNT_NOT_FOUND' };
  }

  // Get tokens
  const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
  const accountWithToken = accountsWithTokens?.find(a => a.id === accountId);

  if (!accountWithToken || !accountWithToken.encryptedToken) {
    return { success: false, error: 'MISSING_META_TOKEN' };
  }

  // Invalidate Redis caches on sync to guarantee fresh data refetch (handles all ranges including custom ranges dynamically)
  if (redisConnection) {
    try {
      // Find all dynamic keys containing the accountId and delete them cleanly
      const freshKeys = await redisConnection.keys(`*live_analytics_fresh:${accountId}*`);
      const periodKeys = await redisConnection.keys(`*live_analytics_period_cache:${accountId}*`);
      const deepKeys = await redisConnection.keys(`*post_deep_analytics_cache*:${accountId}*`);
      const allKeys = [...freshKeys, ...periodKeys, ...deepKeys];
      
      if (allKeys.length > 0) {
        await redisConnection.del(...allKeys);
      }
      
      // Also fallback delete standard keys just in case the keys command is restricted in some environments
      await redisConnection.del(`live_analytics_fresh:${accountId}`);
      await redisConnection.del(`live_analytics_period_cache:${accountId}:7d`);
      await redisConnection.del(`live_analytics_period_cache:${accountId}:30d`);
      await redisConnection.del(`live_analytics_period_cache:${accountId}:90d`);
      await redisConnection.del(`post_deep_analytics_cache_v2:${accountId}:7d`);
      await redisConnection.del(`post_deep_analytics_cache_v2:${accountId}:30d`);
      await redisConnection.del(`post_deep_analytics_cache_v2:${accountId}:90d`);
      
      console.log(`[syncAnalyticsAction] Invalidated all dynamic Redis caches for account: ${accountId}`);
    } catch (redisErr) {
      console.error('[syncAnalyticsAction] Failed to invalidate Redis caches:', redisErr);
    }
  }

  const result = await metaAnalyticsService.syncAccount({
    accountId: account.id,
    externalId: account.externalId,
    platform: account.platform,
    encryptedToken: accountWithToken.encryptedToken,
  });

  return result;
}

/**
 * In-memory helper to calculate top posts from live data.
 */
function getTopPostsFromLive(
  posts: any[],
  range: AnalyticsRange,
  limit = 10,
  customStart?: Date,
  customEnd?: Date,
  sortBy: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows' = 'interactions'
) {
  // Removed date range filtering to provide global/lifetime media ranking
  
  // Map to PostAnalytic structure
  const mapped = posts.map(p => ({
    id: p.id || p.postId,
    accountId: p.accountId,
    postId: p.postId,
    mediaType: p.mediaType,
    caption: p.caption,
    thumbnailUrl: p.thumbnailUrl,
    mediaUrl: p.mediaUrl,
    likeCount: p.likeCount || 0,
    commentsCount: p.commentsCount || 0,
    sharesCount: p.sharesCount || 0,
    savedCount: p.savedCount || 0,
    totalInteractions: p.totalInteractions || 0,
    views: p.views || p.reach || 0,
    reach: p.reach || 0,
    profileVisits: p.profileVisits || 0,
    follows: p.follows || 0,
    igReelsAvgWatchTime: p.igReelsAvgWatchTime || 0,
    igReelsVideoViewTotalTime: p.igReelsVideoViewTotalTime || 0,
    reelsSkipRate: p.reelsSkipRate || 0,
    crosspostedViews: p.crosspostedViews || 0,
    postedAt: new Date(p.postedAt),
    syncedAt: new Date()
  }));

  // Sort
  if (sortBy === 'interactions') {
    mapped.sort((a, b) => b.totalInteractions - a.totalInteractions);
  } else if (sortBy === 'views') {
    mapped.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'reach') {
    mapped.sort((a, b) => b.reach - a.reach);
  } else if (sortBy === 'likes') {
    mapped.sort((a, b) => b.likeCount - a.likeCount);
  } else if (sortBy === 'shares') {
    mapped.sort((a, b) => b.sharesCount - a.sharesCount);
  } else if (sortBy === 'profile_visits') {
    mapped.sort((a, b) => b.profileVisits - a.profileVisits);
  } else if (sortBy === 'follows') {
    mapped.sort((a, b) => b.follows - a.follows);
  }

  return mapped.slice(0, limit);
}

/**
 * In-memory helper to calculate engagement breakdown from live data.
 */
function getEngagementBreakdownFromLive(
  posts: any[],
  range: AnalyticsRange,
  customStart?: Date,
  customEnd?: Date
) {
  let currentEnd = new Date();
  currentEnd.setUTCHours(23, 59, 59, 999);
  let currentStart: Date;

  if (range === 'custom' && customStart && customEnd) {
    currentStart = new Date(customStart);
    currentStart.setUTCHours(0, 0, 0, 0);
    currentEnd = new Date(customEnd);
    currentEnd.setUTCHours(23, 59, 59, 999);
  } else {
    const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
    currentStart = subDays(currentEnd, days - 1);
    currentStart.setUTCHours(0, 0, 0, 0);
  }

  const filtered = posts.filter(p => {
    const pDate = new Date(p.postedAt);
    return pDate >= currentStart && pDate <= currentEnd;
  });

  let likes = 0, comments = 0, shares = 0, saves = 0;
  for (const p of filtered) {
    likes += p.likeCount || 0;
    comments += p.commentsCount || 0;
    shares += p.sharesCount || 0;
    saves += p.savedCount || 0;
  }

  return { likes, comments, shares, saves };
}

/**
 * In-memory helper to calculate post frequency from live data.
 */
function getPostFrequencyFromLive(
  posts: any[],
  range: AnalyticsRange,
  customStart?: Date,
  customEnd?: Date
) {
  let currentEnd = new Date();
  currentEnd.setUTCHours(23, 59, 59, 999);
  let currentStart: Date;

  if (range === 'custom' && customStart && customEnd) {
    currentStart = new Date(customStart);
    currentStart.setUTCHours(0, 0, 0, 0);
    currentEnd = new Date(customEnd);
    currentEnd.setUTCHours(23, 59, 59, 999);
  } else {
    const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
    currentStart = subDays(currentEnd, days - 1);
    currentStart.setUTCHours(0, 0, 0, 0);
  }

  const filtered = posts.filter(p => {
    const pDate = new Date(p.postedAt);
    return pDate >= currentStart && pDate <= currentEnd;
  });

  const frequencyMap = new Map<number, number>();
  for (let i = 0; i <= 6; i++) frequencyMap.set(i, 0);

  filtered.forEach(p => {
    const day = new Date(p.postedAt).getDay(); // 0 is Sunday
    frequencyMap.set(day, (frequencyMap.get(day) || 0) + 1);
  });

  return Array.from(frequencyMap.entries()).map(([dayOfWeek, count]) => ({ dayOfWeek, count }));
}

export async function getTopPostsAction(
  accountId: string, 
  range: AnalyticsRange = '30d', 
  customStart?: Date, 
  customEnd?: Date,
  sortBy: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows' = 'interactions',
  limit: number = 10
) {
  try {
    if (redisConnection) {
      const cached = await redisConnection.get(`live_analytics_cache:${accountId}`);
      if (cached) {
        const liveData = JSON.parse(cached);
        if (liveData.posts) {
          console.log(`[getTopPostsAction] Serving from Redis live cache for account: ${accountId}`);
          const liveTopPosts = getTopPostsFromLive(liveData.posts, range, limit, customStart, customEnd, sortBy);
          return { data: liveTopPosts, error: null };
        }
      }
    }
  } catch (err) {
    console.error(`[getTopPostsAction] Redis cache read failed:`, err);
  }

  // Fallback to database
  return getTopPosts(accountId, range, limit, customStart, customEnd, sortBy);
}

export async function getTopContentAction(
  accountId: string, 
  range: AnalyticsRange = '30d', 
  customStart?: Date, 
  customEnd?: Date
) {
  try {
    if (redisConnection) {
      const cached = await redisConnection.get(`live_analytics_cache:${accountId}`);
      if (cached) {
        const liveData = JSON.parse(cached);
        if (liveData.posts) {
          console.log(`[getTopContentAction] Serving from Redis live cache for account: ${accountId}`);
          const viewsResult = getTopPostsFromLive(liveData.posts, range, 5, customStart, customEnd, 'views');
          const interactionsResult = getTopPostsFromLive(liveData.posts, range, 5, customStart, customEnd, 'interactions');
          
          return {
            topByViews: viewsResult || [],
            topByInteractions: interactionsResult || [],
            error: null
          };
        }
      }
    }
  } catch (err) {
    console.error(`[getTopContentAction] Redis cache read failed:`, err);
  }

  try {
    // Fallback: 1. Try to get from period-specific top posts
    const [viewsResult, interactionsResult] = await Promise.all([
      getTopPosts(accountId, range, 5, customStart, customEnd, 'views'),
      getTopPosts(accountId, range, 5, customStart, customEnd, 'interactions')
    ]);

    if ((viewsResult.data && viewsResult.data.length > 0) || (interactionsResult.data && interactionsResult.data.length > 0)) {
      return {
        topByViews: viewsResult.data || [],
        topByInteractions: interactionsResult.data || [],
        error: null
      };
    }

    // 2. Fallback to global top content from DB if period-specific is empty
    const result = await getTopContentFromDB(accountId);
    return result;
  } catch (error) {
    console.error('[AnalyticsActions] getTopContentAction error:', error);
    return { topByViews: [], topByInteractions: [], error: 'FAILED_TO_GET_TOP_CONTENT' };
  }
}

export async function getEngagementBreakdownAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  try {
    if (redisConnection) {
      const cached = await redisConnection.get(`live_analytics_cache:${accountId}`);
      if (cached) {
        const liveData = JSON.parse(cached);
        if (liveData.posts) {
          console.log(`[getEngagementBreakdownAction] Serving from Redis live cache for account: ${accountId}`);
          const liveBreakdown = getEngagementBreakdownFromLive(liveData.posts, range, customStart, customEnd);
          return { data: liveBreakdown, error: null };
        }
      }
    }
  } catch (err) {
    console.error(`[getEngagementBreakdownAction] Redis cache read failed:`, err);
  }

  // Fallback to database
  const filter: AnalyticsFilter = { accountId, range, customStart, customEnd };
  return getEngagementBreakdown(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

export async function getPostFrequencyAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  try {
    if (redisConnection) {
      const cached = await redisConnection.get(`live_analytics_cache:${accountId}`);
      if (cached) {
        const liveData = JSON.parse(cached);
        if (liveData.posts) {
          console.log(`[getPostFrequencyAction] Serving from Redis live cache for account: ${accountId}`);
          const liveFrequency = getPostFrequencyFromLive(liveData.posts, range, customStart, customEnd);
          return { data: liveFrequency, error: null };
        }
      }
    }
  } catch (err) {
    console.error(`[getPostFrequencyAction] Redis cache read failed:`, err);
  }

  // Fallback to database
  const filter: AnalyticsFilter = { accountId, range, customStart, customEnd };
  return getPostFrequency(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

export async function syncAllAccountsAction() {
  const repo = getPlatformAccountRepository();
  const { data: accountsWithTokens, error } = await repo.findAllWithMetaTokens();

  if (error || !accountsWithTokens) {
    return { success: false, error: error || 'FAILED_TO_FETCH_ACCOUNTS' };
  }

  let successCount = 0;
  for (const account of accountsWithTokens) {
    if (!account.encryptedToken) continue;

    const result = await metaAnalyticsService.syncAccount({
      accountId: account.id,
      externalId: account.externalId,
      platform: account.platform,
      encryptedToken: account.encryptedToken,
    });

    if (result.success) {
      successCount++;
    }
  }

  return { success: true, processed: accountsWithTokens.length, successful: successCount };
}

/**
 * Server Action to fetch detailed follower insights (follows/unfollows and demographics)
 */
export async function getFollowerDetailedAnalyticsAction(
  accountId: string, 
  range: AnalyticsRange = '30d', 
  customStart?: Date, 
  customEnd?: Date
) {
  try {
    const repo = getPlatformAccountRepository();
    const { data: account, error: accountError } = await repo.findById(accountId);
    if (accountError || !account) {
      return { error: 'ACCOUNT_NOT_FOUND' };
    }
    
    if (account.platform !== 'instagram') {
      return { error: 'ONLY_INSTAGRAM_SUPPORTED' };
    }

    // Get Meta Tokens
    const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
    const accountWithToken = accountsWithTokens?.find(a => a.id === accountId);
    
    if (!accountWithToken || !accountWithToken.encryptedToken) {
      return { error: 'MISSING_META_TOKEN' };
    }

    // Calculate start and end date for follows_and_unfollows
    const now = new Date();
    const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    let currentEnd = new Date(Date.UTC(
      localTime.getUTCFullYear(),
      localTime.getUTCMonth(),
      localTime.getUTCDate(),
      23, 59, 59, 999
    ));
    let currentStart: Date;
    
    if (range === 'custom' && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentStart.setUTCHours(0, 0, 0, 0);
      currentEnd = new Date(customEnd);
      currentEnd.setUTCHours(23, 59, 59, 999);
    } else {
      const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setUTCHours(0, 0, 0, 0);
    }

    // Timeframe for demographics
    const timeframe = range === '7d' || range === '14d' ? 'this_week' : 'this_month';

    // Redis Cache Key
    const rangeSuffix = range === 'custom' && customStart && customEnd 
      ? `custom_${new Date(customStart).toISOString().split('T')[0]}_${new Date(customEnd).toISOString().split('T')[0]}`
      : range;
    const cacheKey = `follower_details_cache:${accountId}:${rangeSuffix}`;

    if (redisConnection) {
      try {
        const cached = await redisConnection.get(cacheKey);
        if (cached) {
          console.log(`[getFollowerDetailedAnalyticsAction] Served from Redis cache for account: ${accountId}`);
          return { data: JSON.parse(cached), error: null };
        }
      } catch (cacheErr) {
        console.error('[getFollowerDetailedAnalyticsAction] Redis cache read failed:', cacheErr);
      }
    }

    const result = await metaAnalyticsService.fetchFollowerDetails({
      accountId,
      externalId: account.externalId,
      platform: account.platform,
      encryptedToken: accountWithToken.encryptedToken,
      since: currentStart,
      until: currentEnd,
      timeframe: timeframe as 'this_week' | 'this_month'
    });

    if (result.success) {
      if (redisConnection) {
        try {
          // Cache for 15 minutes
          await redisConnection.set(cacheKey, JSON.stringify(result), 'EX', 900);
        } catch (redisErr) {
          console.error('[getFollowerDetailedAnalyticsAction] Redis cache write failed:', redisErr);
        }
      }
      return { data: result, error: null };
    } else {
      return { error: result.error || 'LIVE_FETCH_FAILED' };
    }

  } catch (err: any) {
    console.error('[getFollowerDetailedAnalyticsAction] Critical error:', err);
    return { error: err.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Server Action to fetch deep post-level analytics.
 * Highly optimized with multi-layer Redis caching.
 */
export async function getPostDeepAnalyticsAction(
  accountId: string, 
  range: AnalyticsRange = '30d', 
  customStart?: Date, 
  customEnd?: Date
) {
  try {
    const rangeSuffix = range === 'custom' && customStart && customEnd 
      ? `custom_${new Date(customStart).toISOString().split('T')[0]}_${new Date(customEnd).toISOString().split('T')[0]}`
      : range;

    const cacheKey = `post_deep_analytics_cache_v2:${accountId}:${rangeSuffix}`;
    
    // 1. Check Redis deep cache first
    if (redisConnection) {
      try {
        const cached = await redisConnection.get(cacheKey);
        if (cached) {
          console.log(`[getPostDeepAnalyticsAction] Served from Redis cache for account: ${accountId}, range: ${rangeSuffix}`);
          return { data: JSON.parse(cached), error: null };
        }
      } catch (cacheErr) {
        console.error('[getPostDeepAnalyticsAction] Redis cache read failed:', cacheErr);
      }
    }

    const now = new Date();
    const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    let currentEnd = new Date(Date.UTC(
      localTime.getUTCFullYear(),
      localTime.getUTCMonth(),
      localTime.getUTCDate(),
      23, 59, 59, 999
    ));
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;
    const isAllTime = range === 'all';

    if (range === 'custom' && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentStart.setUTCHours(0, 0, 0, 0);
      currentEnd = new Date(customEnd);
      currentEnd.setUTCHours(23, 59, 59, 999);
      const diff = differenceInDays(currentEnd, currentStart) + 1;
      previousStart = subDays(currentStart, diff);
      previousStart.setUTCHours(0, 0, 0, 0);
      previousEnd = subDays(currentStart, 1);
      previousEnd.setUTCHours(23, 59, 59, 999);
    } else if (isAllTime) {
      currentStart = new Date(0); // Epoch start to fetch all
      previousStart = new Date(0);
      previousEnd = new Date(0);
    } else {
      const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setUTCHours(0, 0, 0, 0);
      previousStart = subDays(currentStart, days);
      previousStart.setUTCHours(0, 0, 0, 0);
      previousEnd = subDays(currentStart, 1);
      previousEnd.setUTCHours(23, 59, 59, 999);
    }

    // 2. Fallback to Live Redis cache if available
    let postsRaw: any[] = [];
    let snapshotsRaw: any[] = [];
    let prevSnapshotsRaw: any[] = [];
    let hasLiveData = false;

    if (redisConnection) {
      try {
        const liveCached = await redisConnection.get(`live_analytics_cache:${accountId}`);
        if (liveCached) {
          const liveData = JSON.parse(liveCached);
          if (liveData.posts && liveData.snapshots) {
            console.log(`[getPostDeepAnalyticsAction] Serving from Redis live cache data`);
            postsRaw = liveData.posts;
            
            // Map string dates back to Date objects
            snapshotsRaw = liveData.snapshots.map((s: any) => ({ ...s, date: new Date(s.date) }));
            hasLiveData = true;
          }
        }
      } catch (err) {
        console.error('[getPostDeepAnalyticsAction] Live cache check failed:', err);
      }
    }

    // 3. Fallback/Query Database
    if (!hasLiveData) {
      // Query post_analytics (filtered to posts that were posted within the current period)
      const dbPosts = await db.post_analytics.findMany({
        where: {
          account_id: accountId,
          ...(isAllTime ? {} : { posted_at: { gte: currentStart, lte: currentEnd } })
        },
        orderBy: { total_interactions: 'desc' }
      });

      postsRaw = dbPosts.map((p: any) => ({
        id: p.id,
        accountId: p.account_id,
        postId: p.post_id,
        mediaType: p.media_type,
        caption: p.caption,
        thumbnailUrl: p.thumbnail_url,
        mediaUrl: p.media_url,
        likeCount: p.like_count,
        commentsCount: p.comments_count,
        sharesCount: p.shares_count,
        savedCount: p.saved_count,
        totalInteractions: p.total_interactions,
        views: p.views,
        reach: p.reach,
        profileVisits: p.profile_visits || 0,
        follows: p.follows || 0,
        igReelsAvgWatchTime: p.ig_reels_avg_watch_time || 0,
        igReelsVideoViewTotalTime: p.ig_reels_video_view_total_time || 0,
        reelsSkipRate: p.reels_skip_rate || 0,
        crosspostedViews: p.crossposted_views || 0,
        postedAt: p.posted_at,
        syncedAt: p.synced_at
      }));

      // Query current period snapshots
      const dbCurrentSnapshots = await db.analytics_snapshots.findMany({
        where: {
          account_id: accountId,
          ...(isAllTime ? {} : { date: { gte: currentStart, lte: currentEnd } })
        },
        orderBy: { date: 'asc' }
      });

      snapshotsRaw = dbCurrentSnapshots.map((s: any) => ({
        id: s.id,
        accountId: s.account_id,
        date: s.date,
        reach: s.reach,
        impressions: s.impressions,
        engagement: s.engagement,
        followers: s.followers,
        profileVisits: s.profile_visits,
        profileLinksTaps: s.profile_links_taps,
        accountsReached: s.accounts_reached,
        accountsEngaged: s.accounts_engaged,
        followersPct: s.followers_pct,
        nonfollowersPct: s.nonfollowers_pct,
        byContentViews: s.by_content_views,
        byContentInteractions: s.by_content_interactions,
        activeTimes: s.active_times,
        insufficientData: s.insufficient_data,
        createdAt: s.created_at
      }));
    } else {
      // In-memory filter snapshots and posts for current range if loaded from live cache
      if (!isAllTime) {
        snapshotsRaw = snapshotsRaw.filter(s => s.date >= currentStart && s.date <= currentEnd);
        postsRaw = postsRaw.filter(p => {
          const pDate = new Date(p.postedAt);
          return pDate >= currentStart && pDate <= currentEnd;
        });
      }
    }

    // Always query database for previous period snapshots to guarantee PoP calculations
    const dbPrevSnapshots = await db.analytics_snapshots.findMany({
      where: {
        account_id: accountId,
        date: { gte: previousStart, lte: previousEnd }
      },
      orderBy: { date: 'asc' }
    });

    prevSnapshotsRaw = dbPrevSnapshots.map((s: any) => ({
      id: s.id,
      accountId: s.account_id,
      date: s.date,
      reach: s.reach,
      impressions: s.impressions,
      engagement: s.engagement,
      followers: s.followers,
      profileVisits: s.profile_visits,
      profileLinksTaps: s.profile_links_taps,
      accountsReached: s.accounts_reached,
      accountsEngaged: s.accounts_engaged,
      followersPct: s.followers_pct,
      nonfollowersPct: s.nonfollowers_pct,
      byContentViews: s.by_content_views,
      byContentInteractions: s.by_content_interactions,
      activeTimes: s.active_times,
      insufficientData: s.insufficient_data,
      createdAt: s.created_at
    }));

    // 4. Run Post Deep Analytics Engine
    const deepAnalytics = buildDeepAnalytics(postsRaw, snapshotsRaw, prevSnapshotsRaw);

    // 5. Cache result in Redis (TTL: 15 minutes = 900 seconds)
    if (redisConnection) {
      try {
        await redisConnection.set(cacheKey, JSON.stringify(deepAnalytics), 'EX', 900);
      } catch (redisErr) {
        console.error('[getPostDeepAnalyticsAction] Redis cache write failed:', redisErr);
      }
    }

    return { data: deepAnalytics, error: null };

  } catch (err: any) {
    console.error('[getPostDeepAnalyticsAction] Critical error in Server Action:', err);
    return { data: null, error: err.message || 'FAILED_TO_GET_POST_DEEP_ANALYTICS' };
  }
}

export async function generatePerformanceInsightAction(
  params: {
    platform: Platform;
    viewMode: ViewMode;
    // reach mode
    avgReach?: number;
    avgEngagement?: number;
    avgEngagementRate?: number;
    // views mode
    avgViews?: number;
    avgInteractions?: number;
    avgInteractionRate?: number;
  }
): Promise<{ content: PerformanceInsight | null; modelUsed?: string; error: string | null }> {
  const {
    platform,
    viewMode,
    avgReach,
    avgEngagement,
    avgEngagementRate,
    avgViews,
    avgInteractions,
    avgInteractionRate,
  } = params;

  const isReachMode = viewMode === 'reach';
  
  // Validate trước — không gọi AI nếu data rỗng hoặc bằng 0
  const rate = isReachMode ? (avgEngagementRate ?? 0) : (avgInteractionRate ?? 0);
  if (!rate) {
    return { content: null, error: 'INSUFFICIENT_DATA' };
  }

  const ratingLabel = getRatingLabel(rate, platform, isReachMode ? 'reach' : 'views');
  const ratingKey = getRatingKey(rate, platform, isReachMode ? 'reach' : 'views');
  const platformCtx = PLATFORM_CONTEXT[platform] || platform;

  // Few-shot: skeleton nhỏ gọn có nội dung sâu sắc, inject platform động
  const fewShotExample = isReachMode
    ? `Ví dụ (${platform}):
Input: Reach 4500/ngày, Engagement 180/ngày, Rate 4.0% → tốt (>${PLATFORM_BENCHMARKS[platform]?.reach.good || 0}%)
Output: {
  "rating": "good",
  "evaluation": "Engagement rate 4.0% vượt chuẩn ${platform} (${PLATFORM_BENCHMARKS[platform]?.reach.good || 0}%), cho thấy nội dung đang đi đúng hướng nhưng vẫn còn khoảng cách để đạt top tier (>${PLATFORM_BENCHMARKS[platform]?.reach.excellent || 0}%).",
  "cause": "Trên ${platform}, thuật toán phân phối ưu tiên giữ chân người dùng lâu kết hợp với hành động thả tim và bình luận tự nhiên giải thích trực tiếp cho mức rate 4.0% này.",
  "expectation": "Với rate hiện tại 4.0% so với chuẩn của ${platform}, kỳ vọng rate tăng lên 4.5% trong 2 tuần tới nếu tiếp tục duy trì đà tối ưu chất lượng tương tác."
}`
    : `Ví dụ (${platform}):
Input: Views 12000/ngày, Interactions 480/ngày, Rate 4.0% → tốt (>${PLATFORM_BENCHMARKS[platform]?.views.good || 0}%)
Output: {
  "rating": "good",
  "evaluation": "Interaction rate 4.0% vượt chuẩn ${platform} (${PLATFORM_BENCHMARKS[platform]?.views.good || 0}%), tuy nhiên với lượng hiển thị lớn, số lượng tương tác tuyệt đối cho thấy người dùng vẫn lướt qua khá nhiều.",
  "cause": "Thuật toán ${platform} phân phối đề xuất mạnh dựa trên lượt xem hết 3 giây đầu khiến lượng view tăng vọt nhưng thiếu CTA giữ chân trực tiếp ở cuối giải thích tại sao tỷ lệ tương tác chỉ ở mức 4.0%.",
  "expectation": "Dựa trên rate hiện tại 4.0% và ngưỡng chuẩn, dự phóng tỷ lệ tương tác kỳ vọng đạt 5.5% trong 2 tuần tới nếu giữ đà giữ chân người xem ở 3 giây cuối."
}`;

  const systemPrompt = [
    `Bạn là AI Analyst chuyên social media, đặc biệt ${platformCtx}.`,
    'Trả về CHỈ JSON hợp lệ, không markdown, không text ngoài JSON.',
    'Schema: {"rating":"excellent|good|average|weak","evaluation":"...","cause":"...","expectation":"..."}',
    'Mỗi field viết phân tích cực kỳ sắc bén, giàu chuyên môn và đi thẳng vào số liệu thực tế, không viết chung chung sơ sài.',
    '"evaluation": 1-2 câu, dùng số % thực + so ngưỡng chuẩn.',
    '"cause": 1 câu, nêu đúng 1 cơ chế thuật toán hoặc hành vi người dùng đặc thù của ' + platformCtx + ' giải thích trực tiếp tại sao rate đạt mức ' + rate + '% — phải gắn với con số thực tế, KHÔNG nêu giải pháp.',
    '"expectation": 1 câu, dựa trên rate hiện tại ' + rate + '% và ngưỡng chuẩn của ' + platformCtx + ', dự phóng rate kỳ vọng đạt được trong 2 tuần tới nếu duy trì đà — nêu con số % cụ thể.',
    'Mọi string trên 1 dòng duy nhất. Dùng single quote bên trong text thay vì double quote.',
    'KHÔNG dùng: "đi đúng hướng", "sức hút nhất định", "tiếp tục phát huy", "Nhìn vào số liệu", "Có thể thấy rằng".',
  ].join(' ');

  const userPrompt = isReachMode
    ? `${fewShotExample}
---
Phân tích:
- Reach: ${avgReach || 0}/ngày | Engagement: ${avgEngagement || 0}/ngày | Rate: ${avgEngagementRate || 0}% → ${ratingLabel}`
    : `${fewShotExample}
---
Phân tích:
- Views: ${avgViews || 0}/ngày | Interactions: ${avgInteractions || 0}/ngày | Rate: ${avgInteractionRate || 0}% → ${ratingLabel}`;

  try {
    let data: any = null;
    let error: any = null;
    let modelUsed: string = AI_AGENT_DEFAULTS.MODEL_FAST_REASONING;

    console.log('[generatePerformanceInsightAction] Attempting with MODEL_FAST_REASONING:', AI_AGENT_DEFAULTS.MODEL_FAST_REASONING);
    const res = await groqClient.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: AI_AGENT_DEFAULTS.MODEL_FAST_REASONING,
        temperature: 0.3,
        maxTokens: 500,
      }
    );
    data = res.data;
    error = res.error;

    if (error || !data) {
      console.warn('[generatePerformanceInsightAction] Fast reasoning model failed, falling back to MODEL_DEFAULT:', error || 'No data from fast model');
      const fallbackRes = await groqClient.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: AI_AGENT_DEFAULTS.MODEL_DEFAULT,
          temperature: 0.3,
          maxTokens: 500,
        }
      );
      modelUsed = AI_AGENT_DEFAULTS.MODEL_DEFAULT;
      data = fallbackRes.data;
      error = fallbackRes.error;

      if (error || !data) {
        console.error('[generatePerformanceInsightAction] Both models failed. Error:', error || 'Empty response from default model');
        return { content: null, error: error || 'Empty response from AI models' };
      }
    }

    // Parse JSON siêu an toàn (Robust JSON Parser)
    const rawContent = data.content.replace(/```json|```/g, '').trim();
    
    // Tự động thay thế các ký tự xuống dòng thực tế bên trong chuỗi JSON bằng \n
    let inString = false;
    let escaped = false;
    let cleanRaw = '';
    
    for (let i = 0; i < rawContent.length; i++) {
      const char = rawContent[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (inString) {
        if (char === '\n') {
          cleanRaw += '\\n';
        } else if (char === '\r') {
          cleanRaw += '\\r';
        } else {
          cleanRaw += char;
        }
      } else {
        cleanRaw += char;
      }
      if (char === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
    }
    
    const parsed: PerformanceInsight = JSON.parse(cleanRaw);

    // Fallback rating từ benchmark phòng model trả sai
    parsed.rating = ratingKey;

    return { content: parsed, modelUsed, error: null };
  } catch (err: any) {
    console.error('[generatePerformanceInsightAction] Error:', err);
    return { content: null, error: err.message || 'FAILED_TO_GENERATE_AI_INSIGHT' };
  }
}

export async function generateFollowersInsightAction(
  params: {
    platform: Platform;
    totalFollows: number;
    totalUnfollows: number;
    netGrowth: number;
    range: string;
  }
): Promise<{ content: PerformanceInsight | null; modelUsed?: string; error: string | null }> {
  const { platform, totalFollows, totalUnfollows, netGrowth, range } = params;

  if (totalFollows === 0 && totalUnfollows === 0) {
    return { content: null, error: 'INSUFFICIENT_DATA' };
  }

  let ratingKey: 'excellent' | 'good' | 'average' | 'weak' = 'average';
  const ratio = totalFollows / (totalUnfollows || 1);
  if (netGrowth < 0) {
    ratingKey = 'weak';
  } else if (netGrowth === 0) {
    ratingKey = 'average';
  } else {
    if (ratio >= 3) {
      ratingKey = 'excellent';
    } else if (ratio >= 1.5) {
      ratingKey = 'good';
    } else {
      ratingKey = 'average';
    }
  }

  const ratingLabel = 
    ratingKey === 'excellent' ? 'Xuất sắc (Tỷ lệ follow/unfollow rất cao, tăng trưởng ròng mạnh mẽ)' :
    ratingKey === 'good' ? 'Tốt (Tăng trưởng ổn định, số lượng unfollow ở mức thấp)' :
    ratingKey === 'average' ? 'Trung bình (Follow và unfollow bám sát nhau, tăng trưởng chậm)' :
    'Yếu (Bị bỏ theo dõi nhiều hơn theo dõi mới, tăng trưởng âm)';

  const platformCtx = PLATFORM_CONTEXT[platform] || platform;
  const rangeInDays = isNaN(parseInt(range)) ? 30 : (parseInt(range) || 30);
  const dailyGrowth = (netGrowth / rangeInDays).toFixed(1);

  const systemPrompt = [
    `Bạn là AI Analyst chuyên phân tích biến động followers trên ${platformCtx}.`,
    'Trả về CHỈ JSON hợp lệ, không markdown, không text ngoài JSON.',
    'Schema: {"rating":"excellent|good|average|weak","evaluation":"...","expectation":"..."}',
    `"evaluation": 2 câu. Câu 1: nhận định chất lượng tăng trưởng — tỷ lệ ${ratio.toFixed(2)}x và tăng trưởng ròng ${netGrowth} nói lên điều gì cụ thể về sức hút của tài khoản, dùng tính từ mức độ rõ ràng (mạnh/ổn định/yếu). Câu 2: tốc độ tăng trưởng ròng trung bình là ${dailyGrowth} followers/ngày — nhận định tốc độ tăng trưởng ròng đang ở mức nào, kết hợp với tỷ lệ rời bỏ ${totalFollows > 0 ? ((totalUnfollows / totalFollows) * 100).toFixed(1) : '0.0'}% phản ánh độ bền tăng trưởng; nếu có giai đoạn đột biến follows hoặc unfollows vượt đáng kể so với mức trung bình ngày thì chỉ ra biên độ cụ thể.`,
    `"expectation": 1 câu, dựa trên tốc độ tăng trưởng ròng hiện tại ${dailyGrowth} followers/ngày và tỷ lệ follow/unfollow ${ratio.toFixed(2)}x, dự phóng tăng trưởng ròng kỳ vọng trong 30 ngày tới nếu duy trì đà hiện tại — nêu con số cụ thể và điều kiện để đạt được mức cao hơn.`,
    'Mọi string trên 1 dòng duy nhất. Dùng single quote bên trong text.',
    'KHÔNG dùng: "đi đúng hướng", "sức hút nhất định", "tiếp tục phát huy", "Nhìn vào số liệu", "Có thể thấy rằng", "nên tiếp tục".',
  ].join(' ');

  const userPrompt = `
Phân tích biến động Followers của tài khoản trên ${platform}:
- Thời gian: ${range}
- Tổng Follows mới: ${totalFollows}
- Tổng Unfollows: ${totalUnfollows}
- Tăng trưởng ròng: ${netGrowth}
- Tỷ lệ Follow/Unfollow: ${ratio.toFixed(2)}x
- Đánh giá sơ bộ: ${ratingLabel}
`;

  try {
    let data: any = null;
    let error: any = null;
    let modelUsed: string = AI_AGENT_DEFAULTS.MODEL_FAST_REASONING;

    console.log('[generateFollowersInsightAction] Attempting with MODEL_FAST_REASONING:', AI_AGENT_DEFAULTS.MODEL_FAST_REASONING);
    const res = await groqClient.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: AI_AGENT_DEFAULTS.MODEL_FAST_REASONING,
        temperature: 0.3,
        maxTokens: 500,
      }
    );
    data = res.data;
    error = res.error;

    if (error || !data) {
      console.warn('[generateFollowersInsightAction] Fast reasoning model failed, falling back to MODEL_DEFAULT:', error || 'No data from fast model');
      const fallbackRes = await groqClient.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: AI_AGENT_DEFAULTS.MODEL_DEFAULT,
          temperature: 0.3,
          maxTokens: 500,
        }
      );
      modelUsed = AI_AGENT_DEFAULTS.MODEL_DEFAULT;
      data = fallbackRes.data;
      error = fallbackRes.error;

      if (error || !data) {
        console.error('[generateFollowersInsightAction] Both models failed. Error:', error || 'Empty response from default model');
        return { content: null, error: error || 'Empty response from AI models' };
      }
    }

    const rawContent = data.content.replace(/```json|```/g, '').trim();
    
    // Parse JSON an toàn
    let inString = false;
    let escaped = false;
    let cleanRaw = '';
    
    for (let i = 0; i < rawContent.length; i++) {
      const char = rawContent[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (inString) {
        if (char === '\n') {
          cleanRaw += '\\n';
        } else if (char === '\r') {
          cleanRaw += '\\r';
        } else {
          cleanRaw += char;
        }
      } else {
        cleanRaw += char;
      }
      if (char === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
    }
    
    const parsed: PerformanceInsight = JSON.parse(cleanRaw);
    parsed.rating = ratingKey;

    return { content: parsed, modelUsed, error: null };
  } catch (err: any) {
    console.error('[generateFollowersInsightAction] Error:', err);
    return { content: null, error: err.message || 'FAILED_TO_GENERATE_AI_INSIGHT' };
  }
}


