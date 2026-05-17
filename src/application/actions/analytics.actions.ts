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
} from '@/infrastructure/repositories/analytics.repository';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { metaAnalyticsService } from '../services/meta-analytics.service';
import { AnalyticsFilter, AnalyticsRange } from '@/domain/types/analytics';
import { subDays, differenceInDays } from 'date-fns';

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
    let currentEnd = new Date();
    currentEnd.setUTCHours(23, 59, 59, 999);
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
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setUTCHours(0, 0, 0, 0);
      previousStart = subDays(currentStart, days);
      previousStart.setUTCHours(0, 0, 0, 0);
    }

    // 2. If encryptedToken is available, fetch Live Analytics from Meta API
    let skipLiveFetch = false;
    if (redisConnection && accountWithToken?.encryptedToken) {
      try {
        const isFresh = await redisConnection.get(`live_analytics_fresh:${accountId}`);
        if (isFresh === 'true') {
          console.log(`[getAnalyticsAction] DB cache is fresh (Redis key exists). Skipping live fetch for account: ${accountId}`);
          skipLiveFetch = true;
        }
      } catch (err) {
        console.error('[getAnalyticsAction] Failed to check Redis fresh indicator:', err);
      }
    }

    if (accountWithToken?.encryptedToken && !skipLiveFetch) {
      console.log(`[getAnalyticsAction] Found Meta Token. Fetching Live Analytics from ${previousStart.toISOString()} to ${currentEnd.toISOString()}`);
      
      const liveResult = await metaAnalyticsService.fetchLiveAnalytics({
        accountId: account.id,
        externalId: account.externalId,
        platform: account.platform,
        encryptedToken: accountWithToken.encryptedToken,
        since: previousStart,
        until: currentEnd
      });

      if (liveResult.success && liveResult.snapshots) {
        console.log(`[getAnalyticsAction] Live fetch succeeded with ${liveResult.snapshots.length} snapshots and ${liveResult.posts?.length || 0} posts.`);

        // Set Redis fresh indicator key to prevent constant API calling on F5/tab changes (TTL: 15 minutes = 900 seconds)
        if (redisConnection) {
          redisConnection.set(`live_analytics_fresh:${accountId}`, 'true', 'EX', 900)
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
            impressions: p.impressions,
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

        // Map live data into the required PoP PeriodData structure in-memory
        const periodData = mapLiveAnalyticsToPeriodData({
          snapshots: liveResult.snapshots,
          posts: liveResult.posts || [],
          filter,
          chunkUniqueReaches: liveResult.chunkUniqueReaches
        });

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
  sortBy: 'views' | 'interactions' = 'interactions'
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
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    currentStart = subDays(currentEnd, days - 1);
    currentStart.setUTCHours(0, 0, 0, 0);
  }

  // Filter posts in current period
  const filtered = posts.filter(p => {
    const pDate = new Date(p.postedAt);
    return pDate >= currentStart && pDate <= currentEnd;
  });

  // Map to PostAnalytic structure
  const mapped = filtered.map(p => ({
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
    impressions: p.impressions || p.reach || 0,
    postedAt: new Date(p.postedAt),
    syncedAt: new Date()
  }));

  // Sort
  if (sortBy === 'interactions') {
    mapped.sort((a, b) => b.totalInteractions - a.totalInteractions);
  } else {
    mapped.sort((a, b) => b.views - a.views);
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
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
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
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
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
  sortBy: 'views' | 'interactions' = 'interactions'
) {
  try {
    if (redisConnection) {
      const cached = await redisConnection.get(`live_analytics_cache:${accountId}`);
      if (cached) {
        const liveData = JSON.parse(cached);
        if (liveData.posts) {
          console.log(`[getTopPostsAction] Serving from Redis live cache for account: ${accountId}`);
          const liveTopPosts = getTopPostsFromLive(liveData.posts, range, 10, customStart, customEnd, sortBy);
          return { data: liveTopPosts, error: null };
        }
      }
    }
  } catch (err) {
    console.error(`[getTopPostsAction] Redis cache read failed:`, err);
  }

  // Fallback to database
  return getTopPosts(accountId, range, 10, customStart, customEnd, sortBy);
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
