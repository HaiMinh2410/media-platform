'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Grid3X3, 
  Users, 
  Sparkles
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';
import { PerformanceTab } from './post-charts/PerformanceTab';
import { ContentTab } from './post-charts/ContentTab';
import { DistributionTab } from './post-charts/DistributionTab';
import { FollowsTab } from './post-charts/FollowsTab';
import { PostChartsSkeleton } from './post-charts/PostChartsSkeleton';

interface PostChartsDashboardProps {
  accountId: string;
  range: string;
  customStart?: Date;
  customEnd?: Date;
  data: PostDeepAnalyticsData | null;
  isLoading?: boolean;
}

type TabType = 'performance' | 'content' | 'distribution' | 'follows';

export function PostChartsDashboard({
  data,
  isLoading = false
}: PostChartsDashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('performance');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !data) {
    return <PostChartsSkeleton />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return <PerformanceTab data={data} />;
      case 'content':
        return <ContentTab data={data} />;
      case 'distribution':
        return <DistributionTab data={data} />;
      case 'follows':
        return <FollowsTab data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="glass rounded-3xl p-6 shadow-2xl transition-all duration-300">
      {/* Header and Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Thống kê Nội dung Nâng cao</h2>
          </div>
          <p className="text-xs text-foreground/50 mt-1">Phân tích sâu hiệu suất bài đăng, xu hướng tương tác và phễu chuyển đổi</p>
        </div>

        {/* Glass Tabs */}
        <div className="flex flex-wrap bg-foreground/5 border border-foreground/10 rounded-2xl p-1 gap-1 self-start md:self-auto">
          {(
            [
              { id: 'performance', label: 'Xu hướng & So sánh', icon: TrendingUp },
              { id: 'content', label: 'Loại nội dung', icon: PieIcon },
              { id: 'distribution', label: 'Thời điểm & Chuyển đổi', icon: Grid3X3 },
              { id: 'follows', label: 'Tăng trưởng Follower', icon: Users }
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 select-none",
                  isActive ? "text-foreground font-bold" : "text-foreground/60 hover:text-foreground/80 hover:bg-foreground/2"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePostChartTab"
                    className="absolute inset-0 bg-foreground/6 border border-foreground/10 rounded-xl shadow-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-purple-400" : "text-foreground/60")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area with Transitions */}
      <div className="min-h-[480px] transition-all duration-300">
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
