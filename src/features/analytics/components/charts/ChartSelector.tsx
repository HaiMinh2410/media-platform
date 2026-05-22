import React from 'react';
import { Users, Eye, TrendingUp } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

export type ChartType = 'reach-engagement' | 'views-interactions' | 'followers';

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
          onClick={() => setActiveChart('reach-engagement')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 font-brand ${
            activeChart === 'reach-engagement'
              ? 'bg-info text-info-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={Users} size={14} className={activeChart === 'reach-engagement' ? 'text-info-content' : 'text-info'} />
          Tiếp cận & Tương tác
        </button>
        <button
          onClick={() => setActiveChart('views-interactions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 font-brand ${
            activeChart === 'views-interactions'
              ? 'bg-secondary text-secondary-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={Eye} size={14} className={activeChart === 'views-interactions' ? 'text-secondary-content' : 'text-secondary'} />
          Lượt xem & Tương tác
        </button>
        <button
          onClick={() => setActiveChart('followers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 font-brand ${
            activeChart === 'followers'
              ? 'bg-warning text-warning-content shadow-sm scale-[1.02]'
              : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
          }`}
        >
          <Icon lucide={TrendingUp} size={14} className={activeChart === 'followers' ? 'text-warning-content' : 'text-warning'} />
          {isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers'}
        </button>
      </div>

      <div className="text-base-content/40 text-xs font-bold px-2 font-brand">
        {activeChart === 'reach-engagement' && 'Hiệu suất thu hút (Reach vs Engagement)'}
        {activeChart === 'views-interactions' && 'Hiệu suất chuyển đổi (Views vs Interactions)'}
        {activeChart === 'followers' &&
          (isInstagram && !isFollowerInsufficientData
            ? 'Biến động theo dõi kênh'
            : 'Biểu đồ tăng trưởng người theo dõi')}
      </div>
    </div>
  );
}
