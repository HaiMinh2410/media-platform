/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { 
  BarChart3, Layers, Sparkles, Users
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
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* GLOBAL HEADER BAR (TABS SELECTOR & CONTROLS TOOLBAR) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-base-content/5">
        {/* TABS SELECTOR */}
        <div className="flex flex-wrap gap-1.5 bg-base-200/70 border border-base-content/5 rounded-2xl p-1.5 select-none w-fit shadow-inner">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
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
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'content'
                ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            <Icon lucide={Layers} size={14} className={activeTab === 'content' ? 'text-primary-content' : 'text-secondary'} />
            <span>Bài viết</span>
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'audience'
                ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            <Icon lucide={Users} size={14} className={activeTab === 'audience' ? 'text-primary-content' : 'text-success'} />
            <span>Khán giả</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            <Icon lucide={Sparkles} size={14} className={activeTab === 'ai' ? 'text-primary-content animate-pulse' : 'text-accent'} />
            <span>AI Insights</span>
          </button>
        </div>

        {/* GLOBAL CONTROLS */}
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
          activeTab={activeTab}
        />
      </div>

      {activeTab === 'ai' ? (
        <div className="-mx-6 -my-4">
          <AIAnalyticsPage onBack={() => setActiveTab('general')} />
        </div>
      ) : activeTab === 'content' ? (
        <ContentInsightsSection 
          accountId={selectedAccountId} 
          range={range}
          customStart={customStart}
          customEnd={customEnd}
        />
      ) : activeTab === 'audience' ? (
        <div className="space-y-6">
          
          {isInstagram ? (
            <FollowerDetailedSection
              accountId={selectedAccountId}
              range={range}
              customStart={cStart}
              customEnd={cEnd}
              activeTimes={latestWithActiveTimes?.activeTimes || null}
            />
          ) : (
            <div className="w-full h-[400px] flex flex-col items-center justify-center bg-base-100 border border-base-content/5 shadow-xs rounded-3xl p-6 text-center">
              <div className="p-4 bg-info/10 border border-info/20 rounded-full mb-4 text-info">
                <Icon lucide={Users} size={28} />
              </div>
              <h3 className="text-base-content font-bold mb-2 text-lg">Phân tích Đối tượng chi tiết</h3>
              <p className="text-base-content/50 text-sm max-w-sm font-medium">
                Tính năng phân tích đối tượng chi tiết hiện tại chỉ được hỗ trợ dành cho tài khoản Instagram Connect. Vui lòng chuyển đổi sang tài khoản Instagram để xem thông tin chi tiết.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>

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
              insufficientData={data?.data?.current[data?.data?.current?.length - 1]?.insufficientData ?? false}
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
            deepAnalyticsData={deepAnalyticsData}
            isDeepAnalyticsLoading={isDeepAnalyticsLoading}
          />


          

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
