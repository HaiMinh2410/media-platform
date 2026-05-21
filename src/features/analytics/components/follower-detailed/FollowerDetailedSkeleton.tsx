import React from 'react';

export function FollowerDetailedSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Chart Skeleton */}
      <div className="w-full h-[360px] bg-foreground/2 border border-foreground/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/3 to-transparent shimmer" />
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="w-36 h-5 bg-foreground/5 rounded" />
            <div className="w-24 h-3 bg-foreground/5 rounded" />
          </div>
          <div className="w-48 h-12 bg-foreground/5 rounded-2xl" />
        </div>
        <div className="w-full h-[200px] bg-foreground/5 rounded-xl mt-4" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-foreground/2 border border-foreground/10 rounded-3xl p-6 h-[320px] relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/3 to-transparent shimmer" />
            <div className="w-32 h-5 bg-foreground/5 rounded mb-8" />
            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="w-20 h-3 bg-foreground/5 rounded" />
                    <div className="w-8 h-3 bg-foreground/5 rounded" />
                  </div>
                  <div className="w-full h-2 bg-foreground/5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
