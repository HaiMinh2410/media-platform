'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn, COLORS, Skeleton, formatMetric } from './primitives';

export interface TopContentPost {
  id: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  postedAt: Date | string;
  views: number | null;
  totalInteractions: number | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

interface TopContentGridProps {
  topByViews: TopContentPost[];
  topByInteractions: TopContentPost[];
  isLoading?: boolean;
}

const GRADIENTS = [
  "linear-gradient(135deg, #e91e8c, #9b27d4)",
  "linear-gradient(135deg, #c2185b, #7b1fa2)",
  "linear-gradient(135deg, #ad1457, #6a1b9a)",
  "linear-gradient(135deg, #880e4f, #4a148c)",
  "linear-gradient(135deg, #f06292, #ce93d8)",
];

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function PostThumb({
  post,
  metricValue,
  gradient,
  index
}: {
  post: TopContentPost;
  metricValue: number | null;
  gradient: string;
  index: number;
}) {
  const displayUrl = post.thumbnailUrl || post.mediaUrl;
  const formattedDate = dateFormatter.format(new Date(post.postedAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col items-center group"
    >
      <div
        className="relative w-[120px] h-[120px] rounded-[14px] overflow-hidden mb-2 shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ background: gradient }}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Content thumbnail"
            fill
            className="object-cover transition-opacity duration-500"
            sizes="120px"
            unoptimized // Instagram URLs often have issues with Next.js optimization
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-white text-xs font-bold">{post.mediaType}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Metric Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-[11px] font-bold text-white border border-white/10">
          {formatMetric(metricValue || 0)}
        </div>

        {/* Media Type Icon Overlay (Optional but premium) */}
        {post.mediaType === 'VIDEO' && (
          <div className="absolute top-2 right-2 bg-black/40 rounded-md p-1">
            <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[12px] text-[#888] font-medium">{formattedDate}</span>
    </motion.div>
  );
}

export function TopContentGrid({
  topByViews,
  topByInteractions,
  isLoading = false
}: TopContentGridProps) {
  const [activeTab, setActiveTab] = useState<'views' | 'interactions'>('views');

  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 font-sans">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-[120px] h-[120px] rounded-[14px]" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'views' ? topByViews : topByInteractions;

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-white font-sans overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Top content based on {activeTab}
        </h3>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#1e1e1e] rounded-full self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('views')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300",
              activeTab === 'views'
                ? "bg-white text-black shadow-lg"
                : "text-[#888] hover:text-[#bbb]"
            )}
          >
            Views
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300",
              activeTab === 'interactions'
                ? "bg-white text-black shadow-lg"
                : "text-[#888] hover:text-[#bbb]"
            )}
          >
            Interactions
          </button>
        </div>
      </div>

      <div className="relative min-h-[148px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex gap-4 flex-wrap"
          >
            {currentData.length > 0 ? (
              currentData.map((post, i) => (
                <PostThumb
                  key={post.id}
                  post={post}
                  index={i}
                  metricValue={activeTab === 'views' ? post.views : post.totalInteractions}
                  gradient={GRADIENTS[i % GRADIENTS.length]}
                />
              ))
            ) : (
              <div className="w-full h-[120px] flex items-center justify-center border border-dashed border-[#222] rounded-[14px] text-[#555] text-sm">
                No content data available for this period
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
