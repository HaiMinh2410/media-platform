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
    
    let currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);
    
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (range === 'custom' && customStart && customEnd) {
      currentStart = customStart;
      currentEnd = customEnd;
      const diff = differenceInDays(currentEnd, currentStart) + 1;
      previousStart = subDays(currentStart, diff);
      previousEnd = subDays(currentStart, 1);
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setHours(0, 0, 0, 0);
      previousStart = subDays(currentStart, days);
      previousEnd = subDays(currentStart, 1);
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
      followersPct: s.followers_pct,
      nonfollowersPct: s.nonfollowers_pct,
      byContentViews: s.by_content_views as any,
      byContentInteractions: s.by_content_interactions as any,
      activeTimes: s.active_times as any,
      insufficientData: s.insufficient_data,
      createdAt: s.created_at,
    }));

    // Fetch post-level aggregates for both periods
    const [currentPostAgg, previousPostAgg] = await Promise.all([
      db.post_analytics.aggregate({
        where: { account_id: accountId, posted_at: { gte: currentStart, lte: currentEnd } },
        _sum: { reach: true, impressions: true, like_count: true, comments_count: true, shares_count: true, saved_count: true }
      }),
      db.post_analytics.aggregate({
        where: { account_id: accountId, posted_at: { gte: previousStart, lte: previousEnd } },
        _sum: { reach: true, impressions: true, like_count: true, comments_count: true, shares_count: true, saved_count: true }
      })
    ]);

    const getEng = (agg: any) => (agg._sum.like_count || 0) + (agg._sum.comments_count || 0) + (agg._sum.shares_count || 0) + (agg._sum.saved_count || 0);

    // Split snapshots into current and previous periods
    const current = mapped.filter(s => s.date >= currentStart && s.date <= currentEnd);
    const previous = mapped.filter(s => s.date >= previousStart && s.date <= previousEnd);

    return {
      data: {
        current,
        previous,
        currentPostTotals: {
          reach: currentPostAgg._sum.reach || 0,
          impressions: currentPostAgg._sum.impressions || 0,
          engagement: getEng(currentPostAgg),
        },
        previousPostTotals: {
          reach: previousPostAgg._sum.reach || 0,
          impressions: previousPostAgg._sum.impressions || 0,
          engagement: getEng(previousPostAgg),
        },
        range,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
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
  sortBy: 'views' | 'interactions' = 'interactions'
): Promise<{ data: PostAnalytic[] | null; error: string | null }> {
  try {
    let currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);
    let currentStart: Date;

    if (range === 'custom' && customStart && customEnd) {
      currentStart = customStart;
      currentEnd = customEnd;
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setHours(0, 0, 0, 0);
    }

    const orderBy = sortBy === 'views' 
      ? { views: 'desc' as const } 
      : { total_interactions: 'desc' as const };

    const posts = await db.post_analytics.findMany({
      where: {
        account_id: accountId,
        posted_at: {
          gte: currentStart,
          lte: currentEnd,
        },
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
      postedAt: p.posted_at,
      syncedAt: p.synced_at,
    }));

    // If we sorted by interactions in DB, we still do a final check in JS 
    // to ensure the sum of all interactions is used (in case DB column total_interactions is slightly behind)
    if (sortBy === 'interactions') {
      mapped.sort((a, b) => {
        const engA = a.likeCount + a.commentsCount + a.sharesCount + a.savedCount;
        const engB = b.likeCount + b.commentsCount + b.sharesCount + b.savedCount;
        return engB - engA;
      });
    } else {
      // If views, trust DB sort but ensure we have valid numbers
      mapped.sort((a, b) => (b.views || 0) - (a.views || 0));
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
    currentEnd.setHours(23, 59, 59, 999);
    let currentStart: Date;

    if (range === 'custom' && customStart && customEnd) {
      currentStart = customStart;
      currentEnd = customEnd;
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setHours(0, 0, 0, 0);
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
    currentEnd.setHours(23, 59, 59, 999);
    let currentStart: Date;

    if (range === 'custom' && customStart && customEnd) {
      currentStart = customStart;
      currentEnd = customEnd;
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      currentStart = subDays(currentEnd, days - 1);
      currentStart.setHours(0, 0, 0, 0);
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
