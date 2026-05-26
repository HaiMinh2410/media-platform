'use client';

import * as React from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { BarChart3, Calendar, Sparkles } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';

interface EngagementFrequencyTabProps {
  data: PostDeepAnalyticsData;
}

export function EngagementFrequencyTab({ data }: EngagementFrequencyTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // 1. Engagement Breakdown Calculations
  const breakdown = data.engagementBreakdown;
  const totalInteractions = breakdown.likes + breakdown.comments + breakdown.shares + breakdown.saves;

  const breakdownChartData = [
    { name: 'Like', value: breakdown.likes, color: '#3b82f6' },
    { name: 'Comment', value: breakdown.comments, color: '#10b981' },
    { name: 'Share', value: breakdown.shares, color: '#a855f7' },
    { name: 'Save', value: breakdown.saves, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // 2. Post Frequency Calculations
  const rawFrequency = data.postFrequency;
  const totalPosts = rawFrequency.reduce((sum, d) => sum + d.count, 0);

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const frequencyChartData = rawFrequency.map(d => ({
    name: dayLabels[d.dayOfWeek],
    count: d.count,
    dayIndex: d.dayOfWeek
  })).sort((a, b) => {
    // Sort to T2 -> T7 -> CN (1 -> 6 -> 0)
    const orderA = a.dayIndex === 0 ? 7 : a.dayIndex;
    const orderB = b.dayIndex === 0 ? 7 : b.dayIndex;
    return orderA - orderB;
  });

  const maxCount = Math.max(...frequencyChartData.map(d => d.count), 1);
  const optimalDays = frequencyChartData.filter(d => d.count === maxCount).map(d => d.name);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-base-content/5 border-t border-base-content/5 p-5 gap-6 lg:gap-0">
      
      {/* SECTION 1: Engagement Breakdown (Col span 6) */}
      <div className="lg:col-span-6 lg:pr-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base-content flex items-center gap-2">
            <Icon lucide={BarChart3} size={18} className="text-emerald-400" />
            Phân Rã Tương Tác
          </h3>
          <p className="text-xs text-base-content/50 font-medium mt-0.5">Tỷ lệ đóng góp của từng hành vi tương tác trên kênh</p>
        </div>

        {totalInteractions === 0 ? (
          <div className="h-[240px] flex flex-col justify-center items-center text-center">
            <p className="text-base-content/40 text-xs font-semibold">Chưa có dữ liệu tương tác trong kỳ</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
            <div className="w-full sm:w-1/2 h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {breakdownChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const percent = ((item.value / totalInteractions) * 100).toFixed(1);
                        return (
                          <div className="bg-base-300/95 backdrop-blur-md border border-base-content/10 p-2.5 rounded-xl shadow-2xl min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-2xs font-extrabold text-base-content uppercase tracking-wider">{item.name}</span>
                            </div>
                            <div className="text-xs font-black font-mono text-base-content">
                              {numberFormatter(item.value)} <span className="text-base-content/40 text-2xs ml-0.5">({percent}%)</span>
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
                <span className="text-2xs text-base-content/40 uppercase tracking-widest font-bold font-mono">Total</span>
                <span className="text-lg font-black text-base-content font-mono">{numberFormatter(totalInteractions)}</span>
              </div>
            </div>

            <div className="w-full sm:w-1/2 divide-y divide-base-content/5">
              {breakdownChartData.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 group transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-md" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}30` }} />
                    <span className="text-sm font-bold text-base-content/60 group-hover:text-base-content transition-colors">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-base-content font-mono">{numberFormatter(item.value)}</div>
                    <div className="text-xs text-base-content/40 mt-0.5 font-mono font-extrabold">({((item.value / totalInteractions) * 100).toFixed(1)}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Post Frequency (Col span 6) */}
      <div className="lg:col-span-6 lg:pl-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base-content flex items-center gap-2">
              <Icon lucide={Calendar} size={18} className="text-blue-400" />
              Tần Suất Đăng Bài
            </h3>
            <div className="text-xs border-b border-base-content/10 px-1.5 py-0.5 uppercase tracking-widest text-base-content/60 font-black font-mono">
              {totalPosts} Posts
            </div>
          </div>
        </div>

        {totalPosts === 0 ? (
          <div className="h-[240px] flex flex-col justify-center items-center text-center">
            <p className="text-base-content/40 text-xs font-semibold">Chưa có bài đăng nào trong kỳ</p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 9, fontFamily: 'var(--font-mono)' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 9, fontFamily: 'var(--font-mono)' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    cursor={{ 
                      fill: 'transparent', 
                      stroke: 'var(--color-primary)', 
                      strokeWidth: 1.5, 
                      strokeOpacity: 0.25 
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-base-100/80 backdrop-blur-md border border-base-content/10 p-2.5 rounded-md shadow-2xl">
                            <div className="text-2xs font-extrabold text-base-content mb-0.5">{payload[0].payload.name}</div>
                            <div className="text-xs font-black text-blue-400 font-mono">
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
                    radius={[3, 3, 0, 0]}
                    animationDuration={1000}
                  >
                    {frequencyChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === maxCount ? 'var(--color-accent)' : 'var(--color-primary)'} 
                        fillOpacity={entry.count === maxCount ? 0.9 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
