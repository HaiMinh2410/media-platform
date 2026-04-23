import { db } from '@/lib/db';
import type { AnalyticsSnapshot, UpsertSnapshotInput, AnalyticsFilter } from '@/domain/types/analytics';

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
 * Retrieves analytics history for a platform account within an optional date range.
 */
export async function getAnalyticsHistory(filter: AnalyticsFilter): Promise<{ data: AnalyticsSnapshot[] | null; error: string | null }> {
  try {
    const snapshots = await db.analytics_snapshots.findMany({
      where: {
        account_id: filter.accountId,
        date: {
          gte: filter.startDate,
          lte: filter.endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      data: snapshots.map(s => ({
        id: s.id,
        accountId: s.account_id,
        date: s.date,
        reach: s.reach,
        impressions: s.impressions,
        engagement: s.engagement,
        followers: s.followers,
        createdAt: s.created_at,
      })),
      error: null,
    };
  } catch (error) {
    console.error('[AnalyticsRepository] getHistory error:', error);
    return { data: null, error: 'FAILED_TO_FETCH_ANALYTICS' };
  }
}
