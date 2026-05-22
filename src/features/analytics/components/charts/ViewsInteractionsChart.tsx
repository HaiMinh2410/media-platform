/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

// --- CONSTANTS ---
const COLOR_VIEWS = 'var(--color-secondary)';
const COLOR_INTERACTIONS = 'var(--color-success)';
const COLOR_BACKGROUND_VAR = 'var(--color-base-100)';

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
    if (rate >= RATE_EXCELLENT) return 'text-success';
    if (rate >= RATE_GOOD) return 'text-info';
    return 'text-warning';
  };

  return (
    <div className="w-full bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-md font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2 font-brand">
            <Icon lucide={Eye} size={18} className="text-secondary" />
            So sánh Lượt xem & Tương tác
          </h3>
          <p className="text-base-content/40 text-xs mt-1 font-medium">
            Theo dõi mối quan hệ giữa tổng lượt hiển thị (Views) và tổng lượt tương tác nhận được (Interactions)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-base-200/50 border border-base-content/5 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-base-content/40 uppercase font-bold block mb-1">Views TB/Ngày</span>
            <span className="text-sm font-extrabold text-secondary font-mono">{avgViews.toLocaleString()}</span>
          </div>
          <div className="bg-base-200/50 border border-base-content/5 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-base-content/40 uppercase font-bold block mb-1">Tương tác TB</span>
            <span className="text-sm font-extrabold text-success font-mono">{avgInteractions.toLocaleString()}</span>
          </div>
          <div className="bg-base-200/50 border border-base-content/5 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-base-content/40 uppercase font-bold block mb-1">Tỷ lệ tương tác</span>
            <span className={`text-sm font-extrabold font-mono ${getRateColorClass(avgInteractionRate)}`}>
              {avgInteractionRate}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '350px' }} className="relative mt-2 text-base-content/70">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              dy={10}
              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11, fontFamily: 'var(--font-mono)' }}
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
                    <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px] font-sans">
                      <div className="text-xs font-bold text-base-content/40 border-b border-base-content/10 pb-1 mb-1 font-mono">
                        {data.date}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                          <span>Views (Lượt xem):</span>
                        </div>
                        <span className="text-xs font-bold text-base-content font-mono">{viewsVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                          <div className="w-2.5 h-2.5 rounded-full bg-success" />
                          <span>Interactions (Tương tác):</span>
                        </div>
                        <span className="text-xs font-bold text-base-content font-mono">{engVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                        <span className="text-xs font-medium text-base-content/30">Tỷ lệ tương tác ngày:</span>
                        <span className={`text-xs font-bold font-mono ${getRateColorClass(Number(dailyRate))}`}>
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
                return <span className="text-xs font-semibold text-base-content/70 hover:text-base-content transition-colors">{label}</span>;
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
          <div className="mt-0.5 p-1.5 bg-base-content/5 rounded-lg shrink-0 flex items-center justify-center">
            <Icon lucide={interactionInsight.icon} size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-base-content">{interactionInsight.title}</h4>
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              {interactionInsight.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
