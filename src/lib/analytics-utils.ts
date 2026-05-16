import { 
  format, 
  eachDayOfInterval, 
  isSameDay, 
  startOfDay, 
  subDays,
  getISOWeek
} from 'date-fns';
import { AnalyticsSnapshot, AnalyticsRange } from '@/domain/types/analytics';

export type TrendResult = {
  percentage: number;
  sign: '+' | '-' | '=';
  display: string;
  isPositive: boolean;
};

export type AnalyticsSummary = {
  reach: { value: number; trend: TrendResult };
  impressions: { value: number; trend: TrendResult };
  engagement: { value: number; trend: TrendResult };
  followers: { value: number; delta: number; trend: TrendResult };
};

/**
 * Calculates trend percentage between current and previous values.
 */
export function calcTrend(current: number, previous: number): TrendResult {
  if (previous <= 0) {
    if (current > 0) return { percentage: 100, sign: '+', display: '+100%', isPositive: true };
    return { percentage: 0, sign: '=', display: '—', isPositive: false };
  }

  const diff = current - previous;
  const percentage = Math.round((diff / previous) * 1000) / 10;
  const sign = percentage > 0 ? '+' : percentage < 0 ? '-' : '=';
  const display = sign === '=' ? '—' : `${sign}${Math.abs(percentage)}%`;

  return {
    percentage: Math.abs(percentage),
    sign,
    display,
    isPositive: percentage > 0
  };
}

/**
 * Fills missing dates in a snapshot array with zero-value snapshots.
 */
export function fillDateGaps(
  snapshots: AnalyticsSnapshot[], 
  startDate: Date, 
  endDate: Date
): AnalyticsSnapshot[] {
  const days = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) });
  
  let lastFollowers = snapshots.length > 0 ? snapshots[0].followers : 0;
  
  return days.map(day => {
    const existing = snapshots.find(s => isSameDay(new Date(s.date), day));
    
    if (existing) {
      lastFollowers = existing.followers;
      return {
        ...existing,
        date: day
      };
    }

    // Return empty snapshot for missing day
    return {
      id: `gap-${day.getTime()}`,
      accountId: snapshots[0]?.accountId || 'unknown',
      date: day,
      reach: 0,
      impressions: 0,
      engagement: 0,
      followers: lastFollowers, // Forward fill followers
      createdAt: new Date()
    };
  });
}

/**
 * Calculates followers growth delta between first and last snapshots.
 */
export function calcFollowersDelta(snapshots: AnalyticsSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0].followers;
  const last = snapshots[snapshots.length - 1].followers;
  return last - first;
}

/**
 * Aggregates snapshots and calculates trends vs previous period.
 */
export function calcSummary(current: AnalyticsSnapshot[], previous: AnalyticsSnapshot[]): AnalyticsSummary {
  const sum = (arr: AnalyticsSnapshot[], key: keyof Pick<AnalyticsSnapshot, 'reach' | 'impressions' | 'engagement'>) => 
    arr.reduce((acc, curr) => acc + (curr[key] as number), 0);

  const curReach = sum(current, 'reach');
  const prevReach = sum(previous, 'reach');
  
  const curImp = sum(current, 'impressions');
  const prevImp = sum(previous, 'impressions');
  
  const curEng = sum(current, 'engagement');
  const prevEng = sum(previous, 'engagement');

  const curFollowers = current.length > 0 ? current[current.length - 1].followers : 0;
  const startFollowers = current.length > 0 ? current[0].followers : 0;

  return {
    reach: {
      value: curReach,
      trend: calcTrend(curReach, prevReach)
    },
    impressions: {
      value: curImp,
      trend: calcTrend(curImp, prevImp)
    },
    engagement: {
      value: curEng,
      trend: calcTrend(curEng, prevEng)
    },
    followers: {
      value: curFollowers,
      delta: calcFollowersDelta(current),
      trend: calcTrend(curFollowers, startFollowers) // Trend within the period or vs previous? Usually vs start of period for followers.
    }
  };
}

/**
 * Returns a formatter for XAxis labels based on the selected range.
 */
export function getXAxisFormatter(range: AnalyticsRange) {
  return (date: Date) => {
    const d = new Date(date);
    if (range === '7d') return format(d, 'eee dd'); // Mon 16
    if (range === '30d') return format(d, 'MMM dd'); // May 16
    if (range === '90d') return `W${getISOWeek(d)}`; // Week 20
    return format(d, 'MM/dd');
  };
}
