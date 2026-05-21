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
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-foreground/1 border border-foreground/10 p-2 rounded-2xl">
      <div className="flex flex-wrap p-1 bg-foreground/5 border border-foreground/10 rounded-xl select-none gap-1">
        <button
          onClick={() => setActiveChart('reach-engagement')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'reach-engagement'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Icon lucide={Users} size={14} />
          Tiếp cận & Tương tác
        </button>
        <button
          onClick={() => setActiveChart('views-interactions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'views-interactions'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/10'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Icon lucide={Eye} size={14} />
          Lượt xem & Tương tác
        </button>
        <button
          onClick={() => setActiveChart('followers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeChart === 'followers'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Icon lucide={TrendingUp} size={14} />
          {isInstagram && !isFollowerInsufficientData ? 'Biến động Followers' : 'Xu hướng Followers'}
        </button>
      </div>

      <div className="text-foreground-secondary/40 text-xs font-semibold px-2">
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
