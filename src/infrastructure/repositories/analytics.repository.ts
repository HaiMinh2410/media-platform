import { db } from '@/lib/db';
import type { AnalyticsSnapshot, UpsertSnapshotInput, AnalyticsFilter, AnalyticsPeriodData, PostAnalytic } from '@/domain/types/analytics';
import { subDays, differenceInDays } from 'date-fns';

/**
 * Upserts a daily analytics snapshot for a platform account.
 * Uses a compound unique constraint [account_id, date].
 */
export async function upsertAnalyticsSnapshot(input: UpsertSnapshotInput): Promise<{ data: AnalyticsSnapshot | null; error: string | null }> {
  try {
    const data = await db.analytics_snapshots.upsert({
      where: {
        account_id_date: {
          account_id: input.accountId,
          date: input.date,
        },
      },
      create: {
        account_id: input.accountId,
        date: input.date,
        reach: input.reach,
        impressions: input.impressions,
        engagement: input.engagement,
        followers: input.followers,
        profile_visits: input.profileVisits,
        profile_links_taps: input.profileLinksTaps,
        accounts_reached: input.accountsReached,
        accounts_engaged: input.accountsEngaged,
        followers_pct: input.followersPct,
        nonfollowers_pct: input.nonfollowersPct,
        by_content_views: input.byContentViews as any,
        by_content_interactions: input.byContentInteractions as any,
        active_times: input.activeTimes as any,
        insufficient_data: input.insufficientData ?? false,
      } as any,
      update: {
        reach: input.reach,
        impressions: input.impressions,
        engagement: input.engagement,
        followers: input.followers,
        profile_visits: input.profileVisits,
        profile_links_taps: input.profileLinksTaps,
        accounts_reached: input.accountsReached,
        accounts_engaged: input.accountsEngaged,
        followers_pct: input.followersPct,
        nonfollowers_pct: input.nonfollowersPct,
        by_content_views: input.byContentViews as any,
        by_content_interactions: input.byContentInteractions as any,
        active_times: input.activeTimes as any,
        insufficient_data: input.insufficientData ?? false,
      } as any,
    });

    return {
      data: {
        id: data.id,
        accountId: data.account_id,
        date: data.date,
        reach: data.reach,
        impressions: data.impressions,
        engagement: data.engagement,
        followers: data.followers,
        profileVisits: data.profile_visits,
        profileLinksTaps: data.profile_links_taps,
        accountsReached: data.accounts_reached,
        accountsEngaged: data.accounts_engaged,
        followersPct: data.followers_pct,
        nonfollowersPct: data.nonfollowers_pct,
        byContentViews: data.by_content_views as any,
        byContentInteractions: data.by_content_interactions as any,
        activeTimes: data.active_times as any,
        insufficientData: data.insufficient_data,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('[AnalyticsRepository] upsert error:', error);
    return { data: null, error: 'FAILED_TO_UPSERT_ANALYTICS' };
  }
}

/**
 * Retrieves analytics for two consecutive periods (current vs previous).
 */
export async function getAnalyticsForPeriod(filter: AnalyticsFilter): Promise<{ data: AnalyticsPeriodData | null; error: string | null }> {
  try {
    const { accountId, range, customStart, customEnd } = filter;
    
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
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setUTCHours(0, 0, 0, 0);
      previousStart = subDays(currentStart, days);
      previousStart.setUTCHours(0, 0, 0, 0);
      previousEnd = subDays(currentStart, 1);
      previousEnd.setUTCHours(23, 59, 59, 999);
    }

    // Fetch both periods in one query
    const allSnapshots = await db.analytics_snapshots.findMany({
      where: {
        account_id: accountId,
        date: {
          gte: previousStart,
          lte: currentEnd,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const mapped = allSnapshots.map(s => ({
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
      byContentViews: s.by_content_views as any,
      byContentInteractions: s.by_content_interactions as any,
      activeTimes: s.active_times as any,
      insufficientData: s.insufficient_data,
      createdAt: s.created_at,
    }));

    // Fetch post-level aggregates for both periods
    const [currentPostAgg, previousPostAgg, currentPosts, previousPosts] = await Promise.all([
      db.post_analytics.aggregate({
        where: { account_id: accountId, posted_at: { gte: currentStart, lte: currentEnd } },
        _sum: { reach: true, impressions: true, like_count: true, comments_count: true, shares_count: true, saved_count: true }
      }),
      db.post_analytics.aggregate({
        where: { account_id: accountId, posted_at: { gte: previousStart, lte: previousEnd } },
        _sum: { reach: true, impressions: true, like_count: true, comments_count: true, shares_count: true, saved_count: true }
      }),
      db.post_analytics.findMany({
        where: { account_id: accountId, posted_at: { gte: currentStart, lte: currentEnd } },
        select: { media_type: true, like_count: true, comments_count: true, shares_count: true, saved_count: true, views: true, reach: true }
      }),
      db.post_analytics.findMany({
        where: { account_id: accountId, posted_at: { gte: previousStart, lte: previousEnd } },
        select: { media_type: true, like_count: true, comments_count: true, shares_count: true, saved_count: true, views: true, reach: true }
      })
    ]);

    const getEng = (agg: any) => (agg._sum.like_count || 0) + (agg._sum.comments_count || 0) + (agg._sum.shares_count || 0) + (agg._sum.saved_count || 0);

    const getBreakdown = (postsList: any[]) => {
      let postInt = 0, reelInt = 0, storyInt = 0;
      let postViews = 0, reelViews = 0, storyViews = 0;
      for (const post of postsList) {
        const totalInt = (post.like_count || 0) + (post.comments_count || 0) + (post.shares_count || 0) + (post.saved_count || 0);
        const totalViews = post.views || post.reach || 0;
        const mediaType = post.media_type?.toUpperCase() || '';
        if (mediaType === 'IMAGE' || mediaType === 'CAROUSEL_ALBUM') {
          postInt += totalInt;
          postViews += totalViews;
        } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
          reelInt += totalInt;
          reelViews += totalViews;
        } else if (mediaType === 'STORY' || mediaType === 'STORIES') {
          storyInt += totalInt;
          storyViews += totalViews;
        }
      }
      const totalIntSum = postInt + reelInt + storyInt;
      const getIntPct = (val: number) => totalIntSum > 0 ? Number((val / totalIntSum * 100).toFixed(4)) : 0;
      
      const totalViewsSum = postViews + reelViews + storyViews;
      const getViewsPct = (val: number) => totalViewsSum > 0 ? Number((val / totalViewsSum * 100).toFixed(4)) : 0;

      return {
        interactions: {
          posts: getIntPct(postInt),
          reels: getIntPct(reelInt),
          stories: getIntPct(storyInt)
        },
        views: {
          posts: getViewsPct(postViews),
          reels: getViewsPct(reelViews),
          stories: getViewsPct(storyViews)
        }
      };
    };

    const currentPostBreakdown = getBreakdown(currentPosts);
    const previousPostBreakdown = getBreakdown(previousPosts);

    // Split snapshots into current and previous periods
    const current = mapped.filter(s => s.date >= currentStart && s.date <= currentEnd);
    const previous = mapped.filter(s => s.date >= previousStart && s.date <= previousEnd);

    // Calculate followersPct and nonfollowersPct for the current period
    const currentSnapshotsWithFollowers = current.filter(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
    );

    let followersPct = 0;
    let nonfollowersPct = 0;

    if (currentSnapshotsWithFollowers.length > 0) {
      let totalReachWeight = 0;
      let sumFollowersPct = 0;

      currentSnapshotsWithFollowers.forEach((s: any) => {
        const dailyReach = s.reach || s.accountsReached || 0;
        const weight = dailyReach > 0 ? dailyReach : 1;

        totalReachWeight += weight;
        sumFollowersPct += (s.followersPct || 0) * weight;
      });

      if (totalReachWeight > 0) {
        followersPct = Math.round(sumFollowersPct / totalReachWeight);
        nonfollowersPct = 100 - followersPct;
      }
    } else {
      // Fallback: Use latest snapshot with advanced data if available
      const latestWithAdvanced = [...current].reverse().find(
        (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
      );
      if (latestWithAdvanced) {
        followersPct = latestWithAdvanced.followersPct || 0;
        nonfollowersPct = latestWithAdvanced.nonfollowersPct || 0;
      }
    }

    // Ensure we normalize to exactly 100% if we have any data
    if (followersPct > 0 || nonfollowersPct > 0) {
      const sum = followersPct + nonfollowersPct;
      if (sum > 0) {
        followersPct = Math.round((followersPct / sum) * 100);
        nonfollowersPct = 100 - followersPct;
      }
    }

    return {
      data: {
        current,
        previous,
        currentPostTotals: {
          reach: currentPostAgg._sum.reach || 0,
          impressions: currentPostAgg._sum.impressions || 0,
          engagement: getEng(currentPostAgg),
          byContentInteractions: currentPostBreakdown.interactions,
          byContentViews: currentPostBreakdown.views,
        },
        previousPostTotals: {
          reach: previousPostAgg._sum.reach || 0,
          impressions: previousPostAgg._sum.impressions || 0,
          engagement: getEng(previousPostAgg),
          byContentInteractions: previousPostBreakdown.interactions,
          byContentViews: previousPostBreakdown.views,
        },
        range,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
        followersPct: followersPct > 0 || nonfollowersPct > 0 ? followersPct : undefined,
        nonfollowersPct: followersPct > 0 || nonfollowersPct > 0 ? nonfollowersPct : undefined
      },
      error: null,
    };
  } catch (error) {
    console.error('[AnalyticsRepository] getAnalyticsForPeriod error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_ANALYTICS' };
  }
}

/**
 * Legacy support: Retrieves analytics history (now just calls getAnalyticsForPeriod).
 */
export async function getAnalyticsHistory(filter: AnalyticsFilter) {
  return getAnalyticsForPeriod(filter);
}

export async function upsertPostAnalytics(accountId: string, post: Omit<PostAnalytic, 'id' | 'accountId' | 'syncedAt'>): Promise<void> {
  try {
    await db.post_analytics.upsert({
      where: {
        account_id_post_id: {
          account_id: accountId,
          post_id: post.postId,
        },
      },
      create: {
        account_id: accountId,
        post_id: post.postId,
        media_type: post.mediaType,
        caption: post.caption,
        thumbnail_url: post.thumbnailUrl,
        media_url: post.mediaUrl,
        like_count: post.likeCount,
        comments_count: post.commentsCount,
        shares_count: post.sharesCount,
        saved_count: post.savedCount,
        total_interactions: post.totalInteractions,
        views: post.views,
        reach: post.reach,
        impressions: post.impressions,
        profile_visits: post.profileVisits ?? 0,
        follows: post.follows ?? 0,
        posted_at: post.postedAt,
        synced_at: new Date(),
      } as any,
      update: {
        media_type: post.mediaType,
        caption: post.caption,
        thumbnail_url: post.thumbnailUrl,
        media_url: post.mediaUrl,
        like_count: post.likeCount,
        comments_count: post.commentsCount,
        shares_count: post.sharesCount,
        saved_count: post.savedCount,
        total_interactions: post.totalInteractions,
        views: post.views,
        reach: post.reach,
        impressions: post.impressions,
        profile_visits: post.profileVisits ?? 0,
        follows: post.follows ?? 0,
        synced_at: new Date(),
      } as any,
    });
  } catch (error) {
    console.error('[AnalyticsRepository] upsertPostAnalytics error:', error);
  }
}

export async function getTopPosts(
  accountId: string, 
  range: AnalyticsFilter['range'], 
  limit = 10, 
  customStart?: Date, 
  customEnd?: Date,
  sortBy: 'views' | 'interactions' | 'reach' | 'likes' | 'profile_visits' | 'follows' = 'interactions'
): Promise<{ data: PostAnalytic[] | null; error: string | null }> {
  try {
    let orderBy: any = { total_interactions: 'desc' as const };
    if (sortBy === 'views') {
      orderBy = { views: 'desc' as const };
    } else if (sortBy === 'reach') {
      orderBy = { reach: 'desc' as const };
    } else if (sortBy === 'likes') {
      orderBy = { like_count: 'desc' as const };
    } else if (sortBy === 'profile_visits') {
      orderBy = { profile_visits: 'desc' as const };
    } else if (sortBy === 'follows') {
      orderBy = { follows: 'desc' as const };
    }

    // Removed the date range filter on posted_at to provide global/lifetime media ranking
    const posts = await db.post_analytics.findMany({
      where: {
        account_id: accountId,
      },
      orderBy,
      take: limit,
    });

    const mapped = posts.map(p => ({
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
      impressions: p.impressions,
      profileVisits: p.profile_visits || 0,
      follows: p.follows || 0,
      postedAt: p.posted_at,
      syncedAt: p.synced_at,
    }));

    if (sortBy === 'interactions') {
      mapped.sort((a, b) => b.totalInteractions - a.totalInteractions);
    } else if (sortBy === 'views') {
      mapped.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'reach') {
      mapped.sort((a, b) => b.reach - a.reach);
    } else if (sortBy === 'likes') {
      mapped.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortBy === 'profile_visits') {
      mapped.sort((a, b) => b.profileVisits - a.profileVisits);
    } else if (sortBy === 'follows') {
      mapped.sort((a, b) => b.follows - a.follows);
    }

    return { data: mapped.slice(0, limit), error: null };
  } catch (error) {
    console.error('[AnalyticsRepository] getTopPosts error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_TOP_POSTS' };
  }
}

export async function getTopContentFromDB(accountId: string): Promise<{ topByViews: PostAnalytic[]; topByInteractions: PostAnalytic[]; error: string | null }> {
  try {
    const [viewsPosts, interactionsPosts] = await Promise.all([
      db.post_analytics.findMany({
        where: { account_id: accountId },
        orderBy: { views: 'desc' },
        take: 5,
      }),
      db.post_analytics.findMany({
        where: { account_id: accountId },
        orderBy: { total_interactions: 'desc' },
        take: 5,
      })
    ]);

    const mapPost = (p: any): PostAnalytic => ({
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
      impressions: p.impressions,
      profileVisits: p.profile_visits || 0,
      follows: p.follows || 0,
      postedAt: p.posted_at,
      syncedAt: p.synced_at,
    });

    return {
      topByViews: viewsPosts.map(mapPost),
      topByInteractions: interactionsPosts.map(mapPost),
      error: null
    };
  } catch (error) {
    console.error('[AnalyticsRepository] getTopContentFromDB error:', error);
    return { topByViews: [], topByInteractions: [], error: 'FAILED_TO_FETCH_TOP_CONTENT' };
  }
}

export async function getEngagementBreakdown(accountId: string, range: AnalyticsFilter['range'], customStart?: Date, customEnd?: Date): Promise<{ data: { likes: number; comments: number; shares: number; saves: number } | null; error: string | null }> {
  try {
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

    const result = await db.post_analytics.aggregate({
      where: {
        account_id: accountId,
        posted_at: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      _sum: {
        like_count: true,
        comments_count: true,
        shares_count: true,
        saved_count: true,
      },
    });

    return {
      data: {
        likes: result._sum.like_count || 0,
        comments: result._sum.comments_count || 0,
        shares: result._sum.shares_count || 0,
        saves: result._sum.saved_count || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('[AnalyticsRepository] getEngagementBreakdown error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_ENGAGEMENT_BREAKDOWN' };
  }
}

export async function getPostFrequency(accountId: string, range: AnalyticsFilter['range'], customStart?: Date, customEnd?: Date): Promise<{ data: { dayOfWeek: number; count: number }[] | null; error: string | null }> {
  try {
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

    const posts = await db.post_analytics.findMany({
      where: {
        account_id: accountId,
        posted_at: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      select: {
        posted_at: true,
      },
    });

    const frequencyMap = new Map<number, number>();
    for (let i = 0; i <= 6; i++) frequencyMap.set(i, 0);

    posts.forEach(p => {
      const day = p.posted_at.getDay(); // 0 is Sunday
      frequencyMap.set(day, (frequencyMap.get(day) || 0) + 1);
    });

    const data = Array.from(frequencyMap.entries()).map(([dayOfWeek, count]) => ({ dayOfWeek, count }));

    return { data, error: null };
  } catch (error) {
    console.error('[AnalyticsRepository] getPostFrequency error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_POST_FREQUENCY' };
  }
}
export async function createSyncLog(params: {
  accountId?: string;
  service: string;
  status: 'success' | 'failed' | 'rate_limited';
  errorMessage?: string;
  errorCode?: string;
}) {
  try {
    await db.sync_logs.create({
      data: {
        account_id: params.accountId,
        service: params.service,
        status: params.status,
        error_message: params.errorMessage,
        error_code: params.errorCode,
      },
    });
  } catch (error) {
    console.error('[AnalyticsRepository] createSyncLog error:', error);
  }
}

/**
 * Maps live analytics snapshots and posts from Meta API into Period-over-Period structure.
 * Completely replicates getAnalyticsForPeriod algorithm in-memory.
 */
export function mapLiveAnalyticsToPeriodData(params: {
  snapshots: any[];
  posts: any[];
  filter: AnalyticsFilter;
  chunkUniqueReaches?: number[];
  chunkUniqueViews?: number[];
  chunkUniqueAccountsEngaged?: number[];
  chunkUniqueInteractions?: number[];
}): AnalyticsPeriodData {
  const { snapshots, posts, filter } = params;
  const { range, customStart, customEnd } = filter;
  
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
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    currentStart = subDays(currentEnd, days - 1);
    currentStart.setUTCHours(0, 0, 0, 0);
    previousStart = subDays(currentStart, days);
    previousStart.setUTCHours(0, 0, 0, 0);
    previousEnd = subDays(currentStart, 1);
    previousEnd.setUTCHours(23, 59, 59, 999);
  }

  // Map snapshots
  const mapped = snapshots.map(s => ({
    id: s.id || `live-${new Date(s.date).getTime()}`,
    accountId: s.accountId,
    date: new Date(s.date),
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
    insufficientData: s.insufficientData,
    createdAt: s.createdAt || new Date(),
  }));

  // Filter snapshots
  const current = mapped.filter(s => s.date >= currentStart && s.date <= currentEnd);
  const previous = mapped.filter(s => s.date >= previousStart && s.date <= previousEnd);

  // Filter posts
  const currentPosts = posts.filter(p => new Date(p.postedAt) >= currentStart && new Date(p.postedAt) <= currentEnd);
  const previousPosts = posts.filter(p => new Date(p.postedAt) >= previousStart && new Date(p.postedAt) <= previousEnd);

  // Helper calculation
  const getTotals = (postsList: any[]) => {
    let reach = 0;
    let impressions = 0;
    let engagement = 0;

    let postInt = 0, reelInt = 0, storyInt = 0;
    let postViews = 0, reelViews = 0, storyViews = 0;

    for (const post of postsList) {
      reach += post.reach || 0;
      impressions += post.impressions || 0;
      engagement += post.totalInteractions || 0;

      const mediaType = post.mediaType?.toUpperCase() || '';
      const totalInt = post.totalInteractions || 0;
      const totalViews = post.views || post.reach || 0;

      if (mediaType === 'IMAGE' || mediaType === 'CAROUSEL_ALBUM') {
        postInt += totalInt;
        postViews += totalViews;
      } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
        reelInt += totalInt;
        reelViews += totalViews;
      } else if (mediaType === 'STORY' || mediaType === 'STORIES') {
        storyInt += totalInt;
        storyViews += totalViews;
      }
    }

    const totalIntSum = postInt + reelInt + storyInt;
    const getIntPct = (val: number) => totalIntSum > 0 ? Math.round((val / totalIntSum) * 100) : 0;
    
    const totalViewsSum = postViews + reelViews + storyViews;
    const getViewsPct = (val: number) => totalViewsSum > 0 ? Math.round((val / totalViewsSum) * 100) : 0;

    return {
      reach,
      impressions,
      engagement,
      byContentInteractions: {
        posts: getIntPct(postInt),
        reels: getIntPct(reelInt),
        stories: getIntPct(storyInt)
      },
      byContentViews: {
        posts: getViewsPct(postViews),
        reels: getViewsPct(reelViews),
        stories: getViewsPct(storyViews)
      }
    };
  };

  const currentPostTotals = getTotals(currentPosts);
  const previousPostTotals = getTotals(previousPosts);

  let uniqueReach: number | undefined;
  let prevUniqueReach: number | undefined;
  let uniqueViews: number | undefined;
  let prevUniqueViews: number | undefined;
  let uniqueAccountsEngaged: number | undefined;
  let prevUniqueAccountsEngaged: number | undefined;
  let uniqueInteractions: number | undefined;
  let prevUniqueInteractions: number | undefined;

  let isLongPeriod = false;
  if (range === 'custom' && customStart && customEnd) {
    const diff = differenceInDays(new Date(customEnd), new Date(customStart)) + 1;
    isLongPeriod = diff > 30;
  } else {
    isLongPeriod = range === '90d';
  }

  // Only use chunk-level unique totals for short periods (<= 30 days) to prevent 30-day API mismatch
  if (!isLongPeriod) {
    if (params.chunkUniqueReaches && params.chunkUniqueReaches.length > 0) {
      uniqueReach = params.chunkUniqueReaches[params.chunkUniqueReaches.length - 1] || undefined;
      if (params.chunkUniqueReaches.length >= 2) {
        prevUniqueReach = params.chunkUniqueReaches[params.chunkUniqueReaches.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueViews && params.chunkUniqueViews.length > 0) {
      uniqueViews = params.chunkUniqueViews[params.chunkUniqueViews.length - 1] || undefined;
      if (params.chunkUniqueViews.length >= 2) {
        prevUniqueViews = params.chunkUniqueViews[params.chunkUniqueViews.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueAccountsEngaged && params.chunkUniqueAccountsEngaged.length > 0) {
      uniqueAccountsEngaged = params.chunkUniqueAccountsEngaged[params.chunkUniqueAccountsEngaged.length - 1] || undefined;
      if (params.chunkUniqueAccountsEngaged.length >= 2) {
        prevUniqueAccountsEngaged = params.chunkUniqueAccountsEngaged[params.chunkUniqueAccountsEngaged.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueInteractions && params.chunkUniqueInteractions.length > 0) {
      uniqueInteractions = params.chunkUniqueInteractions[params.chunkUniqueInteractions.length - 1] || undefined;
      if (params.chunkUniqueInteractions.length >= 2) {
        prevUniqueInteractions = params.chunkUniqueInteractions[params.chunkUniqueInteractions.length - 2] || undefined;
      }
    }
  }

  // Calculate followersPct and nonfollowersPct for the current period
  const currentSnapshotsWithFollowers = current.filter(
    (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
  );

  let followersPct = 0;
  let nonfollowersPct = 0;

  if (currentSnapshotsWithFollowers.length > 0) {
    let totalReachWeight = 0;
    let sumFollowersPct = 0;

    currentSnapshotsWithFollowers.forEach((s: any) => {
      const dailyReach = s.reach || s.accountsReached || 0;
      const weight = dailyReach > 0 ? dailyReach : 1;

      totalReachWeight += weight;
      sumFollowersPct += (s.followersPct || 0) * weight;
    });

    if (totalReachWeight > 0) {
      followersPct = Math.round(sumFollowersPct / totalReachWeight);
      nonfollowersPct = 100 - followersPct;
    }
  } else {
    // Fallback: Use latest snapshot with advanced data if available
    const latestWithAdvanced = [...current].reverse().find(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
    );
    if (latestWithAdvanced) {
      followersPct = latestWithAdvanced.followersPct || 0;
      nonfollowersPct = latestWithAdvanced.nonfollowersPct || 0;
    }
  }

  // Ensure we normalize to exactly 100% if we have any data
  if (followersPct > 0 || nonfollowersPct > 0) {
    const sum = followersPct + nonfollowersPct;
    if (sum > 0) {
      followersPct = Math.round((followersPct / sum) * 100);
      nonfollowersPct = 100 - followersPct;
    }
  }

  return {
    current,
    previous,
    currentPostTotals,
    previousPostTotals,
    range,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    uniqueReach,
    prevUniqueReach,
    uniqueViews,
    prevUniqueViews,
    uniqueAccountsEngaged,
    prevUniqueAccountsEngaged,
    uniqueInteractions,
    prevUniqueInteractions,
    followersPct: followersPct > 0 || nonfollowersPct > 0 ? followersPct : undefined,
    nonfollowersPct: followersPct > 0 || nonfollowersPct > 0 ? nonfollowersPct : undefined
  };
}

