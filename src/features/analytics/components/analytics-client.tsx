/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { BarChart3, Layers, Bot, Users, Calendar, Globe } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { SlidingTabs } from "@shared/ui/sliding-tabs";
import { Icon } from "@shared/ui/icon";
import { AnalyticsPeriodData } from "@features/analytics/types";
import { ViewsCard } from "@features/analytics/components/views-card";
import { InteractionsCard } from "@features/analytics/components/interactions-card";
import { PostChartsDashboard } from "@features/analytics/components/post-charts-dashboard";
import { TopContentLeaderboard } from "@features/analytics/components/top-content-leaderboard";
import { PostDetailModal } from "@features/analytics/components/post-detail-modal";
import { FollowerDetailedSection } from "@features/analytics/components/follower-detailed-section";
import { ContentInsightsSection } from "@features/analytics/components/content-insights-section";
import { ReauthNotice } from "@features/analytics/components/dashboard-states";
import { AIInsightsSection } from "./ai-insights-section";
import { useAnalyticsDashboard } from "@features/analytics/hooks/useAnalyticsDashboard";
import { AnalyticsDashboardHeader } from "./AnalyticsDashboardHeader";
import { AnalyticsStatsGrid } from "./AnalyticsStatsGrid";
import { AnalyticsChartsSection } from "./AnalyticsChartsSection";

type Props = {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
};

export function AnalyticsDashboardClient({ initialData, accounts }: Props) {
  const dashboard = useAnalyticsDashboard({ initialData, accounts });

  const {
    selectedAccountId,
    setSelectedAccountId,
    platform,
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
    syncType,
    isPostAllTime,
    setIsPostAllTime,
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
    handleSyncAll,
  } = dashboard;
  const [deferredActiveTab, setDeferredActiveTab] = React.useState(activeTab);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredActiveTab(activeTab);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const tabItems = React.useMemo(
    () =>
      [
        { value: "general", label: "Account Insights", icon: BarChart3 },
        { value: "content", label: "Content", icon: Layers },
        { value: "audience", label: "Audience", icon: Users },
        { value: "ai", label: "AI Insights", icon: Bot },
      ] as const,
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* GLOBAL HEADER BAR (TABS SELECTOR & CONTROLS TOOLBAR) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-base-content/5">
        {/* TABS SELECTOR */}
        <SlidingTabs
          items={tabItems}
          activeValue={activeTab}
          onChange={setActiveTab}
          size="md"
        />

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
          syncType={syncType}
          handleSync={handleSync}
          handleSyncAll={handleSyncAll}
          activeTab={activeTab}
        />
      </div>

      {deferredActiveTab === "ai" ? (
        <AIInsightsSection />
      ) : deferredActiveTab === "content" ? (
        <ContentInsightsSection
          accountId={selectedAccountId}
          range={range}
          customStart={customStart}
          customEnd={customEnd}
        />
      ) : deferredActiveTab === "audience" ? (
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
            <div className="w-full h-[400px] flex flex-col items-center justify-center bg-base-100 border border-base-content/5 shadow-xs rounded-3xl p-6 text-center gap-4">
              <div className="p-4 bg-info/10 border border-info/20 rounded-full text-info shrink-0">
                <Icon lucide={Users} size={28} />
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <h3 className="text-base-content font-bold text-lg">
                  Phân tích Đối tượng chi tiết
                </h3>
                <p className="text-base-content/50 text-sm font-medium leading-relaxed">
                  Tính năng phân tích đối tượng chi tiết hiện tại chỉ được hỗ
                  trợ dành cho tài khoản Instagram Connect. Vui lòng chuyển đổi
                  sang tài khoản Instagram để xem thông tin chi tiết.
                </p>
              </div>
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
          {needsReauth && <ReauthNotice />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
            <ViewsCard {...viewsData} isLoading={isPending} />
            <InteractionsCard {...interactionsData} isLoading={isPending} />
          </div>

          <AnalyticsChartsSection
            isPending={isPending}
            isError={isError}
            isFetching={isFetching}
            totals={totals}
            range={range}
            platform={platform}
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

          <div className="grid grid-cols-1 gap-6 mb-6">
            <PostChartsDashboard
              accountId={selectedAccountId}
              range={isPostAllTime ? "all" : range}
              customStart={isPostAllTime ? undefined : cStart}
              customEnd={isPostAllTime ? undefined : cEnd}
              data={deepAnalyticsData}
              isLoading={isDeepAnalyticsLoading}
              insufficientData={
                data?.data?.current[data?.data?.current?.length - 1]
                  ?.insufficientData ?? false
              }
              isPostAllTime={isPostAllTime}
              setIsPostAllTime={setIsPostAllTime}
            />

            <TopContentLeaderboard
              data={deepAnalyticsData?.leaderboard ?? null}
              isLoading={isDeepAnalyticsLoading}
              onOpenPostDetail={(postId) => {
                const found = deepAnalyticsData?.leaderboard.find(
                  (p: any) => p.postId === postId,
                );
                if (found) setSelectedPostForDetail(found);
              }}
            />
          </div>
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
