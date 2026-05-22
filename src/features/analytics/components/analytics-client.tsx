/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { 
  BarChart3, Layers, Sparkles
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Icon } from '@shared/ui/icon';
import { AnalyticsPeriodData } from '@features/analytics/types';
import { ViewsCard } from '@features/analytics/components/views-card';
import { InteractionsCard } from '@features/analytics/components/interactions-card';
import { PostChartsDashboard } from '@features/analytics/components/post-charts-dashboard';
import { TopContentLeaderboard } from '@features/analytics/components/top-content-leaderboard';
import { PostDetailModal } from '@features/analytics/components/post-detail-modal';
import { FollowerDetailedSection } from '@features/analytics/components/follower-detailed-section';
import { EngagementBreakdownChart } from '@features/analytics/components/engagement-breakdown-chart';
import { PostFrequencyChart } from '@features/analytics/components/post-frequency-chart';
import { ContentInsightsSection } from '@features/analytics/components/content-insights-section';
import { 
  InsufficientDataState, ReauthNotice
} from '@features/analytics/components/dashboard-states';
import AIAnalyticsPage from '@/app/dashboard/ai-analytics/page';
import { useAnalyticsDashboard } from '@features/analytics/hooks/useAnalyticsDashboard';
import { AnalyticsDashboardHeader } from './AnalyticsDashboardHeader';
import { AnalyticsStatsGrid } from './AnalyticsStatsGrid';
import { AnalyticsChartsSection } from './AnalyticsChartsSection';

type Props = {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
};

export function AnalyticsDashboardClient({ initialData, accounts }: Props) {
  const dashboard = useAnalyticsDashboard({ initialData, accounts });
  
  const {
    selectedAccountId,
    setSelectedAccountId,
    range,
    setRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    cStart,
    cEnd,
    activeTab,
    setActiveTab,
    activeChart,
    setActiveChart,
    isSyncing,
    selectedPostForDetail,
    setSelectedPostForDetail,
    isPending,
    isError,
    isFetching,
    isInstagram,
    isFollowerInsufficientData,
    followsAndUnfollows,
    totalFollows,
    totalUnfollows,
    netGrowth,
    deepAnalyticsData,
    isDeepAnalyticsLoading,
    totals,
    chartData,
    viewsData,
    interactionsData,
    avgReach,
    avgEngagement,
    avgEngagementRate,
    engagementInsight,
    avgViews,
    avgInteractions,
    avgInteractionRate,
    interactionInsight,
    latestWithActiveTimes,
    needsReauth,
    data,
    handleSync,
    handleSyncAll
  } = dashboard;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto">
      {/* TABS SELECTOR */}
      <div className="flex flex-wrap gap-1.5 bg-base-200/70 border border-base-content/5 rounded-2xl p-1.5 select-none w-fit shadow-inner mb-2 self-start">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer font-brand ${
            activeTab === 'general'
              ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
          }`}
        >
          <Icon lucide={BarChart3} size={14} className={activeTab === 'general' ? 'text-primary-content' : 'text-info'} />
          <span>Tổng quan Kênh</span>
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer font-brand ${
            activeTab === 'content'
              ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
          }`}
        >
          <Icon lucide={Layers} size={14} className={activeTab === 'content' ? 'text-primary-content' : 'text-secondary'} />
          <span>Bài viết</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer font-brand ${
            activeTab === 'ai'
              ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
          }`}
        >
          <Icon lucide={Sparkles} size={14} className={activeTab === 'ai' ? 'text-primary-content animate-pulse' : 'text-accent'} />
          <span>AI Insights</span>
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
          <AnalyticsDashboardHeader
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            range={range}
            setRange={setRange}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            isSyncing={isSyncing}
            handleSync={handleSync}
            handleSyncAll={handleSyncAll}
          />

          <AnalyticsStatsGrid
            isPending={isPending}
            isError={isError}
            isFetching={isFetching}
            totals={totals}
            chartData={chartData}
          />

          {/* Reauth Notice */}
          {needsReauth && (
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

          <AnalyticsChartsSection
            isPending={isPending}
            isError={isError}
            isFetching={isFetching}
            totals={totals}
            range={range}
            isInstagram={isInstagram}
            isFollowerInsufficientData={isFollowerInsufficientData}
            followsAndUnfollows={followsAndUnfollows}
            totalFollows={totalFollows}
            totalUnfollows={totalUnfollows}
            netGrowth={netGrowth}
            chartData={chartData}
            activeChart={activeChart}
            setActiveChart={setActiveChart}
            avgReach={avgReach}
            avgEngagement={avgEngagement}
            avgEngagementRate={avgEngagementRate}
            engagementInsight={engagementInsight}
            avgViews={avgViews}
            avgInteractions={avgInteractions}
            avgInteractionRate={avgInteractionRate}
            interactionInsight={interactionInsight}
          />

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
