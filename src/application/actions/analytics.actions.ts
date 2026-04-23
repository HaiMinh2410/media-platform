'use server';

import { getAnalyticsHistory } from '@/infrastructure/repositories/analytics.repository';
import { AnalyticsFilter } from '@/domain/types/analytics';

export async function getAnalyticsAction(filter: AnalyticsFilter) {
  const { data, error } = await getAnalyticsHistory(filter);
  
  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
