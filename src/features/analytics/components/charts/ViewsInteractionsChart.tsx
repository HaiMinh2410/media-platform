/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

// --- CONSTANTS (Clean Code: Tránh Magic Numbers) ---
const COLOR_VIEWS = '#a855f7';
const COLOR_INTERACTIONS = '#10b981';
const COLOR_BACKGROUND_VAR = 'var(--bg-primary)';

const RATE_EXCELLENT = 6;
const RATE_GOOD = 2;

interface ViewsInteractionsChartProps {
  chartData: any[];
  range: string;
  avgViews: number;
  avgInteractions: number;
  avgInteractionRate: number;
  interactionInsight: any;
}

export function ViewsInteractionsChart({
  chartData,
  range,
  avgViews,
  avgInteractions,
  avgInteractionRate,
  interactionInsight,
}: ViewsInteractionsChartProps) {

  const getRateColorClass = (rate: number) => {
    if (rate >= RATE_EXCELLENT) return 'text-emerald-400';
    if (rate >= RATE_GOOD) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <div className="w-full bg-foreground/2 backdrop-blur-md rounded-2xl border border-foreground/10 p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Icon lucide={Eye} size={18} className="text-purple-400" />
            So sánh Lượt xem & Tương tác
          </h3>
          <p className="text-foreground-secondary/40 text-xs mt-1">
            Theo dõi mối quan hệ giữa tổng lượt hiển thị (Views) và tổng lượt tương tác nhận được (Interactions)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Views TB/Ngày</span>
            <span className="text-sm font-extrabold text-purple-400">{avgViews.toLocaleString()}</span>
          </div>
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tương tác TB</span>
            <span className="text-sm font-extrabold text-emerald-400">{avgInteractions.toLocaleString()}</span>
          </div>
          <div className="bg-foreground/1 border border-foreground/10 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-foreground-secondary/40 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
            <span className={`text-sm font-extrabold ${getRateColorClass(avgInteractionRate)}`}>
              {avgInteractionRate}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '350px' }} className="relative mt-2">
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
                  const viewsVal = data.views || 0;
                  const engVal = data.engagement || 0;
                  const dailyRate = viewsVal > 0 ? ((engVal / viewsVal) * 100).toFixed(2) : '0';

                  return (
                    <div className="bg-base-300/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                      <div className="text-xs font-bold text-foreground-tertiary border-b border-foreground/10 pb-1 mb-1">
                        {data.date}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <span>Views (Lượt xem):</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{viewsVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Interactions (Tương tác):</span>
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
                const label = value === 'views' ? 'Views (Lượt xem)' : 'Interactions (Tương tác)';
                return <span className="text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors">{label}</span>;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke={COLOR_VIEWS} 
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: COLOR_VIEWS, strokeWidth: 2, fill: COLOR_BACKGROUND_VAR }}
            />
            <Line 
              type="monotone" 
              dataKey="engagement" 
              stroke={COLOR_INTERACTIONS} 
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: COLOR_INTERACTIONS, strokeWidth: 2, fill: COLOR_BACKGROUND_VAR }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {interactionInsight && (
        <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ${interactionInsight.color}`}>
          <div className="mt-0.5 p-1.5 bg-foreground/5 rounded-lg shrink-0">
            <Icon lucide={interactionInsight.icon} size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{interactionInsight.title}</h4>
            <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
              {interactionInsight.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
