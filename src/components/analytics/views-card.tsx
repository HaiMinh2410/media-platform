'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

const COLORS = {
  pink: '#e91e8c',
  purple: '#9b27d4',
  dark: '#1e1e1e',
  muted: '#888',
  text: '#aaa',
};

const ContentBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 text-[#888] text-sm shrink-0">{label}</div>
    <div className="flex-1 h-2.5 bg-[#1e1e1e] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        }}
        className="h-full rounded-full"
      />
    </div>
    <div className="w-11 text-white text-sm text-right font-semibold">{pct}%</div>
  </div>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white/5 rounded", className)} />
);

export function ViewsCard({
  totalViews,
  followersPct,
  nonfollowersPct,
  accountsReached,
  byContentViews,
  isLoading = false,
}: ViewsCardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'nonfollowers'>('all');

  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 h-full min-h-[400px] flex flex-col gap-6">
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
              <Skeleton className="h-2 w-full rounded-full" />
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

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-white font-sans">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Views</h3>
        <Info className="w-4 h-4 text-[#555] cursor-help" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Stats & Stacked Bar */}
        <div className="flex flex-col">
          <div className="mb-6">
            <div className="text-4xl font-extrabold text-white tracking-tighter mb-1">
              {totalViews.toLocaleString()}
            </div>
            <div className="text-[13px] text-[#666]">Views</div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex justify-between text-sm text-[#aaa]">
              <span>Followers</span>
              <span className="font-bold" style={{ color: COLORS.pink }}>{followersPct}%</span>
            </div>
            <div className="flex justify-between text-sm text-[#aaa]">
              <span>Non-followers</span>
              <span className="font-bold" style={{ color: COLORS.purple }}>{nonfollowersPct}%</span>
            </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-2 rounded-full overflow-hidden bg-[#1e1e1e] mb-6 flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${followersPct}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: COLORS.pink }}
              className="h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${nonfollowersPct}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: COLORS.purple }}
              className="h-full"
            />
          </div>

          <div className="mt-auto pt-4 border-t border-[#1e1e1e]">
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold" style={{ color: COLORS.pink }}>Accounts reached</span>
              <span className="font-bold text-white text-base">{accountsReached.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Side: By Content Type */}
        <div>
          <div className="text-sm font-semibold text-[#ccc] mb-4">By content type</div>
          
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            {(['all', 'followers', 'nonfollowers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                  activeTab === tab 
                    ? "text-white shadow-lg shadow-pink-500/20" 
                    : "bg-[#1e1e1e] text-[#888] hover:text-[#bbb]"
                )}
                style={{
                  backgroundColor: activeTab === tab ? COLORS.pink : undefined
                }}
              >
                {tab === 'all' ? 'All' : tab === 'followers' ? 'Followers' : 'Non-followers'}
              </button>
            ))}
          </div>

          {/* Content Bars */}
          <div className="space-y-1">
            <ContentBar label="Posts" pct={contentData.posts} color={COLORS.pink} />
            <ContentBar label="Reels" pct={contentData.reels} color={COLORS.purple} />
            <ContentBar label="Stories" pct={contentData.stories} color={COLORS.pink} />
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-[#888]">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS.pink }} />
              Followers
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#888]">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS.purple }} />
              Non-followers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
