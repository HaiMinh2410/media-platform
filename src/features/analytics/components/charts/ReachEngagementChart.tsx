/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

// --- CONSTANTS (Clean Code: Tránh Magic Numbers) ---
const COLOR_REACH = '#3b82f6';
const COLOR_ENGAGEMENT = '#f97316';
const COLOR_BACKGROUND_DARK = '#121212';

const RATE_EXCELLENT = 15;
const RATE_GOOD = 5;

interface ReachEngagementChartProps {
  chartData: any[];
  range: string;
  avgReach: number;
  avgEngagement: number;
  avgEngagementRate: number;
  engagementInsight: any;
}

export function ReachEngagementChart({
  chartData,
  range,
  avgReach,
  avgEngagement,
  avgEngagementRate,
  engagementInsight,
}: ReachEngagementChartProps) {
  
  // Tránh lặp lại kiểu định nghĩa màu sắc động cho tỷ lệ tương tác
  const getRateColorClass = (rate: number) => {
    if (rate >= RATE_EXCELLENT) return 'text-emerald-400';
    if (rate >= RATE_GOOD) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <div className="w-full glass rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Icon lucide={Users} size={18} className="text-blue-400" />
            So sánh Tiếp cận & Tương tác
          </h3>
          <p className="text-foreground-secondary/50 text-xs mt-1">
            Xem mối tương quan giữa số người tiếp cận (Reach) và người tương tác thực tế (Engagement)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Reach TB/Ngày</span>
            <span className="text-sm font-extrabold text-blue-400">{avgReach.toLocaleString()}</span>
          </div>
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tương tác TB</span>
            <span className="text-sm font-extrabold text-orange-400">{avgEngagement.toLocaleString()}</span>
          </div>
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/60 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
            <span className={`text-sm font-extrabold ${getRateColorClass(avgEngagementRate)}`}>
              {avgEngagementRate}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '350px' }} className="relative mt-2 text-foreground-secondary">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
              dy={10}
              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const reachVal = data.reach || 0;
                  const engVal = data.engagement || 0;
                  const dailyRate = reachVal > 0 ? ((engVal / reachVal) * 100).toFixed(2) : '0';

                  return (
                    <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                      <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                        {data.date}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Reach (Tiếp cận):</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{reachVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          <span>Engagement (Tương tác):</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{engVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-1.5 mt-1">
                        <span className="text-xs font-medium text-foreground-secondary/40">Tỷ lệ tương tác ngày:</span>
                        <span className={`text-xs font-bold ${getRateColorClass(Number(dailyRate))}`}>
                          {dailyRate}%
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 2 }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              formatter={(value) => {
                const label = value === 'reach' ? 'Accounts Reached (Tiếp cận)' : 'Accounts Engaged (Tương tác)';
                return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="reach" 
              stroke={COLOR_REACH} 
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: COLOR_REACH, strokeWidth: 2, fill: COLOR_BACKGROUND_DARK }}
            />
            <Line 
              type="monotone" 
              dataKey="engagement" 
              stroke={COLOR_ENGAGEMENT} 
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: COLOR_ENGAGEMENT, strokeWidth: 2, fill: COLOR_BACKGROUND_DARK }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {engagementInsight && (
        <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${engagementInsight.color}`}>
          <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
            <Icon lucide={engagementInsight.icon} size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{engagementInsight.title}</h4>
            <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
              {engagementInsight.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
