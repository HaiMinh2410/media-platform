import React from 'react';

export function FollowerDetailedSkeleton() {
  return (
    <div className="space-y-6 font-sans">
      {/* Chart Skeleton */}
      <div className="w-full h-[360px] bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="skeleton w-36 h-5 rounded" />
            <div className="skeleton w-24 h-3 rounded" />
          </div>
          <div className="skeleton w-48 h-10 rounded-xl" />
        </div>
        <div className="skeleton w-full h-[200px] rounded-xl flex-1 mt-4" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 h-[320px] flex flex-col justify-between">
            <div className="skeleton w-32 h-5 rounded mb-8" />
            <div className="space-y-4 flex-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="skeleton w-20 h-3 rounded" />
                    <div className="skeleton w-8 h-3 rounded" />
                  </div>
                  <div className="skeleton w-full h-2.5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
