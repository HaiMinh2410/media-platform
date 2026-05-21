'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, MousePointer2 } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { useQuery } from '@tanstack/react-query';
import { getEngagementBreakdownAction } from '@features/analytics/actions/analytics.actions';
import { AnalyticsRange } from '@features/analytics/types';

function getStaleTime(range: AnalyticsRange): number {
  switch (range) {
    case '7d': return 5 * 60 * 1000;    // 5 mins
    case '30d': return 15 * 60 * 1000;  // 15 mins
    case '90d': return 30 * 60 * 1000;  // 30 mins
    case 'custom': return 30 * 60 * 1000; // 30 mins
    default: return 5 * 60 * 1000;
  }
}

function useEngagementBreakdown(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date) {
  return useQuery({
    queryKey: ['engagement-breakdown', accountId, range, customStart, customEnd],
    queryFn: () => getEngagementBreakdownAction(accountId, range, customStart, customEnd),
    staleTime: getStaleTime(range),
  });
}

interface EngagementBreakdownChartProps {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
}

export function EngagementBreakdownChart({ 
  accountId, 
  range, 
  customStart, 
  customEnd 
}: EngagementBreakdownChartProps) {
  const { data: result, isPending, isError } = useEngagementBreakdown(accountId, range, customStart, customEnd);

  if (isPending) {
    return (
      <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 animate-pulse">
        <div className="w-48 h-6 bg-foreground/5 rounded mb-8"></div>
        <div className="flex items-center gap-8">
          <div className="w-40 h-40 bg-foreground/5 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="w-full h-4 bg-foreground/5 rounded"></div>
            <div className="w-2/3 h-4 bg-foreground/5 rounded"></div>
            <div className="w-3/4 h-4 bg-foreground/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !result?.data) return null;

  const { likes, comments, shares, saves } = result.data;
  const total = likes + comments + shares + saves;

  const data = [
    { name: 'Like', value: likes, color: '#3b82f6' },
    { name: 'Comment', value: comments, color: '#10b981' },
    { name: 'Share', value: shares, color: '#a855f7' },
    { name: 'Save', value: saves, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  if (total === 0) {
    return (
      <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 h-full flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-foreground/5 rounded-full mb-4">
          <Icon lucide={MousePointer2} size={24} className="text-foreground/20" />
        </div>
        <h3 className="text-foreground font-bold mb-1">Chưa có dữ liệu tương tác</h3>
        <p className="text-foreground-secondary/40 text-xs">Hãy thử đổi khoảng thời gian khác</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 h-full">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Icon lucide={BarChart3} size={18} className="text-emerald-400" />
        Engagement Breakdown
      </h3>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="w-full md:w-1/2 h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-base-300/90 backdrop-blur-xl border border-foreground/10 p-3 rounded-xl shadow-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-foreground">{item.name}</span>
                        </div>
                        <div className="text-sm font-medium text-foreground/90">
                          {item.value.toLocaleString()} <span className="text-foreground-secondary/40 ml-1">({percent}%)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-foreground-secondary/40 uppercase tracking-widest font-bold">Total</span>
            <span className="text-xl font-bold text-foreground">{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-foreground/2 border border-foreground/5 group hover:bg-foreground/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                <span className="text-sm font-medium text-foreground-secondary group-hover:text-foreground transition-colors">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{item.value.toLocaleString()}</div>
                <div className="text-[10px] text-foreground-tertiary font-medium">({((item.value / total) * 100).toFixed(1)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
