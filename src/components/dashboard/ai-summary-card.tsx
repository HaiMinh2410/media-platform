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
      label: 'Tiết kiệm hôm nay',
      trend: data?.timeSaved.trend,
      trendDir: data?.timeSaved.trendDirection,
      borderColor: '#7c3aed'
    },
    {
      icon: '😊',
      value: data?.satisfaction.value,
      label: 'Khách hài lòng với AI',
      trend: data?.satisfaction.trend,
      trendDir: data?.satisfaction.trendDirection,
      borderColor: '#10b981'
    },
    {
      icon: '🤖',
      value: data?.messagesProcessed.value,
      label: 'Tin nhắn AI đã xử lý',
      trend: data?.messagesProcessed.trend,
      trendDir: data?.messagesProcessed.trendDirection,
      borderColor: '#2563eb'
    },
    {
      icon: '⚡',
      value: data?.avgResponseTime.value,
      label: 'Thời gian phản hồi TB',
      trend: data?.avgResponseTime.trend,
      trendDir: data?.avgResponseTime.trendDirection,
      borderColor: '#f59e0b'
    }
  ];

  return (
    <Card className="p-6 border border-base-content/5 bg-base-100/50 backdrop-blur-md shadow-sm rounded-3xl h-full flex flex-col transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="text-lg">🤖</span>
        </div>
        <h3 className="font-bold text-sm tracking-tight">AI Activity Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-6 flex-grow">
        {tiles.map((tile, i) => {
          // Special logic for Tile 4 (Response Time) status text
          let statusText = tile.trend;
          let statusColor = tile.trendDir === 'up' ? 'text-success' : tile.trendDir === 'down' ? 'text-error' : 'text-warning';
          let valueColor = "text-base-content";

          if (tile.icon === '⚡' && data?.avgResponseTime.value) {
            const val = parseFloat(data.avgResponseTime.value);
            if (val < 1.5) {
              statusText = "Excellent";
              statusColor = "text-success";
              valueColor = "text-success";
            } else if (val <= 3) {
              statusText = "Good";
              statusColor = "text-warning";
            } else {
              statusText = "Slow";
              statusColor = "text-error";
            }
          }

          return (
            <div key={i} className="bg-base-100 rounded-xl p-3.5 border border-base-content/5 flex flex-col gap-1 relative overflow-hidden" style={{ borderTop: `2px solid ${tile.borderColor}` }}>
              <div className="text-lg mb-1">{tile.icon}</div>
              <div className={cn("text-2xl font-bold tracking-tight leading-none", valueColor)}>{tile.value}</div>
              <div className="text-[10px] text-base-content/40 font-medium leading-tight">{tile.label}</div>
              <div className={cn("text-[10px] font-bold mt-1 flex items-center gap-1", statusColor)}>
                {tile.trendDir === 'up' && '↑'}
                {tile.trendDir === 'down' && '↓'}
                {tile.trendDir === 'stable' && '→'}
                {statusText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shimmer / Active Task */}
      <div className="bg-base-200/40 p-3 rounded-xl border border-base-content/5 flex flex-col gap-2">
        <div className="text-[10px] text-base-content/40 font-semibold italic">AI đang soạn draft...</div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 bg-gradient-to-r from-base-content/5 via-base-content/10 to-base-content/5 bg-[length:200%_100%] animate-shimmer rounded-full w-[70%]" />
          <div className="h-2.5 bg-gradient-to-r from-base-content/5 via-base-content/10 to-base-content/5 bg-[length:200%_100%] animate-shimmer rounded-full w-[45%]" />
        </div>
      </div>
    </Card>

  );
};

const AISummaryCardSkeleton = () => (
  <Card className="p-6 border border-base-content/5 bg-base-100/50 rounded-3xl h-full">
    <div className="flex items-center gap-2 mb-6">
      <Shimmer width="32px" height="32px" className="rounded-lg" />
      <Shimmer width="160px" height="20px" />
    </div>
    <div className="grid grid-cols-2 gap-2.5 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-base-100 rounded-xl p-3.5 border border-base-content/5 flex flex-col gap-2">
          <Shimmer width="24px" height="24px" className="mb-1" />
          <Shimmer width="80px" height="28px" className="mb-1" />
          <Shimmer width="100px" height="12px" />
          <Shimmer width="60px" height="12px" className="mt-2" />
        </div>
      ))}
    </div>
    <div className="bg-base-200/40 p-3 rounded-xl border border-base-content/5 flex flex-col gap-2">
      <Shimmer width="100px" height="10px" className="mb-1" />
      <Shimmer height="10px" className="rounded-full w-[70%] mb-1" />
      <Shimmer height="10px" className="rounded-full w-[45%]" />
    </div>
  </Card>
);
