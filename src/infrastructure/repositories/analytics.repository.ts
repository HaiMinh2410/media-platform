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
      } as any,
      update: {
        reach: input.reach,
        impressions: input.impressions,
        engagement: input.engagement,
        followers: input.followers,
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
      createdAt: s.created_at,
    }));

    // Split data
    const current = mapped.filter(s => s.date >= currentStart && s.date <= currentEnd);
    const previous = mapped.filter(s => s.date >= previousStart && s.date <= previousEnd);

    return {
      data: {
        current,
        previous,
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
        like_count: post.likeCount,
        comments_count: post.commentsCount,
        shares_count: post.sharesCount,
        saved_count: post.savedCount,
        reach: post.reach,
        impressions: post.impressions,
        posted_at: post.postedAt,
        synced_at: new Date(),
      },
      update: {
        like_count: post.likeCount,
        comments_count: post.commentsCount,
        shares_count: post.sharesCount,
        saved_count: post.savedCount,
        reach: post.reach,
        impressions: post.impressions,
        synced_at: new Date(),
      },
    });
  } catch (error) {
    console.error('[AnalyticsRepository] upsertPostAnalytics error:', error);
  }
}

export async function getTopPosts(accountId: string, range: AnalyticsFilter['range'], limit = 10, customStart?: Date, customEnd?: Date): Promise<{ data: PostAnalytic[] | null; error: string | null }> {
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
      orderBy: {
        like_count: 'desc', // Simple sort by engagement proxy
      },
      take: limit,
    });

    const mapped = posts.map(p => ({
      id: p.id,
      accountId: p.account_id,
      postId: p.post_id,
      mediaType: p.media_type,
      caption: p.caption,
      thumbnailUrl: p.thumbnail_url,
      likeCount: p.like_count,
      commentsCount: p.comments_count,
      sharesCount: p.shares_count,
      savedCount: p.saved_count,
      reach: p.reach,
      impressions: p.impressions,
      postedAt: p.posted_at,
      syncedAt: p.synced_at,
    }));

    // Re-sort by total engagement (like + comment + share + save)
    mapped.sort((a, b) => {
      const engA = a.likeCount + a.commentsCount + a.sharesCount + a.savedCount;
      const engB = b.likeCount + b.commentsCount + b.sharesCount + b.savedCount;
      return engB - engA;
    });

    return { data: mapped.slice(0, limit), error: null };
  } catch (error) {
    console.error('[AnalyticsRepository] getTopPosts error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_TOP_POSTS' };
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
