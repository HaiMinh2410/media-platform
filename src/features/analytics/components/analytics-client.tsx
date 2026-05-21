'use client';

import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  Users, BarChart3, Eye, TrendingDown, RefreshCw, 
  CloudDownload, Layers, Flame, Star, AlertTriangle,
  UserPlus, UserMinus, UserCheck, Link2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@shared/ui/icon';
import { 
  getAnalyticsAction, syncAnalyticsAction, syncAllAccountsAction,
  getFollowerDetailedAnalyticsAction, getPostDeepAnalyticsAction
} from '@features/analytics/actions/analytics.actions';
import { AnalyticsPeriodData, AnalyticsRange } from '@features/analytics/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calcSummary, fillDateGaps, getXAxisFormatter } from '@shared/lib/analytics-utils';
import { ViewsCard } from '@features/analytics/components/views-card';
import { InteractionsCard } from '@features/analytics/components/interactions-card';
import { PostChartsDashboard } from '@features/analytics/components/post-charts-dashboard';
import { TopContentLeaderboard } from '@features/analytics/components/top-content-leaderboard';
import { PostDetailModal } from '@features/analytics/components/post-detail-modal';
import { FollowerDetailedSection } from '@features/analytics/components/follower-detailed-section';
import { AccountSelector } from '@features/analytics/components/account-selector';
import { StatsCard, SkeletonStatsCard } from '@features/analytics/components/stats-card';
import { EngagementBreakdownChart } from '@features/analytics/components/engagement-breakdown-chart';
import { PostFrequencyChart } from '@features/analytics/components/post-frequency-chart';
import { ContentInsightsSection } from '@features/analytics/components/content-insights-section';
import { 
  SkeletonChart, InsufficientDataState, ReauthNotice, CustomTooltip 
} from '@features/analytics/components/dashboard-states';
import AIAnalyticsPage from '@/app/dashboard/ai-analytics/page';

type Props = {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
};

function getStaleTime(range: AnalyticsRange): number {
  switch (range) {
    case '7d': return 5 * 60 * 1000;    // 5 mins
    case '30d': return 15 * 60 * 1000;  // 15 mins
    case '90d': return 30 * 60 * 1000;  // 30 mins
    case 'custom': return 30 * 60 * 1000; // 30 mins
    default: return 5 * 60 * 1000;
  }
}

function useAnalytics(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date, initialData?: AnalyticsPeriodData) {
  return useQuery({
    queryKey: ['analytics', accountId, range, customStart, customEnd],
    queryFn: () => getAnalyticsAction(accountId, range, customStart, customEnd),
    initialData: initialData ? { data: initialData, error: null } : undefined,
    staleTime: getStaleTime(range),
  });
}

export function AnalyticsDashboardClient({ initialData, accounts }: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'content'>('general');
  const [activeChart, setActiveChart] = useState<'reach-engagement' | 'views-interactions' | 'followers'>('reach-engagement');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const cStart = range === 'custom' && customStart ? new Date(customStart) : undefined;
  const cEnd = range === 'custom' && customEnd ? new Date(customEnd) : undefined;

  // Only use initialData if we are on the first account and default range
  // otherwise it will pollute the state of other accounts
  const isInitialState = selectedAccountId === accounts[0]?.id && range === '30d';

  const { data, isPending, isError, isFetching } = useAnalytics(
    selectedAccountId, 
    range, 
    cStart, 
    cEnd, 
    isInitialState ? initialData : undefined
  );

  const isInstagram = accounts.find(a => a.id === selectedAccountId)?.platform === 'instagram';

  const { data: followerDetailsResult } = useQuery({
    queryKey: ['follower-details', selectedAccountId, range, cStart, cEnd],
    queryFn: () => getFollowerDetailedAnalyticsAction(selectedAccountId, range, cStart, cEnd),
    staleTime: 5 * 60 * 1000,
    enabled: isInstagram && !!selectedAccountId,
  });

  const followerDetails = followerDetailsResult?.data;
  const isFollowerInsufficientData = followerDetails?.insufficientData ?? false;
  const followsAndUnfollows = followerDetails?.followsAndUnfollows || [];
  const totalFollows = followsAndUnfollows.reduce((sum: number, d: any) => sum + (d.follows || 0), 0);
  const totalUnfollows = followsAndUnfollows.reduce((sum: number, d: any) => sum + (d.unfollows || 0), 0);
  const netGrowth = totalFollows - totalUnfollows;

  const { data: deepAnalyticsResult, isPending: isDeepAnalyticsLoading } = useQuery({
    queryKey: ['post-deep-analytics', selectedAccountId, range, customStart, customEnd],
    queryFn: () => getPostDeepAnalyticsAction(selectedAccountId, range, cStart, cEnd),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedAccountId,
  });

  const deepAnalyticsData = deepAnalyticsResult?.data || null;

  async function handleSync() {
    if (!selectedAccountId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncAnalyticsAction(selectedAccountId);
      if (result.success) {
        // Refetch all queries for this account
        queryClient.invalidateQueries({ queryKey: ['analytics', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-posts', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-content', selectedAccountId] });
      } else {
        console.error('Sync failed:', result.error);
        alert(`Sync failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncAll() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllAccountsAction();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['top-posts'] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown'] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency'] });
        queryClient.invalidateQueries({ queryKey: ['top-content'] });
        alert(`Đã đồng bộ thành công ${result.successful}/${result.processed} tài khoản.`);
      } else {
        console.error('Sync All failed:', result.error);
        alert(`Sync All failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync All error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  const totals = data?.data ? calcSummary(data.data) : null;
  const xAxisFormatter = getXAxisFormatter(range);
  
  const currentSnapshots = data?.data ? fillDateGaps(data.data.current, data.data.currentStart, data.data.currentEnd) : [];
  const previousSnapshots = data?.data ? fillDateGaps(data.data.previous, data.data.previousStart, data.data.previousEnd) : [];

  const chartData = currentSnapshots.map((s, i) => {
    const prev = previousSnapshots[i];
    return {
      date: xAxisFormatter(s.date),
      reach: s.reach || 0,
      engagement: s.accountsEngaged ?? s.engagement ?? 0,
      views: s.impressions || 0,
      followers: s.followers || 0,
      profileVisits: s.profileVisits || 0,
      profileLinksTaps: s.profileLinksTaps || 0,
      prevReach: prev?.reach ?? 0,
      prevEngagement: prev?.engagement ?? 0,
      prevViews: prev?.impressions ?? 0,
      prevFollowers: prev?.followers ?? 0,
    };
  });

  
  // Find the latest snapshot with active times (since it's a lifetime metric, latest is best)
  const latestWithActiveTimes = [...(data?.data?.current || [])].reverse().find(s => s.activeTimes);
  
  // 1. Get Followers vs Non-followers reach percentage over the selected period
  let followersPct = data?.data?.followersPct ?? 0;
  let nonfollowersPct = data?.data?.nonfollowersPct ?? 0;

  if (followersPct === 0 && nonfollowersPct === 0) {
    const currentSnapshotsWithFollowers = (data?.data?.current || []).filter(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined &&
           s.nonfollowersPct !== null && s.nonfollowersPct !== undefined
    );

    if (currentSnapshotsWithFollowers.length > 0) {
      let totalReachWeight = 0;
      let sumFollowersPct = 0;
      let sumNonfollowersPct = 0;

      currentSnapshotsWithFollowers.forEach((s: any) => {
        // Use reach as the weight for reach breakdown percentage
        const dailyReach = s.reach || s.accountsReached || 0;
        const weight = dailyReach > 0 ? dailyReach : 1;

        totalReachWeight += weight;
        sumFollowersPct += (s.followersPct || 0) * weight;
        sumNonfollowersPct += (s.nonfollowersPct || 0) * weight;
      });

      if (totalReachWeight > 0) {
        followersPct = Math.round(sumFollowersPct / totalReachWeight);
        nonfollowersPct = Math.round(sumNonfollowersPct / totalReachWeight);

        // Normalize to sum to exactly 100
        const pctSum = followersPct + nonfollowersPct;
        if (pctSum > 0) {
          followersPct = Math.round((followersPct / pctSum) * 100);
          nonfollowersPct = 100 - followersPct;
        }
      }
    } else {
      // Fallback if no snapshots have these fields, find the latest snapshot with advanced data
      const latestWithAdvanced = [...(data?.data?.current || [])].reverse().find((s: any) => s.followersPct !== null && s.followersPct !== undefined);
      followersPct = latestWithAdvanced?.followersPct || 0;
      nonfollowersPct = latestWithAdvanced?.nonfollowersPct || 0;
    }
  }

  // 2. Aggregate Views Breakdown by Content Type over the selected period
  const currentSnapshotsWithViewsBreakdown = (data?.data?.current || []).filter(
    (s: any) => s.byContentViews && (
      (s.byContentViews.all && (s.byContentViews.all.posts > 0 || s.byContentViews.all.reels > 0 || s.byContentViews.all.stories > 0)) ||
      (s.byContentViews.followers && (s.byContentViews.followers.posts > 0 || s.byContentViews.followers.reels > 0 || s.byContentViews.followers.stories > 0))
    )
  );

  let aggregatedByContentViews: any = null;

  if (currentSnapshotsWithViewsBreakdown.length > 0) {
    let totalViewsWeight = 0;
    const temp = {
      all: { posts: 0, reels: 0, stories: 0 },
      followers: { posts: 0, reels: 0, stories: 0 },
      nonfollowers: { posts: 0, reels: 0, stories: 0 }
    };

    currentSnapshotsWithViewsBreakdown.forEach((s: any) => {
      // Use impressions as weight for views breakdown percentage
      const dailyViews = s.impressions || s.reach || 0;
      const weight = dailyViews > 0 ? dailyViews : 1;

      totalViewsWeight += weight;
      const v = s.byContentViews!;

      temp.all.posts += (v.all?.posts || 0) * weight;
      temp.all.reels += (v.all?.reels || 0) * weight;
      temp.all.stories += (v.all?.stories || 0) * weight;

      temp.followers.posts += (v.followers?.posts || 0) * weight;
      temp.followers.reels += (v.followers?.reels || 0) * weight;
      temp.followers.stories += (v.followers?.stories || 0) * weight;

      temp.nonfollowers.posts += (v.nonfollowers?.posts || 0) * weight;
      temp.nonfollowers.reels += (v.nonfollowers?.reels || 0) * weight;
      temp.nonfollowers.stories += (v.nonfollowers?.stories || 0) * weight;
    });

    if (totalViewsWeight > 0) {
      const getNormBreakdown = (breakdown: { posts: number; reels: number; stories: number }) => {
        const p = breakdown.posts;
        const r = breakdown.reels;
        const s = breakdown.stories;
        const total = p + r + s;
        if (total > 0) {
          const posts = Number((p / total * 100).toFixed(1));
          const reels = Number((r / total * 100).toFixed(1));
          const stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
          return { posts, reels, stories };
        }
        return { posts: 0, reels: 0, stories: 0 };
      };

      aggregatedByContentViews = {
        all: getNormBreakdown(temp.all),
        followers: getNormBreakdown(temp.followers),
        nonfollowers: getNormBreakdown(temp.nonfollowers)
      };
    }
  }

  const fallbackViewsBreakdown = data?.data?.currentPostTotals?.byContentViews;

  const viewsData = {
    totalViews: totals?.impressions?.value || 0,
    followersPct,
    nonfollowersPct,
    accountsReached: totals?.reach?.value || 0,
    byContentViews: aggregatedByContentViews 
      ? aggregatedByContentViews 
      : (fallbackViewsBreakdown ? {
          all: fallbackViewsBreakdown,
          followers: fallbackViewsBreakdown,
          nonfollowers: fallbackViewsBreakdown
        } : null),
  };

  // 3. Aggregate Interactions Breakdown by Content Type over the selected period
  const currentSnapshotsWithInteractions = (data?.data?.current || []).filter(
    (s: any) => s.byContentInteractions && (
      s.byContentInteractions.posts > 0 || 
      s.byContentInteractions.reels > 0 || 
      s.byContentInteractions.stories > 0
    )
  );

  let aggregatedByContentInteractions: any = null;

  if (currentSnapshotsWithInteractions.length > 0) {
    let totalEngWeight = 0;
    const temp = { posts: 0, reels: 0, stories: 0 };

    currentSnapshotsWithInteractions.forEach((s: any) => {
      // Use engagement as weight for interactions breakdown percentage
      const dailyEngagement = s.engagement || 0;
      const weight = dailyEngagement > 0 ? dailyEngagement : 1;

      totalEngWeight += weight;
      const v = s.byContentInteractions!;

      temp.posts += (v.posts || 0) * weight;
      temp.reels += (v.reels || 0) * weight;
      temp.stories += (v.stories || 0) * weight;
    });

    if (totalEngWeight > 0) {
      const p = temp.posts;
      const r = temp.reels;
      const s = temp.stories;
      const total = p + r + s;
      if (total > 0) {
        const posts = Number((p / total * 100).toFixed(1));
        const reels = Number((r / total * 100).toFixed(1));
        const stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
        aggregatedByContentInteractions = { posts, reels, stories };
      }
    }
  }

  const totalAccEngaged = (data?.data?.current || []).reduce((acc: number, curr: any) => acc + (curr.accountsEngaged || 0), 0);

  const interactionsData = {
    totalInteractions: data?.data?.uniqueInteractions ?? (totals?.engagement?.value || 0),
    accountsEngaged: data?.data?.uniqueAccountsEngaged ?? (totalAccEngaged > 0 ? totalAccEngaged : (totals?.engagement?.value || 0)),
    byContentInteractions: aggregatedByContentInteractions
      ? aggregatedByContentInteractions
      : (data?.data?.currentPostTotals?.byContentInteractions || null),
  };

  // Reach vs Engagement statistics
  const totalReach = chartData.reduce((sum, item) => sum + item.reach, 0);
  const totalEngagement = chartData.reduce((sum, item) => sum + item.engagement, 0);
  const avgReach = chartData.length > 0 ? Math.round(totalReach / chartData.length) : 0;
  const avgEngagement = Math.round(totalEngagement / chartData.length);
  const avgEngagementRate = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(2)) : 0;

  const getEngagementInsight = (rate: number) => {
    if (rate === 0) return null;
    if (rate < 5) {
      return {
        type: 'low',
        icon: AlertTriangle,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        title: 'Khoảng cách rộng (Tương tác thấp)',
        desc: 'Số lượng tài khoản tiếp cận cao nhưng tương tác lại thấp. Điều này cho thấy nội dung của bạn chưa đủ sức hút để người xem hành động. Hãy thử thiết kế thumbnail nổi bật hơn, tối ưu 3 giây đầu của video hoặc chèn câu hỏi mở (CTA) hấp dẫn để kêu gọi bình luận.',
      };
    } else if (rate >= 5 && rate < 15) {
      return {
        type: 'good',
        icon: Star,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        title: 'Khoảng cách ổn định (Tương tác khá)',
        desc: 'Tỷ lệ tương tác trên lượt tiếp cận đang hoạt động ổn định. Nội dung của bạn đi đúng hướng và có sức hút nhất định. Hãy tiếp tục tối ưu hóa khung giờ đăng bài và giữ vững phong cách chia sẻ hữu ích hiện tại.',
      };
    } else {
      return {
        type: 'excellent',
        icon: Flame,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        title: 'Khoảng cách hẹp (Tương tác xuất sắc!)',
        desc: 'Hiệu suất tuyệt vời! Tỷ lệ tương tác trên mỗi lượt tiếp cận đạt mức rất cao. Khán giả cực kỳ hứng thú và có sự gắn kết sâu sắc với nội dung của bạn. Đây là công thức thành công, hãy nhân bản định dạng và chủ đề này ngay lập tức!',
      };
    }
  };
  const engagementInsight = getEngagementInsight(avgEngagementRate);

  // Views vs Interactions statistics
  const totalViews = chartData.reduce((sum, item) => sum + item.views, 0);
  const totalInteractions = chartData.reduce((sum, item) => sum + item.engagement, 0);
  const avgViews = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;
  const avgInteractions = Math.round(totalInteractions / chartData.length);
  const avgInteractionRate = totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(2)) : 0;

  const getInteractionInsight = (rate: number) => {
    if (rate === 0) return null;
    if (rate < 2) {
      return {
        type: 'low',
        icon: AlertTriangle,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        title: 'Hiệu suất chuyển đổi tương tác thấp',
        desc: 'Nội dung của bạn nhận được nhiều lượt xem nhưng tỷ lệ người thực hiện hành động tương tác (Like, Comment, Share, Save) khá thấp. Bạn nên thử đặt các câu hỏi kích thích thảo luận dưới caption, tạo minigame hoặc chèn lời kêu gọi hành động (CTA) trực tiếp trên hình ảnh/video để thúc đẩy người dùng tương tác.',
      };
    } else if (rate >= 2 && rate < 6) {
      return {
        type: 'good',
        icon: Star,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        title: 'Tỷ lệ tương tác ổn định',
        desc: 'Khả năng chuyển đổi từ lượt xem sang tương tác đạt mức ổn định so với trung bình. Khán giả phản hồi tương đối tích cực với các nội dung hiển thị. Hãy tiếp tục tối ưu hóa chất lượng hình ảnh, duy trì đều đặn tần suất đăng để củng cố thói quen tương tác của fan.',
      };
    } else {
      return {
        type: 'excellent',
        icon: Flame,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        title: 'Hiệu suất tương tác cực kỳ xuất sắc!',
        desc: 'Tỷ lệ chuyển đổi tương tác trên mỗi lượt xem đạt mức rất cao! Khán giả cực kỳ hứng thú và không ngần ngại tương tác với các bài viết của bạn. Đây là những nội dung có giá trị giữ chân và tạo sự kết nối cộng đồng mạnh mẽ. Bạn nên ưu tiên phát triển thêm nhiều nội dung theo chủ đề này.',
      };
    }
  };
  const interactionInsight = getInteractionInsight(avgInteractionRate);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto">
      {/* TABS SELECTOR */}
      <div className="flex border-b border-foreground/10 mb-4 select-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-foreground bg-foreground/2'
              : 'border-transparent text-foreground-secondary hover:text-foreground hover:bg-foreground/1'
          }`}
        >
          <Icon lucide={BarChart3} size={14} />
          <span>Tổng quan Kênh</span>
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'content'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/1'
              : 'border-transparent text-foreground-secondary hover:text-foreground hover:bg-foreground/1'
          }`}
        >
          <Icon lucide={Layers} size={14} className={activeTab === 'content' ? "text-indigo-500" : "text-foreground-tertiary"} />
          <span>Bài viết</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-pink-500 text-pink-400 bg-pink-500/1'
              : 'border-transparent text-foreground-secondary hover:text-foreground hover:bg-foreground/1'
          }`}
        >
          <Icon lucide={Sparkles} size={14} className={activeTab === 'ai' ? "text-pink-500 animate-pulse" : "text-foreground-tertiary"} />
          <span>Phân tích AI Agent</span>
        </button>
      </div>

      {activeTab === 'ai' ? (
        <div className="-mx-6 -my-4">
          <AIAnalyticsPage onBack={() => setActiveTab('general')} />
        </div>
      ) : activeTab === 'content' ? (
        <ContentInsightsSection accountId={selectedAccountId} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-foreground-secondary text-sm">Track your performance across platforms</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-0.5 bg-foreground/5 border border-foreground/10 rounded-xl p-1">
                {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      range === r 
                        ? 'bg-primary/15 text-primary shadow-lg' 
                        : 'text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
                <button 
                  onClick={() => setRange('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    range === 'custom' 
                      ? 'bg-primary/15 text-primary shadow-lg' 
                      : 'text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5'
                  }`}
                >
                  Custom
                </button>
              </div>

              {range === 'custom' && (
                <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-right-2 duration-300">
                  <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-xs text-foreground outline-none scheme-dark"
                  />
                  <span className="text-foreground-secondary/20 text-xs">→</span>
                  <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-xs text-foreground outline-none scheme-dark"
                  />
                </div>
              )}
              
              <div className="h-8 w-px bg-foreground/10 mx-1" />
              
              <AccountSelector 
                accounts={accounts} 
                selectedId={selectedAccountId} 
                onSelect={setSelectedAccountId} 
              />

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  isSyncing 
                    ? 'bg-foreground/5 border-foreground/10 cursor-not-allowed opacity-50' 
                    : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400'
                }`}
                title="Đồng bộ dữ liệu tài khoản này"
              >
                <Icon lucide={RefreshCw} size={16} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                  isSyncing 
                    ? 'bg-foreground/5 border-foreground/10 cursor-not-allowed opacity-50 text-foreground-tertiary' 
                    : 'bg-foreground/5 border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20 text-foreground'
                }`}
                title="Đồng bộ tất cả tài khoản"
              >
                <Icon lucide={CloudDownload} size={14} className={isSyncing ? 'animate-pulse text-blue-400' : ''} />
                <span className="hidden sm:inline">Sync All</span>
              </button>
            </div>
          </div>
 
 

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
            {isPending ? (
              <>
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
              </>
            ) : isError || !totals ? (
              <div className="col-span-4 p-4 text-center text-foreground-secondary bg-foreground/5 rounded-xl border border-red-500/20">
                Failed to load analytics data.
              </div>
            ) : (
              <>
                <StatsCard 
                  label="Total Reach" 
                  value={totals.reach.value.toLocaleString()} 
                  icon={<Icon lucide={Users} className="text-blue-400" size={20} />} 
                  trend={totals.reach.trend.display} 
                  isPositive={totals.reach.trend.isPositive}
                  sparklineData={chartData.map(d => d.reach || 0)}
                />
                 <StatsCard 
                  label="Profile Visits" 
                  value={totals.profileVisits.value.toLocaleString()} 
                  icon={<Icon lucide={UserCheck} className="text-purple-400" size={20} />} 
                  trend={totals.profileVisits.trend.display} 
                  isPositive={totals.profileVisits.trend.isPositive}
                  sparklineData={chartData.map(d => d.profileVisits || 0)}
                />
                <StatsCard 
                  label="Website Taps" 
                  value={totals.profileLinksTaps.value.toLocaleString()} 
                  icon={<Icon lucide={Link2} className="text-emerald-400" size={20} />} 
                  trend={totals.profileLinksTaps.trend.display} 
                  isPositive={totals.profileLinksTaps.trend.isPositive}
                  sparklineData={chartData.map(d => d.profileLinksTaps || 0)}
                />
                <StatsCard 
                  label="Followers" 
                  value={totals.followers.value.toLocaleString()} 
                  icon={<Icon lucide={TrendingUp} className="text-orange-400" size={20} />} 
                  trend={totals.followers.trend.display} 
                  isPositive={totals.followers.trend.isPositive}
                  delta={totals.followers.delta}
                  sparklineData={chartData.map(d => d.followers || 0)}
                />
              </>
            )}
          </div>

          {/* Reauth Notice */}
          {(accounts.find(a => a.id === selectedAccountId && (a as any).needs_reauth) || data?.data?.needsReauth) && (
            <ReauthNotice />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
            <ViewsCard 
              {...viewsData}
              isLoading={isPending}
            />
            <InteractionsCard
              {...interactionsData}
              isLoading={isPending}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <PostChartsDashboard 
              accountId={selectedAccountId}
              range={range}
              customStart={cStart}
              customEnd={cEnd}
              data={deepAnalyticsData}
              isLoading={isDeepAnalyticsLoading}
            />

            <TopContentLeaderboard 
              data={deepAnalyticsData?.leaderboard ?? null}
              isLoading={isDeepAnalyticsLoading}
              onOpenPostDetail={(postId) => {
                const found = deepAnalyticsData?.leaderboard.find((p: any) => p.postId === postId);
                if (found) setSelectedPostForDetail(found);
              }}
            />
          </div>

          <div className={`bg-foreground/2 border border-foreground/5 rounded-2xl p-6 min-h-[450px] transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
            {/* CHART SELECTOR BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-foreground/1 border border-foreground/10 p-2 rounded-2xl">
              <div className="flex flex-wrap p-1 bg-foreground/5 border border-foreground/10 rounded-xl select-none gap-1">
                <button
                  onClick={() => setActiveChart('reach-engagement')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    activeChart === 'reach-engagement'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <Icon lucide={Users} size={14} />
                  Tiếp cận & Tương tác
                </button>
                <button
                  onClick={() => setActiveChart('views-interactions')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    activeChart === 'views-interactions'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <Icon lucide={Eye} size={14} />
                  Lượt xem & Tương tác
                </button>
                <button
                  onClick={() => setActiveChart('followers')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    activeChart === 'followers'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <Icon lucide={TrendingUp} size={14} />
                  {isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers'}
                </button>
              </div>

              <div className="text-foreground-secondary/40 text-xs font-semibold px-2">
                {activeChart === 'reach-engagement' && 'Hiệu suất thu hút (Reach vs Engagement)'}
                {activeChart === 'views-interactions' && 'Hiệu suất chuyển đổi (Views vs Interactions)'}
                {activeChart === 'followers' && (isInstagram && !isFollowerInsufficientData ? 'Biến động theo dõi kênh' : 'Biểu đồ tăng trưởng người theo dõi')}
              </div>
            </div>

            {/* CHARTS CONTAINER */}
            {isPending ? (
              <SkeletonChart />
            ) : isError || !totals ? (
              <div className="w-full h-[350px] flex items-center justify-center bg-foreground/2 rounded-xl border border-foreground/10">
                <span className="text-foreground-secondary/40">No data available</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChart}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {activeChart === 'reach-engagement' && (
                    /* Reach vs Engagement Comparison Chart */
                    <div className="w-full glass rounded-2xl p-6 flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Icon lucide={Users} size={18} className="text-blue-400" />
                            So sánh Tiếp cận & Tương tác
                          </h3>
                          <p className="text-foreground-secondary/50 text-xs mt-1">
                            Xem mối tương quan giữa số người tiếp cận (Reach) và người tương tác thực tế (Engagement)
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Reach TB/Ngày</span>
                            <span className="text-sm font-extrabold text-blue-400">{avgReach.toLocaleString()}</span>
                          </div>
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tương tác TB</span>
                            <span className="text-sm font-extrabold text-orange-400">{avgEngagement.toLocaleString()}</span>
                          </div>
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
                            <span className={`text-sm font-extrabold ${avgEngagementRate >= 15 ? 'text-emerald-400' : avgEngagementRate >= 5 ? 'text-blue-400' : 'text-amber-400'}`}>
                              {avgEngagementRate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '350px' }} className="relative mt-2 text-foreground-secondary">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                              dy={10}
                              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const reachVal = data.reach || 0;
                                  const engVal = data.engagement || 0;
                                  const dailyRate = reachVal > 0 ? ((engVal / reachVal) * 100).toFixed(2) : '0';

                                  return (
                                    <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                                      <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                                        {data.date}
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                                          <span>Reach (Tiếp cận):</span>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{reachVal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                                          <span>Engagement (Tương tác):</span>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{engVal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-1.5 mt-1">
                                        <span className="text-xs font-medium text-foreground-secondary/40">Tỷ lệ tương tác ngày:</span>
                                        <span className={`text-xs font-bold ${Number(dailyRate) >= 15 ? 'text-emerald-400' : Number(dailyRate) >= 5 ? 'text-blue-400' : 'text-amber-400'}`}>
                                          {dailyRate}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
                            />
                            <Legend 
                              verticalAlign="top" 
                              height={36} 
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => {
                                const label = value === 'reach' ? 'Accounts Reached (Tiếp cận)' : 'Accounts Engaged (Tương tác)';
                                return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="reach" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              dot={{ r: 0 }}
                              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#121212' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="engagement" 
                              stroke="#f97316" 
                              strokeWidth={3}
                              dot={{ r: 0 }}
                              activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#121212' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {engagementInsight && (
                        <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${engagementInsight.color}`}>
                          <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
                            <Icon lucide={engagementInsight.icon} size={16} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-foreground">{engagementInsight.title}</h4>
                            <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                              {engagementInsight.desc}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeChart === 'views-interactions' && (
                    /* Views vs Interactions Comparison Chart */
                    <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Icon lucide={Eye} size={18} className="text-purple-400" />
                            So sánh Lượt xem & Tương tác
                          </h3>
                          <p className="text-foreground-secondary/40 text-xs mt-1">
                            Theo dõi mối quan hệ giữa tổng lượt hiển thị (Views) và tổng lượt tương tác nhận được (Interactions)
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Views TB/Ngày</span>
                            <span className="text-sm font-extrabold text-purple-400">{avgViews.toLocaleString()}</span>
                          </div>
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tương tác TB</span>
                            <span className="text-sm font-extrabold text-emerald-400">{avgInteractions.toLocaleString()}</span>
                          </div>
                          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
                            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
                            <span className={`text-sm font-extrabold ${avgInteractionRate >= 6 ? 'text-emerald-400' : avgInteractionRate >= 2 ? 'text-blue-400' : 'text-amber-400'}`}>
                              {avgInteractionRate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '350px' }} className="relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                              dy={10}
                              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const viewsVal = data.views || 0;
                                  const engVal = data.engagement || 0;
                                  const dailyRate = viewsVal > 0 ? ((engVal / viewsVal) * 100).toFixed(2) : '0';

                                  return (
                                    <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                                      <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                                        {data.date}
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                                          <span>Views (Lượt xem):</span>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{viewsVal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span>Interactions (Tương tác):</span>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{engVal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-1.5 mt-1">
                                        <span className="text-xs font-medium text-foreground-secondary/40">Tỷ lệ tương tác ngày:</span>
                                        <span className={`text-xs font-bold ${Number(dailyRate) >= 6 ? 'text-emerald-400' : Number(dailyRate) >= 2 ? 'text-blue-400' : 'text-amber-400'}`}>
                                          {dailyRate}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
                            />
                            <Legend 
                              verticalAlign="top" 
                              height={36} 
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => {
                                const label = value === 'views' ? 'Views (Lượt xem)' : 'Interactions (Tương tác)';
                                return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="views" 
                              stroke="#a855f7" 
                              strokeWidth={3}
                              dot={{ r: 0 }}
                              activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2, fill: 'var(--bg-primary)' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="engagement" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ r: 0 }}
                              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'var(--bg-primary)' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {interactionInsight && (
                        <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${interactionInsight.color}`}>
                          <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
                            <Icon lucide={interactionInsight.icon} size={16} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-foreground">{interactionInsight.title}</h4>
                            <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                              {interactionInsight.desc}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeChart === 'followers' && (
                    /* Followers chart: dynamics or trend */
                    <>
                      {isInstagram && !isFollowerInsufficientData ? (
                        <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Icon lucide={TrendingUp} size={18} className="text-orange-400" />
                                Biến động Followers
                              </h3>
                              <p className="text-foreground-secondary/40 text-xs mt-1">Số lượng tài khoản bấm theo dõi và bỏ theo dõi hàng ngày</p>
                            </div>

                            <div className="flex items-center gap-6 bg-foreground/1 border border-foreground/10 rounded-2xl p-4 self-start md:self-auto">
                              <div className="pr-6 border-r border-foreground/10">
                                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                  <Icon lucide={UserPlus} size={14} />
                                  <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Follows</span>
                                </div>
                                <span className="text-xl font-black text-foreground">{totalFollows.toLocaleString()}</span>
                              </div>

                              <div className="pr-6 border-r border-foreground/10">
                                <div className="flex items-center gap-2 text-rose-500 mb-1">
                                  <Icon lucide={UserMinus} size={14} />
                                  <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Unfollows</span>
                                </div>
                                <span className="text-xl font-black text-foreground">{totalUnfollows.toLocaleString()}</span>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {netGrowth >= 0 ? (
                                    <Icon lucide={TrendingUp} size={14} className="text-emerald-400 animate-bounce" />
                                  ) : (
                                    <Icon lucide={TrendingDown} size={14} className="text-rose-500 animate-bounce" />
                                  )}
                                  <span className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider">Tăng trưởng ròng</span>
                                </div>
                                <span className={`text-xl font-black ${netGrowth >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                  {netGrowth >= 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-full h-[350px] mt-2 relative">
                            {followsAndUnfollows.length === 0 ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-foreground/20 text-sm">Chưa có dữ liệu biến động cho khoảng thời gian này</span>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={followsAndUnfollows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorUnfollow" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                                  <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10 }}
                                    dy={10}
                                  />
                                  <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10 }}
                                    allowDecimals={false}
                                  />
                                  <Tooltip 
                                    content={({ active, payload, label }: any) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-3 rounded-2xl shadow-2xl min-w-[140px] font-sans">
                                            <div className="text-[10px] text-foreground-secondary/40 font-bold uppercase tracking-wider mb-2">{label}</div>
                                            <div className="space-y-1.5">
                                              {payload.map((item: never, i: number) => (
                                                <div key={i} className="flex items-center justify-between gap-6">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-xs font-medium text-foreground-secondary">{item.name}</span>
                                                  </div>
                                                  <span className="text-xs font-black text-foreground" style={{ color: item.color }}>
                                                    +{item.value.toLocaleString()}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                    cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 1 }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="follows" 
                                    name="Follows"
                                    stroke="#10b981" 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorFollow)" 
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="unfollows" 
                                    name="Unfollows"
                                    stroke="#f43f5e" 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorUnfollow)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
                          <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              <Icon lucide={TrendingUp} size={18} className="text-orange-400" />
                              Xu hướng Followers
                            </h3>
                            <p className="text-foreground-secondary/40 text-xs mt-1">
                              Tổng số lượng người theo dõi tích lũy của trang theo thời gian
                            </p>
                          </div>

                          <div style={{ width: '100%', height: '350px' }} className="relative mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                <defs>
                                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                    <stop offset="50%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                                  dy={10}
                                  interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                                  domain={['dataMin - 100', 'dataMax + 100']}
                                  allowDecimals={false}
                                />
                                <Tooltip 
                                  content={<CustomTooltip activeMetric="followers" />}
                                  cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="followers" 
                                  stroke="#f97316" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorFollowers)" 
                                  connectNulls
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Demographics details for Instagram */}
          {isInstagram && (
            <div className="mt-6">
              <FollowerDetailedSection
                accountId={selectedAccountId}
                range={range}
                customStart={cStart}
                customEnd={cEnd}
                activeTimes={latestWithActiveTimes?.activeTimes || null}
              />
            </div>
          )}
          
              {/* Insufficient Data Guard */}
              {data?.data?.current[data.data.current.length - 1]?.insufficientData ? (
                <InsufficientDataState />
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <EngagementBreakdownChart 
                      accountId={selectedAccountId} 
                      range={range} 
                      customStart={cStart} 
                      customEnd={cEnd} 
                    />
                    <PostFrequencyChart 
                      accountId={selectedAccountId} 
                      range={range} 
                      customStart={cStart} 
                      customEnd={cEnd} 
                    />
                  </div>


                </>
              )}
        </>
      )}

      <AnimatePresence>
        {selectedPostForDetail && (
          <PostDetailModal
            post={selectedPostForDetail}
            onClose={() => setSelectedPostForDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
