'use client'

import React, { useEffect, useState } from 'react';

import { getAISummary, AISummary } from '@features/dashboard/actions/dashboard.actions';
import { Shimmer } from './shimmer';
import { cn } from '@shared/lib/utils';
import { createClient } from '@shared/api/supabase/client';


interface AISummaryCardProps {
  workspaceId: string;
  initialData?: AISummary;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ workspaceId, initialData }) => {
  const [data, setData] = useState<AISummary | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to realtime changes in messages and ai_reply_logs
    const channel = supabase
      .channel('dashboard_ai_drafting_status')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new as any;
          // If a new customer message is inserted, AI is triggered to draft a response
          if (row.sender_type === 'user' || row.senderType === 'user') {
            setIsDrafting(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_reply_logs',
        },
        () => {
          // AI has finished drafting the reply
          setIsDrafting(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Safeguard: auto-reset drafting state after 8 seconds in case worker fails or timeouts
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isDrafting) {
      timeoutId = setTimeout(() => {
        setIsDrafting(false);
      }, 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [isDrafting]);

  useEffect(() => {
    if (initialData) return;
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

  return (
    <div className="p-5 border border-base-content/5 bg-base-100 shadow-xs rounded-2xl h-full flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
            🤖
          </div>
          <h3 className="font-bold text-sm tracking-tight text-base-content font-brand">AI Activity Summary</h3>
        </div>
        <span className="badge badge-xs badge-success badge-soft gap-1 py-1.5 px-2 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Main Content: Grid 1:5 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 grow">
        {/* Cột trái: Big Impact Stat - Hiệu suất AI (Chiếm 3/5 cột) */}
        <div className="md:col-span-3 bg-base-200/40 rounded-xl p-4 border border-base-content/5 flex flex-col justify-between relative overflow-hidden">
          {/* Aurora glow effect */}
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest font-mono">Hiệu suất AI</span>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold font-mono">Core Engine</span>
            </div>

            {/* Big Stat: Tin nhắn AI đã xử lý */}
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold tracking-tight text-base-content font-mono leading-none">
                {data?.messagesProcessed.value || '0'}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider">Tin nhắn đã xử lý</span>
                {data?.messagesProcessed.trend && (
                  <span className={cn(
                    "text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5",
                    data.messagesProcessed.trendDirection === 'up' ? "text-success bg-success/10" : "text-error bg-error/10"
                  )}>
                    {data.messagesProcessed.trendDirection === 'up' && '↑'}
                    {data.messagesProcessed.trendDirection === 'down' && '↓'}
                    {data.messagesProcessed.trendDirection === 'stable' && '→'}
                    {data.messagesProcessed.trend}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Thin divider */}
          <div className="border-t border-base-content/5 my-3" />

          {/* Sub-Stat: Thời gian phản hồi TB */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest font-mono">Phản hồi TB</span>
              <span className="text-lg font-bold text-base-content font-mono mt-0.5">
                {data?.avgResponseTime.value || '0s'}
              </span>
            </div>

            {/* Speed Rating Badge */}
            {data?.avgResponseTime.value && (() => {
              const val = parseFloat(data.avgResponseTime.value);
              let statusText = "Stable";
              let statusColor = "bg-warning/20 text-warning border-warning/10";
              if (val < 1.5) {
                statusText = "Excellent";
                statusColor = "bg-success/20 text-success border-success/10";
              } else if (val <= 3) {
                statusText = "Good";
                statusColor = "bg-info/20 text-info border-info/10";
              } else {
                statusText = "Slow";
                statusColor = "bg-error/20 text-error border-error/10";
              }
              return (
                <div className="flex flex-col items-end">
                  <span className={cn("text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border", statusColor)}>
                    {statusText}
                  </span>
                  <span className="text-[9px] text-base-content/30 mt-0.5 font-medium font-mono">Target &lt;1.5s</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Cột phải: 2 thẻ chồng lên nhau (Chiếm 2/5 cột) */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {/* Thẻ 1: Khách hài lòng */}
          <div className="bg-base-200/40 rounded-xl p-3.5 border border-base-content/5 border-t-2 border-t-success flex flex-col justify-between grow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-success/5 blur-lg pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest font-mono">Hài lòng</span>
              <span className="text-sm">😊</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold tracking-tight text-base-content font-mono leading-none">
                {data?.satisfaction.value || '0%'}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-base-content/50 font-medium">Khách phản hồi</span>
                {data?.satisfaction.trend && (
                  <span className={cn(
                    "text-[9px] font-bold px-1 rounded flex items-center gap-0.5",
                    data.satisfaction.trendDirection === 'up' ? "text-success bg-success/10" : "text-error bg-error/10"
                  )}>
                    {data.satisfaction.trendDirection === 'up' && '↑'}
                    {data.satisfaction.trendDirection === 'down' && '↓'}
                    {data.satisfaction.trendDirection === 'stable' && '→'}
                    {data.satisfaction.trend}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Thẻ 2: Thời gian tiết kiệm */}
          <div className="bg-base-200/40 rounded-xl p-3.5 border border-base-content/5 border-t-2 border-t-info flex flex-col justify-between grow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-info/5 blur-lg pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest font-mono">Tiết kiệm</span>
              <span className="text-sm text-info">⏱</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold tracking-tight text-base-content font-mono leading-none">
                {data?.timeSaved.value || '0.0h'}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-base-content/50 font-medium">Thời gian vận hành</span>
                {data?.timeSaved.trend && (
                  <span className={cn(
                    "text-[9px] font-bold px-1 rounded flex items-center gap-0.5",
                    data.timeSaved.trendDirection === 'up' ? "text-success bg-success/10" : "text-error bg-error/10"
                  )}>
                    {data.timeSaved.trendDirection === 'up' && '↑'}
                    {data.timeSaved.trendDirection === 'down' && '↓'}
                    {data.timeSaved.trendDirection === 'stable' && '→'}
                    {data.timeSaved.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Row */}
      <div className="mt-auto pt-3 border-t border-base-content/5 flex items-center justify-between gap-4">
        {isDrafting ? (
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] text-base-content/60 font-semibold italic animate-pulse">AI đang soạn draft...</span>
            </div>
            
            {/* Active animated shimmer progress indicator */}
            <div className="flex-1 max-w-[140px] h-1 bg-base-content/5 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-primary/30 to-transparent" 
                   style={{ backgroundSize: '200% 100%' }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success/80"></span>
              <span className="text-[11px] text-base-content/40 font-semibold uppercase tracking-wider font-mono">Standby</span>
            </div>
            
            {/* Static line indicator */}
            <div className="flex-1 max-w-[140px] h-[1px] bg-base-content/5" />
          </>
        )}
      </div>
    </div>
  );
};

const AISummaryCardSkeleton = () => (
  <div className="p-5 border border-base-content/5 bg-base-100 rounded-2xl h-full flex flex-col shadow-sm">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Shimmer width="28px" height="28px" className="rounded-lg" />
        <Shimmer width="140px" height="18px" />
      </div>
      <Shimmer width="50px" height="18px" className="rounded" />
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 grow animate-pulse">
      {/* Cột trái lớn */}
      <div className="md:col-span-3 bg-base-200/40 rounded-xl p-4 border border-base-content/5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-3">
            <Shimmer width="60px" height="12px" />
            <Shimmer width="70px" height="16px" className="rounded" />
          </div>
          <Shimmer width="100px" height="36px" className="mb-2" />
          <Shimmer width="120px" height="12px" />
        </div>
        <div className="border-t border-base-content/5 my-3" />
        <div className="flex justify-between items-center">
          <div>
            <Shimmer width="60px" height="12px" className="mb-1" />
            <Shimmer width="50px" height="20px" />
          </div>
          <Shimmer width="70px" height="24px" className="rounded" />
        </div>
      </div>

      {/* Cột phải: 2 thẻ nhỏ */}
      <div className="md:col-span-2 flex flex-col gap-3">
        {/* Thẻ 1 */}
        <div className="bg-base-200/40 rounded-xl p-3.5 border border-base-content/5 flex flex-col justify-between grow">
          <div className="flex justify-between items-center mb-2">
            <Shimmer width="50px" height="10px" />
            <Shimmer width="16px" height="16px" className="rounded-full" />
          </div>
          <div>
            <Shimmer width="60px" height="24px" className="mb-1.5" />
            <Shimmer width="80px" height="10px" />
          </div>
        </div>

        {/* Thẻ 2 */}
        <div className="bg-base-200/40 rounded-xl p-3.5 border border-base-content/5 flex flex-col justify-between grow">
          <div className="flex justify-between items-center mb-2">
            <Shimmer width="50px" height="10px" />
            <Shimmer width="16px" height="16px" className="rounded-full" />
          </div>
          <div>
            <Shimmer width="50px" height="24px" className="mb-1.5" />
            <Shimmer width="80px" height="10px" />
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Status Skeleton */}
    <div className="mt-auto pt-3 border-t border-base-content/5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Shimmer width="8px" height="8px" className="rounded-full animate-ping" />
        <Shimmer width="100px" height="12px" />
      </div>
      <Shimmer width="100px" height="6px" className="rounded-full" />
    </div>
  </div>
);

