'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Grid3X3, 
  Users, 
  Sparkles,
  Activity
} from 'lucide-react';
import { SlidingTabs } from '@shared/ui/sliding-tabs';
import { cn } from '@shared/lib/utils';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';
import type { AnalyticsRange } from '@features/analytics/types';
import { DistributionTab } from './post-charts/DistributionTab';
import { FollowsTab } from './post-charts/FollowsTab';
import { PostChartsSkeleton } from './post-charts/PostChartsSkeleton';
import { EngagementFrequencyTab } from './post-charts/EngagementFrequencyTab';
import { InsufficientDataState } from './dashboard-states';

interface PostChartsDashboardProps {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
  data: PostDeepAnalyticsData | null;
  isLoading?: boolean;
  insufficientData?: boolean;
  isPostAllTime: boolean;
  setIsPostAllTime: (val: boolean) => void;
}

type TabType = 'distribution' | 'follows' | 'engagement-frequency';

export function PostChartsDashboard({
  accountId,
  range,
  customStart,
  customEnd,
  data,
  isLoading = false,
  insufficientData = false,
  isPostAllTime,
  setIsPostAllTime
}: PostChartsDashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('distribution');

  const tabItems = React.useMemo(() => [
    { value: 'distribution', label: 'Thời điểm & Chuyển đổi', icon: Grid3X3 },
    { value: 'follows', label: 'Tăng trưởng Follower', icon: Users },
    { value: 'engagement-frequency', label: 'Tương tác & Tần suất', icon: Activity }
  ] as const, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !data) {
    return <PostChartsSkeleton />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'distribution':
        return <DistributionTab data={data} />;
      case 'follows':
        return <FollowsTab data={data} />;
      case 'engagement-frequency':
        return insufficientData ? (
          <InsufficientDataState />
        ) : (
          <EngagementFrequencyTab data={data} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md">
      {/* Header and Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-base-content tracking-tight">Thống kê Nội dung Nâng cao</h2>
            </div>
            
            {/* Minimal Checkbox Selector */}
            <label className="flex items-end gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isPostAllTime}
                onChange={(e) => setIsPostAllTime(e.target.checked)}
                className="checkbox checkbox-sm rounded-sm border-primary/80 bg-primary/30 checked:border-success checked:bg-success checked:text-forground"
              />
              <span className="text-sm font-semibold text-base-content/50 tracking-wider">All time</span>
            </label>
          </div>
        </div>

        {/* Bento Switcher Tabs */}
        <SlidingTabs
          items={tabItems}
          activeValue={activeTab}
          onChange={setActiveTab}
          size="sm"
          layoutId="activePostChartTab"
          className="self-start md:self-auto"
        />
      </div>

      {/* Main Content Area with Transitions */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
