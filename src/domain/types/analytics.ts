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

export type AnalyticsFilter = {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
};
