import React from 'react';
import { Shimmer } from './shimmer';

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Stats Strip Skeleton */}
      <div className="w-full border-b border-base-content/5 bg-base-200/30 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Shimmer width="60px" height="12px" className="opacity-40" />
                <div className="flex items-center gap-3">
                  <Shimmer width="80px" height="28px" className="rounded-lg" />
                  <Shimmer width="40px" height="16px" className="rounded-full opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 xl:p-7 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Section 1: Account Health Header */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-base-300 animate-pulse" />
            <Shimmer width="240px" height="24px" className="rounded-lg" />
          </div>
          
          {/* Account Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-base-200/40 rounded-xl p-5 border border-base-content/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Shimmer width="40px" height="40px" className="rounded-full" />
                    <div className="space-y-1.5">
                      <Shimmer width="100px" height="14px" />
                      <Shimmer width="60px" height="10px" className="opacity-50" />
                    </div>
                  </div>
                  <Shimmer width="20px" height="20px" className="rounded-md" />
                </div>
                <div className="space-y-2 pt-2">
                  <Shimmer width="100%" height="8px" className="rounded-full opacity-30" />
                  <div className="flex justify-between">
                    <Shimmer width="40px" height="10px" className="opacity-50" />
                    <Shimmer width="30px" height="10px" className="opacity-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 + 3: Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[58%_1fr] gap-6">
          {/* Inbox Metrics Skeleton */}
          <div className="bg-base-200/40 rounded-2xl p-6 border border-base-content/5 space-y-6 h-[400px]">
            <div className="flex justify-between items-center">
              <Shimmer width="180px" height="20px" />
              <Shimmer width="100px" height="32px" className="rounded-lg" />
            </div>
            <div className="flex gap-4 h-full pt-4">
              <div className="flex-1 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Shimmer width="40%" height="12px" />
                    <Shimmer width="100%" height="32px" className="rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="w-[1px] bg-base-content/5 mx-4" />
              <div className="w-1/3 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Shimmer key={i} width="100%" height="50px" className="rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary Skeleton */}
          <div className="bg-base-200/40 rounded-2xl p-6 border border-base-content/5 space-y-6 h-[400px]">
             <div className="flex items-center gap-3">
              <Shimmer width="32px" height="32px" className="rounded-lg" />
              <Shimmer width="150px" height="20px" />
            </div>
            <div className="grid grid-cols-2 gap-4 h-[calc(100%-60px)]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-base-300/30 rounded-2xl p-4 flex flex-col justify-center items-center space-y-3">
                  <Shimmer width="40px" height="40px" className="rounded-full opacity-40" />
                  <Shimmer width="60px" height="24px" className="rounded-lg" />
                  <Shimmer width="80px" height="12px" className="opacity-50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
