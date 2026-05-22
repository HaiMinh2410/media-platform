/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonChart, CustomTooltip } from '@features/analytics/components/dashboard-states';
import { ChartSelector, ChartType } from './charts/ChartSelector';
import { ReachEngagementChart } from './charts/ReachEngagementChart';
import { ViewsInteractionsChart } from './charts/ViewsInteractionsChart';
import { FollowersChart } from './charts/FollowersChart';

interface AnalyticsChartsSectionProps {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  totals: any;
  range: string;
  isInstagram: boolean;
  isFollowerInsufficientData: boolean;
  followsAndUnfollows: any[];
  totalFollows: number;
  totalUnfollows: number;
  netGrowth: number;
  chartData: any[];
  activeChart: ChartType;
  setActiveChart: (chart: ChartType) => void;
  avgReach: number;
  avgEngagement: number;
  avgEngagementRate: number;
  engagementInsight: any;
  avgViews: number;
  avgInteractions: number;
  avgInteractionRate: number;
  interactionInsight: any;
}

export function AnalyticsChartsSection({
  isPending,
  isError,
  isFetching,
  totals,
  range,
  isInstagram,
  isFollowerInsufficientData,
  followsAndUnfollows,
  totalFollows,
  totalUnfollows,
  netGrowth,
  chartData,
  activeChart,
  setActiveChart,
  avgReach,
  avgEngagement,
  avgEngagementRate,
  engagementInsight,
  avgViews,
  avgInteractions,
  avgInteractionRate,
  interactionInsight
}: AnalyticsChartsSectionProps) {
  return (
    <div className={`bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 min-h-[450px] transition-all duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
      {/* CHART SELECTOR BUTTONS */}
      <ChartSelector
        activeChart={activeChart}
        setActiveChart={setActiveChart}
        isInstagram={isInstagram}
        isFollowerInsufficientData={isFollowerInsufficientData}
      />

      {/* CHARTS CONTAINER */}
      {isPending ? (
        <SkeletonChart />
      ) : isError || !totals ? (
        <div className="w-full h-[350px] flex items-center justify-center bg-base-200/30 rounded-xl border border-base-content/10 font-sans">
          <span className="text-base-content/40 font-semibold">Chưa có dữ liệu thống kê biểu đồ</span>
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
              <ReachEngagementChart
                chartData={chartData}
                range={range}
                avgReach={avgReach}
                avgEngagement={avgEngagement}
                avgEngagementRate={avgEngagementRate}
                engagementInsight={engagementInsight}
              />
            )}

            {activeChart === 'views-interactions' && (
              <ViewsInteractionsChart
                chartData={chartData}
                range={range}
                avgViews={avgViews}
                avgInteractions={avgInteractions}
                avgInteractionRate={avgInteractionRate}
                interactionInsight={interactionInsight}
              />
            )}

            {activeChart === 'followers' && (
              <FollowersChart
                isInstagram={isInstagram}
                isFollowerInsufficientData={isFollowerInsufficientData}
                followsAndUnfollows={followsAndUnfollows}
                totalFollows={totalFollows}
                totalUnfollows={totalUnfollows}
                netGrowth={netGrowth}
                chartData={chartData}
                range={range}
                CustomTooltip={CustomTooltip}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
