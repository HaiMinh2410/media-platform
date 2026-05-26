import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Stats Strip Skeleton */}
      <div className="w-full border-b border-base-content/5 bg-base-100 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton w-[60px] h-3 opacity-40" />
                <div className="flex items-center gap-3">
                  <div className="skeleton w-20 h-7 rounded-lg" />
                  <div className="skeleton w-10 h-4 rounded-full opacity-30" />
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
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-60 h-6 rounded-lg" />
          </div>
          
          {/* Account Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-base-100 rounded-2xl p-5 border border-base-content/5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="space-y-1.5">
                      <div className="skeleton w-[100px] h-3.5" />
                      <div className="skeleton w-[60px] h-2.5 opacity-50" />
                    </div>
                  </div>
                  <div className="skeleton w-5 h-5 rounded-md" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="skeleton w-full h-2 rounded-full opacity-30" />
                  <div className="flex justify-between">
                    <div className="skeleton w-10 h-2.5 opacity-50" />
                    <div className="skeleton w-7 h-2.5 opacity-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 + 3: Two-column layout (Matches dashboard page grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inbox Metrics Skeleton (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-base-100 rounded-2xl p-6 border border-base-content/5 space-y-6 h-[400px] shadow-sm flex flex-col">
              <div className="flex justify-between items-center">
                <div className="skeleton w-[180px] h-5" />
                <div className="skeleton w-[100px] h-8 rounded-lg" />
              </div>
              <div className="flex gap-4 grow pt-4">
                <div className="flex-1 space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="skeleton w-[40%] h-3" />
                      <div className="skeleton w-full h-8 rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="w-px bg-base-content/5 mx-4" />
                <div className="w-1/3 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton w-full h-[50px] rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary Skeleton (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-base-100 rounded-2xl p-6 border border-base-content/5 space-y-6 h-[400px] shadow-sm flex flex-col">
               <div className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton w-[150px] h-5" />
              </div>
              <div className="grid grid-cols-2 gap-4 grow">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-base-200/50 rounded-lg p-4 flex flex-col justify-center items-center space-y-3 border border-base-content/5">
                    <div className="skeleton w-10 h-10 rounded-full opacity-40" />
                    <div className="skeleton w-[60px] h-6 rounded-lg" />
                    <div className="skeleton w-20 h-3 opacity-50" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

