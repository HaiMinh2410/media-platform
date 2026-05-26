import React from 'react';

export function AIInsightsSkeleton() {
  return (
    <div className="space-y-6 text-base-content animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 pb-6 border-b border-base-content/5">
        <div className="h-10 w-72 bg-base-content/10 rounded-xl skeleton" />
        <div className="h-4 w-96 bg-base-content/5 rounded-lg skeleton" />
      </div>
      
      {/* Status Widgets Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-base-100 border border-base-content/5 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="h-3 w-28 bg-base-content/10 rounded-md skeleton" />
              <div className="w-8 h-8 rounded-xl bg-base-content/10 skeleton" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-24 bg-base-content/15 rounded-lg skeleton" />
              <div className="h-3.5 w-32 bg-base-content/5 rounded-md skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-[420px] bg-base-100 border border-base-content/5 rounded-2xl p-6 skeleton" />
        <div className="h-[420px] lg:col-span-2 bg-base-100 border border-base-content/5 rounded-2xl p-6 skeleton" />
      </div>
    </div>
  );
}
