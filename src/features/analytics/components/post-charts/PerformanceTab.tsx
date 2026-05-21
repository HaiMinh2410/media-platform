import * as React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { Activity, ArrowUpRight, ArrowDownRight, Heart } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';

const SafeTooltip = Tooltip as unknown as React.ComponentType<
  Omit<React.ComponentProps<typeof Tooltip>, 'formatter'> & {
    formatter?: (
      value: number,
      name: string
    ) => [React.ReactNode, React.ReactNode] | React.ReactNode;
  }
>;

interface PerformanceTabProps {
  data: PostDeepAnalyticsData;
}

export function PerformanceTab({ data }: PerformanceTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Performance Line Chart (Col span 2) */}
      <div className="lg:col-span-2 bg-foreground/1 border border-foreground/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Xu hướng Hiệu suất theo thời gian</h3>
            <p className="text-[11px] text-foreground/40">Biểu diễn lượt xem, lượt tiếp cận và tương tác tích lũy</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-medium">
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-1.5 bg-purple-500 rounded-full" /> Views
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-1.5 bg-blue-500 rounded-full" /> Reach
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-1.5 bg-emerald-500 rounded-full" /> Interactions
            </span>
          </div>
        </div>

        <div className="h-[360px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.03} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={numberFormatter}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={numberFormatter}
              />
              <SafeTooltip
                contentStyle={{
                  backgroundColor: 'oklch(var(--b3))',
                  border: '1px solid oklch(var(--bc) / 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ color: 'oklch(var(--bc))', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}
                itemStyle={{ fontSize: '11px', padding: '2px 0' }}
                formatter={(value, name) => {
                  const label = name === 'views' ? 'Lượt xem' : name === 'reach' ? 'Tiếp cận' : 'Tương tác';
                  return [numberFormatter(value), label];
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="views" 
                stroke="#a855f7" 
                strokeWidth={2.5} 
                dot={{ stroke: '#a855f7', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#a855f7' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="reach" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ stroke: '#3b82f6', strokeWidth: 1, r: 1 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="interactions" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ stroke: '#10b981', strokeWidth: 1, r: 1 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. MoM Comparison Metrics Cards */}
      <div className="flex flex-col gap-4">
        <div className="bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-400 mb-2">
              <Activity className="w-4 h-4" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">So sánh chu kỳ trước (MoM)</h3>
            </div>
            <p className="text-[11px] text-foreground/40">Phân tích mức độ tăng trưởng tương đối giữa 2 chu kỳ gần nhất</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {data.mom.map((m, idx) => {
              const isPositive = m.growth >= 0;
              return (
                <div key={idx} className="bg-foreground/2 border border-foreground/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wide">{m.metric}</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-bold text-foreground">{numberFormatter(m.current)}</span>
                      <span className="text-[9px] text-foreground/30">vs {numberFormatter(m.previous)}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg border",
                    isPositive 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{m.growth}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-foreground-secondary bg-foreground/2 border border-foreground/10 rounded-xl p-2.5 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Mẹo: Tăng trưởng tương tác cao hơn lượt xem thể hiện chất lượng nội dung hấp dẫn tăng.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
