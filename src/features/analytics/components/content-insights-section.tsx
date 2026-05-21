'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useContentInsights } from '../hooks/useContentInsights';
import { ContentInsightsFilters } from './ContentInsightsFilters';
import { ContentPostGrid } from './ContentPostGrid';
import { PostDetailModal } from './post-detail-modal';

export function ContentInsightsSection({
  accountId
}: {
  accountId: string;
}) {
  const {
    mediaFilter,
    setMediaFilter,
    metricFilter,
    setMetricFilter,
    orderFilter,
    setOrderFilter,
    rangeFilter,
    setRangeFilter,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    activeDropdown,
    setActiveDropdown,
    selectedPost,
    setSelectedPost,
    processedPosts,
    getMetricValue,
    isPending,
    isError,
    dropdownRef,
  } = useContentInsights({ accountId });

  return (
    <div className="glass min-h-[600px] text-foreground p-6 font-sans rounded-3xl border border-foreground/10 shadow-2xl relative transition-all duration-300">
      <div className="flex flex-col gap-6" ref={dropdownRef}>
        {/* Title Row */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Content insights</h2>
          <p className="text-foreground/40 text-xs mt-1">Phân tích hiệu suất truyền thông bài viết trọn đời</p>
        </div>

        {/* Dropdowns Filter Row */}
        <ContentInsightsFilters
          mediaFilter={mediaFilter}
          setMediaFilter={setMediaFilter}
          metricFilter={metricFilter}
          setMetricFilter={setMetricFilter}
          orderFilter={orderFilter}
          setOrderFilter={setOrderFilter}
          rangeFilter={rangeFilter}
          setRangeFilter={setRangeFilter}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
        />
      </div>

      {/* Media Grid */}
      <ContentPostGrid
        isPending={isPending}
        isError={isError}
        processedPosts={processedPosts}
        getMetricValue={getMetricValue}
        setSelectedPost={setSelectedPost}
      />

      {/* Instagram-style Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
