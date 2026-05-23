import React from 'react';
import { Users, Eye, TrendingUp, Activity } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

export type ChartType = 'performance' | 'followers' | 'post-performance';

interface ChartSelectorProps {
  activeChart: ChartType;
  setActiveChart: (chart: ChartType) => void;
  isInstagram: boolean;
  isFollowerInsufficientData: boolean;
}

export function ChartSelector({
  activeChart,
  setActiveChart,
  isInstagram,
  isFollowerInsufficientData,
}: ChartSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-base-200/50 border border-base-content/5 p-2 rounded-2xl">
      <div className="flex flex-wrap p-1 bg-base-300/30 border border-base-content/5 rounded-xl select-none gap-1">
        <button
          onClick={() => setActiveChart('performance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'performance'
              ? 'bg-info text-info-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={Activity} size={14} className={activeChart === 'performance' ? 'text-info-content' : 'text-info'} />
          Hiệu suất & Tương tác
        </button>
        <button
          onClick={() => setActiveChart('followers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'followers'
              ? 'bg-warning text-warning-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={TrendingUp} size={14} className={activeChart === 'followers' ? 'text-warning-content' : 'text-warning'} />
          {isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers'}
        </button>
        <button
          onClick={() => setActiveChart('post-performance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'post-performance'
              ? 'bg-accent text-accent-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={Users} size={14} className={activeChart === 'post-performance' ? 'text-accent-content' : 'text-accent'} />
          Xu hướng Bài viết
        </button>
      </div>

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

