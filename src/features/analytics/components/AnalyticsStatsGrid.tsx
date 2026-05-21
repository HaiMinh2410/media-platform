import React from 'react';
import { Users, UserCheck, Link2, TrendingUp } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { StatsCard, SkeletonStatsCard } from '@features/analytics/components/stats-card';

interface AnalyticsStatsGridProps {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  totals: any;
  chartData: Array<{
    reach: number;
    profileVisits: number;
    profileLinksTaps: number;
    followers: number;
  }>;
}

export function AnalyticsStatsGrid({
  isPending,
  isError,
  isFetching,
  totals,
  chartData
}: AnalyticsStatsGridProps) {
  return (
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
  );
}
