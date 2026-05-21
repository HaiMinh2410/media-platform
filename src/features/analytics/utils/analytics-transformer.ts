/* eslint-disable @typescript-eslint/no-explicit-any */
import { subDays, differenceInDays } from 'date-fns';
import type { AnalyticsFilter, AnalyticsPeriodData, AnalyticsSnapshot } from '../types';

/**
 * Calculates start and end dates for current and previous periods based on the filter.
 */
export function calculatePeriods(filter: AnalyticsFilter) {
  const { range, customStart, customEnd } = filter;
  
  const now = new Date();
  const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  let currentEnd = new Date(Date.UTC(
    localTime.getUTCFullYear(),
    localTime.getUTCMonth(),
    localTime.getUTCDate(),
    23, 59, 59, 999
  ));
  
  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (range === 'custom' && customStart && customEnd) {
    currentStart = new Date(customStart);
    currentStart.setUTCHours(0, 0, 0, 0);
    currentEnd = new Date(customEnd);
    currentEnd.setUTCHours(23, 59, 59, 999);
    const diff = differenceInDays(currentEnd, currentStart) + 1;
    previousStart = subDays(currentStart, diff);
    previousStart.setUTCHours(0, 0, 0, 0);
    previousEnd = subDays(currentStart, 1);
    previousEnd.setUTCHours(23, 59, 59, 999);
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    currentStart = subDays(currentEnd, days - 1);
    currentStart.setUTCHours(0, 0, 0, 0);
    previousStart = subDays(currentStart, days);
    previousStart.setUTCHours(0, 0, 0, 0);
    previousEnd = subDays(currentStart, 1);
    previousEnd.setUTCHours(23, 59, 59, 999);
  }

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd
  };
}

/**
 * Calculates percentage breakdown of interactions and views by content type (posts, reels, stories).
 */
export function calculatePostBreakdown(postsList: any[]) {
  let postInt = 0, reelInt = 0, storyInt = 0;
  let postViews = 0, reelViews = 0, storyViews = 0;

  for (const post of postsList) {
    const totalInt = (post.like_count ?? post.likeCount ?? 0) + 
                     (post.comments_count ?? post.commentsCount ?? 0) + 
                     (post.shares_count ?? post.sharesCount ?? 0) + 
                     (post.saved_count ?? post.savedCount ?? 0);
    const totalViews = post.views ?? post.reach ?? 0;
    const mediaType = (post.media_type || post.mediaType)?.toUpperCase() || '';

    if (mediaType === 'IMAGE' || mediaType === 'CAROUSEL_ALBUM') {
      postInt += totalInt;
      postViews += totalViews;
    } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      reelInt += totalInt;
      reelViews += totalViews;
    } else if (mediaType === 'STORY' || mediaType === 'STORIES') {
      storyInt += totalInt;
      storyViews += totalViews;
    }
  }

  const totalIntSum = postInt + reelInt + storyInt;
  const getIntPct = (val: number) => totalIntSum > 0 ? Number((val / totalIntSum * 100).toFixed(4)) : 0;
  
  const totalViewsSum = postViews + reelViews + storyViews;
  const getViewsPct = (val: number) => totalViewsSum > 0 ? Number((val / totalViewsSum * 100).toFixed(4)) : 0;

  return {
    interactions: {
      posts: getIntPct(postInt),
      reels: getIntPct(reelInt),
      stories: getIntPct(storyInt)
    },
    views: {
      posts: getViewsPct(postViews),
      reels: getViewsPct(reelViews),
      stories: getViewsPct(storyViews)
    }
  };
}

/**
 * Calculates the weighted average followers and non-followers percentage for a given set of snapshots based on Reach.
 */
export function calculateWeightedFollowersPct(snapshots: any[]) {
  const snapshotsWithFollowers = snapshots.filter(
    (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
  );

  let followersPct = 0;
  let nonfollowersPct = 0;

  if (snapshotsWithFollowers.length > 0) {
    let totalReachWeight = 0;
    let sumFollowersPct = 0;

    snapshotsWithFollowers.forEach((s: any) => {
      const dailyReach = s.reach || s.accountsReached || 0;
      const weight = dailyReach > 0 ? dailyReach : 1;

      totalReachWeight += weight;
      sumFollowersPct += (s.followersPct || 0) * weight;
    });

    if (totalReachWeight > 0) {
      followersPct = Math.round(sumFollowersPct / totalReachWeight);
      nonfollowersPct = 100 - followersPct;
    }
  } else {
    // Fallback: Use latest snapshot with advanced data if available
    const latestWithAdvanced = [...snapshots].reverse().find(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined && s.followersPct > 0
    );
    if (latestWithAdvanced) {
      followersPct = latestWithAdvanced.followersPct || 0;
      nonfollowersPct = latestWithAdvanced.nonfollowersPct || 0;
    }
  }

  // Ensure we normalize to exactly 100% if we have any data
  if (followersPct > 0 || nonfollowersPct > 0) {
    const sum = followersPct + nonfollowersPct;
    if (sum > 0) {
      followersPct = Math.round((followersPct / sum) * 100);
      nonfollowersPct = 100 - followersPct;
    }
  }

  return {
    followersPct: followersPct > 0 || nonfollowersPct > 0 ? followersPct : undefined,
    nonfollowersPct: followersPct > 0 || nonfollowersPct > 0 ? nonfollowersPct : undefined
  };
}

/**
 * Maps live analytics snapshots and posts from Meta API into Period-over-Period structure.
 * Completely replicates getAnalyticsForPeriod algorithm in-memory.
 */
export function mapLiveAnalyticsToPeriodData(params: {
  snapshots: any[];
  posts: any[];
  filter: AnalyticsFilter;
  chunkUniqueReaches?: number[];
  chunkUniqueViews?: number[];
  chunkUniqueAccountsEngaged?: number[];
  chunkUniqueInteractions?: number[];
}): AnalyticsPeriodData {
  const { snapshots, posts, filter } = params;
  const { range, customStart, customEnd } = filter;
  
  const { currentStart, currentEnd, previousStart, previousEnd } = calculatePeriods(filter);

  // Map snapshots
  const mapped: AnalyticsSnapshot[] = snapshots.map(s => ({
    id: s.id || `live-${new Date(s.date).getTime()}`,
    accountId: s.accountId,
    date: new Date(s.date),
    reach: s.reach,
    impressions: s.impressions,
    engagement: s.engagement,
    followers: s.followers,
    profileVisits: s.profileVisits,
    profileLinksTaps: s.profileLinksTaps,
    accountsReached: s.accountsReached,
    accountsEngaged: s.accountsEngaged,
    followersPct: s.followersPct,
    nonfollowersPct: s.nonfollowersPct,
    byContentViews: s.byContentViews,
    byContentInteractions: s.byContentInteractions,
    activeTimes: s.activeTimes,
    insufficientData: s.insufficientData,
    createdAt: s.createdAt || new Date(),
  }));

  // Filter snapshots
  const current = mapped.filter(s => s.date >= currentStart && s.date <= currentEnd);
  const previous = mapped.filter(s => s.date >= previousStart && s.date <= previousEnd);

  // Filter posts
  const currentPosts = posts.filter(p => new Date(p.postedAt) >= currentStart && new Date(p.postedAt) <= currentEnd);
  const previousPosts = posts.filter(p => new Date(p.postedAt) >= previousStart && new Date(p.postedAt) <= previousEnd);

  const getTotals = (postsList: any[]) => {
    let reach = 0;
    let engagement = 0;

    let postInt = 0, reelInt = 0, storyInt = 0;
    let postViews = 0, reelViews = 0, storyViews = 0;

    for (const post of postsList) {
      reach += post.reach || 0;
      engagement += post.totalInteractions || 0;

      const mediaType = post.mediaType?.toUpperCase() || '';
      const totalInt = post.totalInteractions || 0;
      const totalViews = post.views || post.reach || 0;

      if (mediaType === 'IMAGE' || mediaType === 'CAROUSEL_ALBUM') {
        postInt += totalInt;
        postViews += totalViews;
      } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
        reelInt += totalInt;
        reelViews += totalViews;
      } else if (mediaType === 'STORY' || mediaType === 'STORIES') {
        storyInt += totalInt;
        storyViews += totalViews;
      }
    }

    const totalIntSum = postInt + reelInt + storyInt;
    const getIntPct = (val: number) => totalIntSum > 0 ? Math.round((val / totalIntSum) * 100) : 0;
    
    const totalViewsSum = postViews + reelViews + storyViews;
    const getViewsPct = (val: number) => totalViewsSum > 0 ? Math.round((val / totalViewsSum) * 100) : 0;

    return {
      reach,
      engagement,
      byContentInteractions: {
        posts: getIntPct(postInt),
        reels: getIntPct(reelInt),
        stories: getIntPct(storyInt)
      },
      byContentViews: {
        posts: getViewsPct(postViews),
        reels: getViewsPct(reelViews),
        stories: getViewsPct(storyViews)
      }
    };
  };

  const currentPostTotals = getTotals(currentPosts);
  const previousPostTotals = getTotals(previousPosts);

  let uniqueReach: number | undefined;
  let prevUniqueReach: number | undefined;
  let uniqueViews: number | undefined;
  let prevUniqueViews: number | undefined;
  let uniqueAccountsEngaged: number | undefined;
  let prevUniqueAccountsEngaged: number | undefined;
  let uniqueInteractions: number | undefined;
  let prevUniqueInteractions: number | undefined;

  let isLongPeriod = false;
  if (range === 'custom' && customStart && customEnd) {
    const diff = differenceInDays(new Date(customEnd), new Date(customStart)) + 1;
    isLongPeriod = diff > 30;
  } else {
    isLongPeriod = range === '90d';
  }

  // Only use chunk-level unique totals for short periods (<= 30 days) to prevent 30-day API mismatch
  if (!isLongPeriod) {
    if (params.chunkUniqueReaches && params.chunkUniqueReaches.length > 0) {
      uniqueReach = params.chunkUniqueReaches[params.chunkUniqueReaches.length - 1] || undefined;
      if (params.chunkUniqueReaches.length >= 2) {
        prevUniqueReach = params.chunkUniqueReaches[params.chunkUniqueReaches.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueViews && params.chunkUniqueViews.length > 0) {
      uniqueViews = params.chunkUniqueViews[params.chunkUniqueViews.length - 1] || undefined;
      if (params.chunkUniqueViews.length >= 2) {
        prevUniqueViews = params.chunkUniqueViews[params.chunkUniqueViews.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueAccountsEngaged && params.chunkUniqueAccountsEngaged.length > 0) {
      uniqueAccountsEngaged = params.chunkUniqueAccountsEngaged[params.chunkUniqueAccountsEngaged.length - 1] || undefined;
      if (params.chunkUniqueAccountsEngaged.length >= 2) {
        prevUniqueAccountsEngaged = params.chunkUniqueAccountsEngaged[params.chunkUniqueAccountsEngaged.length - 2] || undefined;
      }
    }

    if (params.chunkUniqueInteractions && params.chunkUniqueInteractions.length > 0) {
      uniqueInteractions = params.chunkUniqueInteractions[params.chunkUniqueInteractions.length - 1] || undefined;
      if (params.chunkUniqueInteractions.length >= 2) {
        prevUniqueInteractions = params.chunkUniqueInteractions[params.chunkUniqueInteractions.length - 2] || undefined;
      }
    }
  }

  // Calculate weighted follower percentages for current period
  const { followersPct, nonfollowersPct } = calculateWeightedFollowersPct(current);

  return {
    current,
    previous,
    currentPostTotals,
    previousPostTotals,
    range,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    uniqueReach,
    prevUniqueReach,
    uniqueViews,
    prevUniqueViews,
    uniqueAccountsEngaged,
    prevUniqueAccountsEngaged,
    uniqueInteractions,
    prevUniqueInteractions,
    followersPct,
    nonfollowersPct
  };
}
