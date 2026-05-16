'use server';

import { getAnalyticsForPeriod } from '@/infrastructure/repositories/analytics.repository';
import { AnalyticsFilter, AnalyticsRange } from '@/domain/types/analytics';

/**
 * Server Action to fetch analytics with Period-over-Period support.
 */
export async function getAnalyticsAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = {
    accountId,
    range,
    customStart,
    customEnd
  };
  
  const { data, error } = await getAnalyticsForPeriod(filter);
  
  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Legacy support: Calls getAnalyticsAction with filter object.
 */
export async function getAnalyticsActionLegacy(filter: AnalyticsFilter) {
  return getAnalyticsAction(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}
