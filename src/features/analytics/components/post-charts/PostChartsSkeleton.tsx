import * as React from 'react';

export function PostChartsSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 shadow-2xl animate-pulse space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-foreground/10 rounded-lg" />
          <div className="h-3.5 w-64 bg-foreground/5 rounded-md" />
        </div>
        <div className="h-8 w-80 bg-foreground/5 rounded-xl border border-foreground/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 bg-foreground/5 border border-foreground/10 rounded-2xl h-full" />
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl h-full flex flex-col gap-4 p-4">
          <div className="h-10 bg-foreground/10 rounded-xl" />
          <div className="h-10 bg-foreground/10 rounded-xl" />
          <div className="h-10 bg-foreground/10 rounded-xl" />
          <div className="h-10 bg-foreground/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
