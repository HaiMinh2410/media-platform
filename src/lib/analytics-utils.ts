import { 
  format, 
  eachDayOfInterval, 
  isSameDay, 
  startOfDay, 
  subDays,
  getISOWeek
} from 'date-fns';
import { AnalyticsSnapshot, AnalyticsRange, AnalyticsPeriodData } from '@/domain/types/analytics';

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
  profileVisits: { value: number; trend: TrendResult };
  profileLinksTaps: { value: number; trend: TrendResult };
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
  
  // Sort snapshots to ensure chronological order
  const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let lastFollowers = sorted.length > 0 ? sorted[0].followers : 0;
  
  return days.map(day => {
    const existingSnapshots = sorted.filter(s => isSameDay(new Date(s.date), day));
    const existing = existingSnapshots.length > 0 ? existingSnapshots[existingSnapshots.length - 1] : undefined;
    
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
      insufficientData: false,
      createdAt: new Date()
    };
  });
}

/**
 * Calculates followers growth delta between first and last snapshots.
 */
export function calcFollowersDelta(snapshots: AnalyticsSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0].followers || 0;
  const last = snapshots[snapshots.length - 1].followers || 0;
  return last - first;
}

/**
 * Aggregates snapshots and calculates trends vs previous period.
 * Uses post-level totals as fallback if snapshots are zero.
 */
export function calcSummary(data: AnalyticsPeriodData): AnalyticsSummary {
  const { current, previous, currentPostTotals, previousPostTotals } = data;
  
  const sum = (arr: AnalyticsSnapshot[], key: string) => 
    arr.reduce((acc, curr) => acc + ((curr as any)[key] || 0), 0);

  const snapReach = sum(current, 'reach');
  const curReach = snapReach > 0 ? snapReach : (currentPostTotals?.reach || 0);
  const snapPrevReach = sum(previous, 'reach');
  const prevReach = snapPrevReach > 0 ? snapPrevReach : (previousPostTotals?.reach || 0);
  
  const snapImp = sum(current, 'impressions');
  const curImp = snapImp > 0 ? snapImp : (currentPostTotals?.impressions || 0);
  const snapPrevImp = sum(previous, 'impressions');
  const prevImp = snapPrevImp > 0 ? snapPrevImp : (previousPostTotals?.impressions || 0);
  
  const snapEng = sum(current, 'engagement');
  const curEng = snapEng > 0 ? snapEng : (currentPostTotals?.engagement || 0);
  const snapPrevEng = sum(previous, 'engagement');
  const prevEng = snapPrevEng > 0 ? snapPrevEng : (previousPostTotals?.engagement || 0);

  const curFollowers = current.length > 0 ? (current[current.length - 1].followers || 0) : 0;
  const startFollowers = current.length > 0 ? (current[0].followers || 0) : 0;

  const curVisits = sum(current, 'profileVisits' as any);
  const prevVisits = sum(previous, 'profileVisits' as any);
  const curTaps = sum(current, 'profileLinksTaps' as any);
  const prevTaps = sum(previous, 'profileLinksTaps' as any);

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
      trend: calcTrend(curFollowers, startFollowers)
    },
    profileVisits: {
      value: curVisits,
      trend: calcTrend(curVisits, prevVisits)
    },
    profileLinksTaps: {
      value: curTaps,
      trend: calcTrend(curTaps, prevTaps)
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
