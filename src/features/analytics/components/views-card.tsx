'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { SlidingTabs } from '@shared/ui/sliding-tabs';
import { cn, Skeleton, StatBlock } from './primitives';

interface ViewsCardProps {
  totalViews: number;
  followersPct: number;
  nonfollowersPct: number;
  accountsReached: number;
  byContentViews: {
    all: { posts: number; reels: number; stories: number };
    followers: { posts: number; reels: number; stories: number };
    nonfollowers: { posts: number; reels: number; stories: number };
  } | null;
  isLoading?: boolean;
}

function ViewsContentBar({
  label,
  category,
  activeTab,
  byContentViews,
  followersPct,
  nonfollowersPct,
}: {
  label: string;
  category: 'posts' | 'reels' | 'stories';
  activeTab: 'all' | 'followers' | 'nonfollowers';
  byContentViews: ViewsCardProps['byContentViews'];
  followersPct: number;
  nonfollowersPct: number;
}) {
  const contentData = byContentViews ? byContentViews[activeTab] : { posts: 0, reels: 0, stories: 0 };
  const pct = contentData[category] ?? 0;

  let pinkPct = 0;
  let purplePct = 0;

  if (activeTab === 'followers') {
    pinkPct = pct;
    purplePct = 0;
  } else if (activeTab === 'nonfollowers') {
    pinkPct = 0;
    purplePct = pct;
  } else {
    // activeTab === 'all'
    const folVal = byContentViews?.followers?.[category] ?? 0;
    const nonVal = byContentViews?.nonfollowers?.[category] ?? 0;

    const folWeight = folVal * followersPct;
    const nonWeight = nonVal * nonfollowersPct;
    const totalWeight = folWeight + nonWeight;

    if (totalWeight > 0) {
      const followersRatio = folWeight / totalWeight;
      pinkPct = pct * followersRatio;
      purplePct = pct * (1 - followersRatio);
    } else {
      const followersRatio = followersPct / 100;
      pinkPct = pct * followersRatio;
      purplePct = pct * (1 - followersRatio);
    }
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-14 text-base-content text-sm shrink-0 font-medium">{label}</div>
      <div className="flex-1 h-2.5 bg-base-300 rounded-full overflow-hidden flex">
        {pinkPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pinkPct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full shrink-0 bg-pink-500"
          />
        )}
        {purplePct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${purplePct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full shrink-0 bg-purple-500"
          />
        )}
      </div>
      <div className="w-11 text-base-content text-sm text-right font-mono font-semibold">{pct.toFixed(1).replace('.0', '')}%</div>
    </div>
  );
}

export function ViewsCard({
  totalViews,
  followersPct,
  nonfollowersPct,
  accountsReached,
  byContentViews,
  isLoading = false,
}: ViewsCardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'nonfollowers'>('all');

  const tabItems = React.useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'followers', label: 'Followers' },
    { value: 'nonfollowers', label: 'Non-followers' },
  ] as const, []);

  if (isLoading) {
    return (
      <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 h-full min-h-[400px] flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contentData = byContentViews ? byContentViews[activeTab] : { posts: 0, reels: 0, stories: 0 };

  const categories = [
    { label: 'Posts', key: 'posts' as const },
    { label: 'Reels', key: 'reels' as const },
    { label: 'Stories', key: 'stories' as const },
  ];

  // Dynamically sort categories by their percentage in descending order
  const sortedCategories = [...categories].sort((a, b) => {
    const valA = contentData[a.key] ?? 0;
    const valB = contentData[b.key] ?? 0;
    return valB - valA;
  });

  return (
    <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 text-base-content transition-all duration-300 hover:shadow-md">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-base-content tracking-tight">Views</h3>
        <Info className="w-4 h-4 text-base-content/30 cursor-help" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Stats & Stacked Bar */}
        <div className="flex flex-col">
          <StatBlock value={totalViews} label="Views" />

          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex justify-between text-sm text-base-content/70">
              <span>Followers</span>
              <span className="font-bold text-pink-500 font-mono">{followersPct}%</span>
            </div>
            <div className="flex justify-between text-sm text-base-content/70">
              <span>Non-followers</span>
              <span className="font-bold text-purple-500 font-mono">{nonfollowersPct}%</span>
            </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-2 rounded-full overflow-hidden bg-base-300 mb-6 flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${followersPct}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-pink-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${nonfollowersPct}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-purple-500"
            />
          </div>

          <div className="mt-auto pt-4 border-t border-base-content/5">
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-pink-500">Accounts reached</span>
              <span className="font-bold text-base-content text-base font-mono">{accountsReached.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Side: By Content Type */}
        <div>
          <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono mb-4">By content type</div>
          
          {/* Tab Switcher */}
          <SlidingTabs
            items={tabItems}
            activeValue={activeTab}
            onChange={setActiveTab}
            size="sm"
            fullWidth
            layoutId="viewsCardTabIndicator"
            className="mb-6"
          />

          {/* Content Bars */}
          <div className="space-y-1">
            {sortedCategories.map((cat) => (
              <ViewsContentBar
                key={cat.key}
                label={cat.label}
                category={cat.key}
                activeTab={activeTab}
                byContentViews={byContentViews}
                followersPct={followersPct}
                nonfollowersPct={nonfollowersPct}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-6 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-base-content/40 font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              Followers
            </div>
            <div className="flex items-center gap-1.5 text-xs text-base-content/40 font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Non-followers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

