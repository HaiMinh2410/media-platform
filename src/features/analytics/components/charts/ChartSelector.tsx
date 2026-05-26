import React from 'react';
import { Users, Eye, TrendingUp, Activity } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { SlidingTabs } from '@shared/ui/sliding-tabs';

export type ChartType = 'performance' | 'followers' | 'post-performance';

interface ChartSelectorProps {
  activeChart: ChartType;
  setActiveChart: (chart: ChartType) => void;
  isInstagram: boolean;
  isFollowerInsufficientData: boolean;
  isLoading?: boolean;
}

export function ChartSelector({
  activeChart,
  setActiveChart,
  isInstagram,
  isFollowerInsufficientData,
  isLoading,
}: ChartSelectorProps) {
  const tabItems = React.useMemo(() => [
    { 
      value: 'performance' as const, 
      label: 'Hiệu suất & Tương tác', 
      icon: Activity,
      activeBgClass: 'bg-info',
      activeTextClass: 'text-info-content'
    },
    { 
      value: 'followers' as const, 
      label: isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers', 
      icon: TrendingUp,
      activeBgClass: 'bg-warning',
      activeTextClass: 'text-warning-content'
    },
    { 
      value: 'post-performance' as const, 
      label: 'Xu hướng Bài viết', 
      icon: Users,
      activeBgClass: 'bg-accent',
      activeTextClass: 'text-accent-content'
    },
  ], [isInstagram, isFollowerInsufficientData]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="h-8 w-80 bg-base-200 rounded-xl border border-base-content/5 skeleton" />
        <div className="h-4 w-60 bg-base-200 rounded-md skeleton" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <SlidingTabs
        items={tabItems}
        activeValue={activeChart}
        onChange={setActiveChart}
        size="sm"
        layoutId="chartSelectorIndicator"
        className="bg-base-300/30"
      />

      <div className="text-base-content/40 text-xs font-bold px-2">
        {activeChart === 'performance' && 'Phân tích tổng hợp tiếp cận, lượt xem và tương tác'}
        {activeChart === 'followers' &&
          (isInstagram && !isFollowerInsufficientData
            ? 'Biến động theo dõi kênh'
            : 'Biểu đồ tăng trưởng người theo dõi')}
        {activeChart === 'post-performance' && 'Xu hướng hiệu suất bài đăng theo thời gian'}
      </div>
    </div>
  );
}

