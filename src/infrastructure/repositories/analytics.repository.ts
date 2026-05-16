import { db } from '@/lib/db';
import type { AnalyticsSnapshot, UpsertSnapshotInput, AnalyticsFilter, AnalyticsPeriodData } from '@/domain/types/analytics';
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
