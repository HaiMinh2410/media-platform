'use client';

import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Sparkles } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { useQuery } from '@tanstack/react-query';
import { getPostFrequencyAction } from '@features/analytics/actions/analytics.actions';
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

function usePostFrequency(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date) {
  return useQuery({
    queryKey: ['post-frequency', accountId, range, customStart, customEnd],
    queryFn: () => getPostFrequencyAction(accountId, range, customStart, customEnd),
    staleTime: getStaleTime(range),
  });
}

interface PostFrequencyChartProps {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
}

export function PostFrequencyChart({ 
  accountId, 
  range, 
  customStart, 
  customEnd 
}: PostFrequencyChartProps) {
  const { data: result, isPending, isError } = usePostFrequency(accountId, range, customStart, customEnd);

  if (isPending) {
    return (
      <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 animate-pulse">
        <div className="w-48 h-6 bg-foreground/5 rounded mb-8"></div>
        <div className="w-full h-[220px] bg-foreground/5 rounded-lg"></div>
      </div>
    );
  }

  if (isError || !result?.data) return null;

  const rawData = result.data;
  const totalPosts = rawData.reduce((sum, d) => sum + d.count, 0);

  if (totalPosts === 0) {
    return (
      <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 h-full flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-foreground/5 rounded-full mb-4">
          <Icon lucide={Calendar} size={24} className="text-foreground/20" />
        </div>
        <h3 className="text-foreground font-bold mb-1">Chưa có bài đăng nào</h3>
        <p className="text-foreground-secondary/40 text-xs">Hãy thử đổi khoảng thời gian khác</p>
      </div>
    );
  }

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const chartData = rawData.map(d => ({
    name: dayLabels[d.dayOfWeek],
    count: d.count,
    dayIndex: d.dayOfWeek
  })).sort((a, b) => {
    // Sort to T2 -> T7 -> CN (1 -> 6 -> 0)
    const orderA = a.dayIndex === 0 ? 7 : a.dayIndex;
    const orderB = b.dayIndex === 0 ? 7 : b.dayIndex;
    return orderA - orderB;
  });

  const maxCount = Math.max(...chartData.map(d => d.count));
  const optimalDays = chartData.filter(d => d.count === maxCount).map(d => d.name);

  return (
    <div className="w-full bg-foreground/2 rounded-2xl border border-foreground/10 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Icon lucide={Calendar} size={18} className="text-blue-400" />
          Tần suất đăng bài
        </h3>
        <div className="text-[10px] uppercase tracking-widest text-foreground-secondary/30 font-bold bg-foreground/5 px-2 py-1 rounded">
          {totalPosts} Posts
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-base-300/90 backdrop-blur-xl border border-foreground/10 p-3 rounded-xl shadow-2xl">
                      <div className="text-xs font-bold text-foreground mb-1">{payload[0].payload.name}</div>
                      <div className="text-sm font-medium text-blue-400">
                        {payload[0].value} bài đăng
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.count === maxCount ? '#f59e0b' : '#3b82f6'} 
                  fillOpacity={entry.count === maxCount ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
        <Icon lucide={Sparkles} size={14} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-foreground-secondary leading-relaxed">
          <span className="text-foreground font-bold">Thứ {optimalDays.join(', ')}</span> có tần suất đăng bài cao nhất. Hãy duy trì lịch đăng đều đặn vào những ngày này để tối đa hoá tiếp cận.
        </p>
      </div>
    </div>
  );
}
