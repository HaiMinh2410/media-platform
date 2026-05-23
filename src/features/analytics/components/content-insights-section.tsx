"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { useContentInsights } from "../hooks/useContentInsights";
import { ContentInsightsFilters } from "./ContentInsightsFilters";
import { ContentPostGrid } from "./ContentPostGrid";
import { PostDetailModal } from "./post-detail-modal";

export function ContentInsightsSection({
  accountId,
  range,
  customStart,
  customEnd,
}: {
  accountId: string;
  range: "all" | "7d" | "14d" | "30d" | "90d" | "custom";
  customStart: string;
  customEnd: string;
}) {
  const {
    mediaFilter,
    setMediaFilter,
    metricFilter,
    setMetricFilter,
    orderFilter,
    setOrderFilter,
    rangeFilter,
    activeDropdown,
    setActiveDropdown,
    selectedPost,
    setSelectedPost,
    processedPosts,
    getMetricValue,
    isPending,
    isError,
    dropdownRef,
  } = useContentInsights({
    accountId,
    rangeFilter: range as any,
    customStart,
    customEnd,
  });

  return (
    <div className="p-6 min-h-[50%] transition-all duration-300 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-base-content/5 mb-6" ref={dropdownRef}>
        {/* Title Row */}
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-base-content font-brand">Content insights</h2>
        </div>

        {/* Dropdowns Filter Row */}
        <ContentInsightsFilters
          mediaFilter={mediaFilter}
          setMediaFilter={setMediaFilter}
          metricFilter={metricFilter}
          setMetricFilter={setMetricFilter}
          orderFilter={orderFilter}
          setOrderFilter={setOrderFilter}
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
