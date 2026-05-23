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
    followersNetGrowth?: number;
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
        <div className="col-span-4 p-6 text-center text-base-content/70 bg-base-200/50 rounded-2xl border border-error/20">
          Không thể tải dữ liệu phân tích.
        </div>
      ) : (
        <>
          <StatsCard 
            label="Total Reach" 
            value={totals.reach.value.toLocaleString()} 
            icon={<Icon lucide={Users} className="text-info" size={20} />} 
            trend={totals.reach.trend.display} 
            isPositive={totals.reach.trend.isPositive}
            sparklineData={chartData.map(d => d.reach || 0)}
            activeColor="var(--color-info)"
          />
          <StatsCard 
            label="Profile Visits" 
            value={totals.profileVisits.value.toLocaleString()} 
            icon={<Icon lucide={UserCheck} className="text-secondary" size={20} />} 
            trend={totals.profileVisits.trend.display} 
            isPositive={totals.profileVisits.trend.isPositive}
            sparklineData={chartData.map(d => d.profileVisits || 0)}
            activeColor="var(--color-secondary)"
          />
          <StatsCard 
            label="Website Taps" 
            value={totals.profileLinksTaps.value.toLocaleString()} 
            icon={<Icon lucide={Link2} className="text-success" size={20} />} 
            trend={totals.profileLinksTaps.trend.display} 
            isPositive={totals.profileLinksTaps.trend.isPositive}
            sparklineData={chartData.map(d => d.profileLinksTaps || 0)}
            activeColor="var(--color-success)"
          />
          <StatsCard 
            label="Followers" 
            value={totals.followers.value.toLocaleString()} 
            icon={<Icon lucide={TrendingUp} className="text-warning" size={20} />} 
            trend={totals.followers.trend.display} 
            isPositive={totals.followers.trend.isPositive}
            delta={totals.followers.delta}
            sparklineData={chartData.map(d => d.followersNetGrowth || 0)}
            activeColor="var(--color-warning)"
          />
        </>
      )}
    </div>
  );
}
