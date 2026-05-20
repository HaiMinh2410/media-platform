'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { COLORS, ContentBar, Skeleton, StatBlock } from './primitives';

interface InteractionsCardProps {
  totalInteractions: number;
  accountsEngaged: number;
  byContentInteractions: { posts: number; reels: number; stories: number } | null;
  isLoading?: boolean;
}

export function InteractionsCard({
  totalInteractions,
  accountsEngaged,
  byContentInteractions,
  isLoading = false,
}: InteractionsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 h-full min-h-[400px] flex flex-col gap-6 font-sans">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-4 w-32" />
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

  const contentData = byContentInteractions || { posts: 0, reels: 0, stories: 0 };

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-white font-sans h-full">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Interactions</h3>
        <Info className="w-4 h-4 text-[#555] cursor-help" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Stats */}
        <div className="flex flex-col">
          <StatBlock value={totalInteractions} label="Interactions" />

          {/* Note: Meta API doesn't provide follower/non-follower breakdown for interactions 
              in the same way it does for views. So we skip the pink/purple divided bar here. */}
          
          <div className="mt-auto pt-6 border-t border-[#1e1e1e]">
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold" style={{ color: COLORS.pink }}>Accounts engaged</span>
              <span className="font-bold text-white text-base">{accountsEngaged.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Side: By Content Type */}
        <div>
          <div className="text-sm font-semibold text-[#ccc] mb-6">By content interactions</div>
          
          {/* Content Bars */}
          <div className="space-y-1">
            <ContentBar label="Posts" pct={contentData.posts} color={COLORS.pink} />
            <ContentBar label="Reels" pct={contentData.reels} color={COLORS.purple} />
            <ContentBar label="Stories" pct={contentData.stories} color={COLORS.pink} />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-[#888] mt-6">
            <div className="w-2 h-2 rounded-full" style={{ background: COLORS.pink }} />
            Followers and non-followers
          </div>
        </div>
      </div>
    </div>
  );
}
