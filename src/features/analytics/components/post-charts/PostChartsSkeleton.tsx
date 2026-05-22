import * as React from 'react';

export function PostChartsSkeleton() {
  return (
    <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 animate-pulse space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-base-300 rounded-lg skeleton" />
          <div className="h-3.5 w-64 bg-base-200 rounded-md skeleton" />
        </div>
        <div className="h-8 w-80 bg-base-200 rounded-xl border border-base-content/5 skeleton" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 bg-base-200/50 border border-base-content/5 rounded-2xl h-full skeleton" />
        <div className="bg-base-200/50 border border-base-content/5 rounded-2xl h-full flex flex-col gap-4 p-4 skeleton">
          <div className="h-10 bg-base-300 rounded-xl skeleton" />
          <div className="h-10 bg-base-300 rounded-xl skeleton" />
          <div className="h-10 bg-base-300 rounded-xl skeleton" />
          <div className="h-10 bg-base-300 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
