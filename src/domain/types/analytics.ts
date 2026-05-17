export type ContentBreakdown = {
  posts: number;
  reels: number;
  stories: number;
};

export type ViewsBreakdown = {
  all: ContentBreakdown;
  followers: ContentBreakdown;
  nonfollowers: ContentBreakdown;
};

export type ActiveTimes = Record<string, number[]>;

export type AnalyticsSnapshot = {
  id: string;
  accountId: string;
  date: Date;
  reach: number | null;
  impressions: number | null;
  engagement: number | null;
  followers: number | null;
  profileVisits?: number | null;
  profileLinksTaps?: number | null;
  accountsReached?: number | null;
  accountsEngaged?: number | null;
  followersPct?: number | null;
  nonfollowersPct?: number | null;
  byContentViews?: ViewsBreakdown | null;
  byContentInteractions?: ContentBreakdown | null;
  activeTimes?: ActiveTimes | null;
  insufficientData: boolean;
  createdAt: Date;
};

export type UpsertSnapshotInput = {
  accountId: string;
  date: Date;
  reach?: number | null;
  impressions?: number | null;
  engagement?: number | null;
  followers?: number | null;
  profileVisits?: number | null;
  profileLinksTaps?: number | null;
  accountsReached?: number | null;
  accountsEngaged?: number | null;
  followersPct?: number | null;
  nonfollowersPct?: number | null;
  byContentViews?: ViewsBreakdown | null;
  byContentInteractions?: ContentBreakdown | null;
  activeTimes?: ActiveTimes | null;
  insufficientData?: boolean;
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
  currentPostTotals?: {
    reach: number;
    impressions: number;
    engagement: number;
    byContentInteractions?: ContentBreakdown;
    byContentViews?: ContentBreakdown;
  };
  previousPostTotals?: {
    reach: number;
    impressions: number;
    engagement: number;
    byContentInteractions?: ContentBreakdown;
    byContentViews?: ContentBreakdown;
  };
  range: AnalyticsRange;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  needsReauth?: boolean;
  uniqueReach?: number;
  prevUniqueReach?: number;
  uniqueAccountsEngaged?: number;
  prevUniqueAccountsEngaged?: number;
  uniqueInteractions?: number;
  prevUniqueInteractions?: number;
  followersPct?: number;
  nonfollowersPct?: number;
};

export type PostAnalytic = {
  id: string;
  accountId: string;
  postId: string;
  mediaType: string;
  caption: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  likeCount: number;
  commentsCount: number;
  sharesCount: number;
  savedCount: number;
  totalInteractions: number;
  views: number;
  reach: number;
  impressions: number;
  postedAt: Date;
  syncedAt: Date;
};
