// src/features/analytics/components/ai-insights-section.tsx
'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAIInsights } from './ai-insights/hooks/use-ai-insights';
import { AIInsightsSkeleton } from './ai-insights/components/ai-insights-skeleton';
import { AIInsightsHeader } from './ai-insights/components/ai-insights-header';
import { AIInsightsWidgets } from './ai-insights/components/ai-insights-widgets';
import { FanDistributionChart } from './ai-insights/components/fan-distribution-chart';
import { ConversionTrendChart } from './ai-insights/components/conversion-trend-chart';
import { ABTestingPerformance } from './ai-insights/components/ab-testing-performance';
import { EngagementFunnel } from './ai-insights/components/engagement-funnel';
import { ScriptsPerformanceTable } from './ai-insights/components/scripts-performance-table';

export function AIInsightsSection() {
  const {
    mounted,
    timeRange,
    setTimeRange,
    searchQuery,
    setSearchQuery,
    selectedFanType,
    setSelectedFanType,
    data,
    loading,
    fetchMetrics,
    filteredScripts
  } = useAIInsights();

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm font-semibold text-base-content/40 font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Đang chuẩn bị giao diện...</span>
      </div>
    );
  }

  if (loading || !data) {
    return <AIInsightsSkeleton />;
  }

  const { widgets, distribution, history, abTest } = data;

  return (
    <div className="space-y-6 select-none">
      {/* HEADER SECTION */}
      <AIInsightsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        fetchMetrics={fetchMetrics}
      />

      {/* QUICK STATUS WIDGETS GRID */}
      <AIInsightsWidgets widgets={widgets} />

      {/* CORE GRAPH CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <FanDistributionChart
          distribution={distribution}
          totalFans={widgets.totalFans}
        />
        <ConversionTrendChart
          history={history}
          totalRevenue={widgets.totalRevenue}
          overallConversionRate={widgets.overallConversionRate}
        />
      </div>

      {/* MID ROW: A/B TESTING PERFORMANCE & FUNNEL PROGRESSION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ABTestingPerformance abTest={abTest} />
        <EngagementFunnel />
      </div>

      {/* TOP PERFORMING SCRIPTS */}
      <ScriptsPerformanceTable
        filteredScripts={filteredScripts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFanType={selectedFanType}
        setSelectedFanType={setSelectedFanType}
      />
    </div>
  );
}
