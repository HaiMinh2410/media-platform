'use client'

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { getAISummary, AISummary } from '../../application/actions/dashboard.actions';
import { Shimmer } from './shimmer';
import { cn } from '@/lib/utils';

interface AISummaryCardProps {
  workspaceId: string;
  initialData?: AISummary;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ workspaceId, initialData }) => {
  const [data, setData] = useState<AISummary | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    
    async function fetchData() {
      try {
        const result = await getAISummary(workspaceId);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch AI summary:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [workspaceId, initialData]);

  if (loading && !data) {
    return <AISummaryCardSkeleton />;
  }

  const tiles = [
    {
      icon: '⏱',
      value: data?.timeSaved.value,
      label: 'Tiết kiệm',
      trend: data?.timeSaved.trend,
      trendDir: data?.timeSaved.trendDirection,
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: '😊',
      value: data?.satisfaction.value,
      label: 'Hài lòng',
      trend: data?.satisfaction.trend,
      trendDir: data?.satisfaction.trendDirection,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🤖',
      value: data?.messagesProcessed.value,
      label: 'AI xử lý',
      trend: data?.messagesProcessed.trend,
      trendDir: data?.messagesProcessed.trendDirection,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '⚡',
      value: data?.avgResponseTime.value,
      label: 'Phản hồi TB',
      trend: data?.avgResponseTime.trend,
      trendDir: data?.avgResponseTime.trendDirection,
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <Card className="p-6 border-none bg-base-100/40 backdrop-blur-md shadow-xl ring-1 ring-white/10 relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="text-lg">🤖</span>
        </div>
        <h3 className="font-brand font-bold text-lg">AI Activity Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 flex-grow">
        {tiles.map((tile, i) => (
          <div key={i} className="relative bg-base-200/50 p-4 rounded-2xl border border-white/5 transition-all hover:bg-base-200/80 group">
            <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${tile.gradient} opacity-50`} />
            <div className="flex flex-col gap-1">
              <span className="text-xl opacity-80 group-hover:scale-110 transition-transform w-fit">{tile.icon}</span>
              <span className="text-2xl font-black font-brand tracking-tight">{tile.value}</span>
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{tile.label}</span>
              <span className={cn(
                "text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full w-fit bg-white/5",
                tile.trendDir === 'up' ? 'text-success' : 
                tile.trendDir === 'down' ? 'text-error' : 'text-base-content/40'
              )}>
                {tile.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-base-200/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold opacity-50 uppercase tracking-wider italic">AI đang soạn draft...</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
          </div>
        </div>
        <Shimmer height="6px" className="rounded-full opacity-30" />
      </div>
    </Card>
  );
};

const AISummaryCardSkeleton = () => (
  <Card className="p-6 border-none bg-base-100/40 backdrop-blur-md shadow-xl ring-1 ring-white/10 h-full">
    <div className="flex items-center gap-2 mb-6">
      <Shimmer width="32px" height="32px" className="rounded-lg" />
      <Shimmer width="160px" height="20px" />
    </div>
    <div className="grid grid-cols-2 gap-4 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-base-200/50 p-4 rounded-2xl">
          <Shimmer width="24px" height="24px" className="mb-2" />
          <Shimmer width="60px" height="24px" className="mb-2" />
          <Shimmer width="40px" height="12px" className="mb-2" />
          <Shimmer width="50px" height="12px" />
        </div>
      ))}
    </div>
    <div className="bg-base-200/60 p-4 rounded-xl">
      <Shimmer width="120px" height="12px" className="mb-3" />
      <Shimmer height="8px" className="rounded-full" />
    </div>
  </Card>
);
