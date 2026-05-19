'use client';

import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, BarChart3, Eye, MousePointer2, TrendingUp, RefreshCw, 
  CloudDownload, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/icon';
import { 
  getAnalyticsAction, syncAnalyticsAction, syncAllAccountsAction 
} from '@/application/actions/analytics.actions';
import { AnalyticsPeriodData, AnalyticsRange } from '@/domain/types/analytics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calcSummary, fillDateGaps, getXAxisFormatter } from '@/lib/analytics-utils';
import { ViewsCard } from '@/components/analytics/views-card';
import { InteractionsCard } from '@/components/analytics/interactions-card';
import { TopContentGridWrapper } from '@/components/analytics/top-content-grid';
import { ActiveTimesChart } from '@/components/analytics/active-times-chart';
import { ProfileCard } from '@/components/analytics/profile-card';
import { FollowerDetailedSection } from '@/components/analytics/follower-detailed-section';
import { AccountSelector } from '@/components/analytics/account-selector';
import { StatsCard, SkeletonStatsCard } from '@/components/analytics/stats-card';
import { EngagementBreakdownChart } from '@/components/analytics/engagement-breakdown-chart';
import { PostFrequencyChart } from '@/components/analytics/post-frequency-chart';
import { ContentInsightsSection } from '@/components/analytics/content-insights-section';
import { 
  SkeletonChart, InsufficientDataState, ReauthNotice, CustomTooltip, ActiveMetric 
} from '@/components/analytics/dashboard-states';
import AIAnalyticsPage from '../ai-analytics/page';
import './analytics.css';

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
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('reach');
  const [isSyncing, setIsSyncing] = useState(false);
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
      reach: s.reach,
      engagement: s.engagement,
      impressions: s.impressions,
      followers: s.followers,
      prevReach: prev?.reach ?? 0,
      prevEngagement: prev?.engagement ?? 0,
      prevImpressions: prev?.impressions ?? 0,
      prevFollowers: prev?.followers ?? 0,
    };
  });

  const getMetricConfig = (metric: ActiveMetric) => {
    switch (metric) {
      case 'reach': return { color: '#3b82f6', gradientId: 'colorReach', label: 'Reach' };
      case 'impressions': return { color: '#a855f7', gradientId: 'colorImpressions', label: 'Impressions' };
      case 'engagement': return { color: '#10b981', gradientId: 'colorEng', label: 'Engagement' };
      case 'followers': return { color: '#f97316', gradientId: 'colorFollowers', label: 'Followers' };
    }
  };

  const activeConfig = getMetricConfig(activeMetric);
  
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
          let posts = Number((p / total * 100).toFixed(1));
          let reels = Number((r / total * 100).toFixed(1));
          let stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
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
        let posts = Number((p / total * 100).toFixed(1));
        let reels = Number((r / total * 100).toFixed(1));
        let stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
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

  return (
    <div className="analytics-container">
      {/* TABS SELECTOR */}
      <div className="flex border-b border-white/5 mb-4 select-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-white bg-white/[0.02]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={BarChart3} size={14} />
          <span>Tổng quan Kênh</span>
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'content'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.01]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={Layers} size={14} className={activeTab === 'content' ? "text-indigo-500" : "text-white/30"} />
          <span>Bài viết</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-pink-500 text-pink-400 bg-pink-500/[0.01]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={Sparkles} size={14} className={activeTab === 'ai' ? "text-pink-500 animate-pulse" : "text-white/30"} />
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
          <div className="analytics-header">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-white/50 text-sm">Track your performance across platforms</p>
            </div>
            
            <div className="filter-controls items-center">
              <div className="range-selector">
                {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`range-btn ${range === r ? 'active' : ''}`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
                <button 
                  onClick={() => setRange('custom')}
                  className={`range-btn ${range === 'custom' ? 'active' : ''}`}
                >
                  Custom
                </button>
              </div>

              {range === 'custom' && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-right-2 duration-300">
                  <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                  <span className="text-white/20 text-xs">→</span>
                  <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                </div>
              )}
              
              <div className="h-8 w-[1px] bg-white/10 mx-1" />
              
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
                    ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50' 
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
                    ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50 text-white/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                }`}
                title="Đồng bộ tất cả tài khoản"
              >
                <Icon lucide={CloudDownload} size={14} className={isSyncing ? 'animate-pulse text-blue-400' : ''} />
                <span className="hidden sm:inline">Sync All</span>
              </button>
            </div>
          </div>

          <div className={`stats-grid transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
            {isPending ? (
              <>
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
              </>
            ) : isError || !totals ? (
              <div className="col-span-4 p-4 text-center text-white/50 bg-white/5 rounded-xl border border-red-500/20">
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
                  isActive={activeMetric === 'reach'}
                  onClick={() => setActiveMetric('reach')}
                  activeColor="#3b82f6"
                />
                <StatsCard 
                  label="Impressions" 
                  value={totals.impressions.value.toLocaleString()} 
                  icon={<Icon lucide={Eye} className="text-purple-400" size={20} />} 
                  trend={totals.impressions.trend.display} 
                  isPositive={totals.impressions.trend.isPositive}
                  sparklineData={chartData.map(d => d.impressions || 0)}
                  isActive={activeMetric === 'impressions'}
                  onClick={() => setActiveMetric('impressions')}
                  activeColor="#a855f7"
                />
                <StatsCard 
                  label="Engagement" 
                  value={totals.engagement.value.toLocaleString()} 
                  icon={<Icon lucide={MousePointer2} className="text-emerald-400" size={20} />} 
                  trend={totals.engagement.trend.display} 
                  isPositive={totals.engagement.trend.isPositive}
                  sparklineData={chartData.map(d => d.engagement || 0)}
                  isActive={activeMetric === 'engagement'}
                  onClick={() => setActiveMetric('engagement')}
                  activeColor="#10b981"
                />
                <StatsCard 
                  label="Followers" 
                  value={totals.followers.value.toLocaleString()} 
                  icon={<Icon lucide={TrendingUp} className="text-orange-400" size={20} />} 
                  trend={totals.followers.trend.display} 
                  isPositive={totals.followers.trend.isPositive}
                  delta={totals.followers.delta}
                  sparklineData={chartData.map(d => d.followers || 0)}
                  isActive={activeMetric === 'followers'}
                  onClick={() => setActiveMetric('followers')}
                  activeColor="#f97316"
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

          <div className="mb-6">
            <TopContentGridWrapper 
              accountId={selectedAccountId} 
              onSeeAll={() => setActiveTab('content')}
            />
          </div>

          {activeMetric === 'followers' && accounts.find(a => a.id === selectedAccountId)?.platform === 'instagram' ? (
            <FollowerDetailedSection
              accountId={selectedAccountId}
              range={range}
              customStart={cStart}
              customEnd={cEnd}
            />
          ) : (
            <>
              <div className={`chart-container transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
                <h2 className="chart-title">{activeConfig?.label} Trend</h2>
                {isPending ? (
                  <SkeletonChart />
                ) : isError || !totals ? (
                  <div className="w-full h-[350px] flex items-center justify-center bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-white/40">No data available</span>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '350px' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeMetric}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <ResponsiveContainer>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#a855f7" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#f97316" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                              dy={10}
                              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                              domain={activeMetric === 'followers' ? ['dataMin - 100', 'dataMax + 100'] : [0, 'auto']}
                              allowDecimals={false}
                            />
                            <Tooltip 
                              content={<CustomTooltip activeMetric={activeMetric} />}
                              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey={activeMetric} 
                              stroke={activeConfig?.color} 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill={`url(#${activeConfig?.gradientId})`} 
                              connectNulls
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>

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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-1">
                      <ProfileCard 
                        visits={totals?.profileVisits?.value || 0}
                        taps={totals?.profileLinksTaps?.value || 0}
                        isLoading={isPending}
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <ActiveTimesChart 
                        activeTimes={latestWithActiveTimes?.activeTimes || null}
                        totalFollowers={totals?.followers?.value || 0}
                        isLoading={isPending}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
