import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAnalyticsAction } from '@/application/actions/analytics.actions';
import { AnalyticsRange, AnalyticsPeriodData } from '@/domain/types/analytics';

export function useAnalytics(
  accountId: string, 
  range: AnalyticsRange, 
  customStart?: Date, 
  customEnd?: Date,
  initialData?: AnalyticsPeriodData
) {
  return useQuery({
    queryKey: ['analytics', accountId, range, customStart?.toISOString(), customEnd?.toISOString()],
    queryFn: async () => {
      const { data, error } = await getAnalyticsAction(accountId, range, customStart, customEnd);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    initialData,
    enabled: !!accountId && (range !== 'custom' || (!!customStart && !!customEnd)),
  });
}
