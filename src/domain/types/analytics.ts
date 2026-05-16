export type AnalyticsSnapshot = {
  id: string;
  accountId: string;
  date: Date;
  reach: number;
  impressions: number;
  engagement: number;
  followers: number;
  createdAt: Date;
};

export type UpsertSnapshotInput = {
  accountId: string;
  date: Date;
  reach: number;
  impressions: number;
  engagement: number;
  followers: number;
};

export type AnalyticsRange = '7d' | '30d' | '90d' | 'custom';

export type AnalyticsFilter = {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date; // Only used when range = 'custom'
  customEnd?: Date;
};

export type AnalyticsPeriodData = {
  current: AnalyticsSnapshot[];
  previous: AnalyticsSnapshot[];
  range: AnalyticsRange;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
};
