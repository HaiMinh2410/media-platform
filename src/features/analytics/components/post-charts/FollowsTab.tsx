import * as React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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

interface FollowsTabProps {
  data: PostDeepAnalyticsData;
}

const COLORS = ['var(--color-info)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-success)'];

export function FollowsTab({ data }: FollowsTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Build Waterfall Stack Data for Recharts safely
  const waterfallData = React.useMemo(() => {
    const result: Array<{
      name: string;
      base: number;
      value: number;
      displayVal: number;
      isFinal: boolean;
    }> = [];

    data.waterfall.reduce((acc, w, index) => {
      const isFinal = index === data.waterfall.length - 1;
      let base = 0;
      let value = 0;

      if (isFinal) {
        base = 0;
        value = w.total;
      } else {
        if (w.change > 0) {
          base = acc;
          value = w.change;
        } else {
          base = acc + w.change;
          value = Math.abs(w.change);
        }
      }

      result.push({
        name: w.name,
        base,
        value,
        displayVal: w.change,
        isFinal,
      });

      return isFinal ? acc : acc + w.change;
    }, 0);

    return result;
  }, [data.waterfall]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* 1. Follower Growth Attribution (Waterfall Chart - Col span 2) */}
      <div className="lg:col-span-2 bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-base-content font-brand">Đóng góp Lượt Theo Dõi mới</h3>
          <p className="text-[11px] text-base-content/50 font-medium">Biểu đồ thác nước (Waterfall) đóng góp Follows mới của từng bài viết dẫn đầu</p>
        </div>

        <div className="h-[280px] w-full mt-6 text-base-content/70">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 10, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={9} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={9} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <SafeTooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const name = payload[0].payload.name;
                    const item = waterfallData.find(w => w.name === name);
                    if (!item) return null;
                    
                    const label = item.isFinal ? 'Tổng cộng kênh' : 'Lượt đóng góp';
                    const displayValText = item.isFinal ? `+${item.value} Follows` : `+${item.displayVal} Follows`;
                    
                    return (
                      <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[140px] font-sans">
                        <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1.5 font-mono">{name}</div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-base-content/70 font-semibold">{label}:</span>
                          <span className="text-xs font-black font-mono text-base-content">{displayValText}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Stacked transparent base bar to float the waterfall */}
              <Bar dataKey="base" stackId="a" fill="transparent" />
              
              {/* Actual value bar with coloring based on index and final state */}
              <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]}>
                {waterfallData.map((entry, index) => {
                  const color = entry.isFinal ? 'var(--color-primary)' : COLORS[index % COLORS.length];
                  return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-base-content/70 border border-base-content/5 bg-base-100 rounded-xl p-2.5 text-center font-medium shadow-xs">
          Tổng số lượng follower mang lại từ bài viết trong kỳ: <span className="font-bold text-base-content font-mono">+{data.waterfall[data.waterfall.length - 1]?.total} Follows</span>
        </div>
      </div>

      {/* 2. Audience Retention Conversion Funnel */}
      <div className="bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-base-content font-brand">Phễu Chuyển Đổi Khán Giả</h3>
            <Layers className="w-4 h-4 text-accent" />
          </div>
          <p className="text-[11px] text-base-content/50 font-medium">Tỉ lệ rớt của hành động: Reach → Follower mới</p>
        </div>

        {/* Funnel list layout */}
        <div className="space-y-3.5 my-4 flex-1 flex flex-col justify-center">
          {data.funnel.map((f, idx) => {
            const widthVal = `${f.percentage}%`;
            return (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between text-[10px] font-bold text-base-content/60 mb-1 px-1 relative z-10 font-brand">
                  <span className="truncate max-w-[120px]">{f.stage}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base-content font-mono">{numberFormatter(f.value)}</span>
                    <span className="text-accent font-mono font-extrabold">({f.percentage}%)</span>
                  </div>
                </div>

                {/* Custom bar design simulating the tapered funnel shape */}
                <div className="w-full h-4 bg-base-100 border border-base-content/5 rounded-full overflow-hidden relative shadow-xs">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: widthVal }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full shadow-md",
                      idx === 0 
                        ? "bg-linear-to-r from-info to-primary" 
                        : idx === 5 
                          ? "bg-linear-to-r from-success to-teal-500" 
                          : "bg-linear-to-r from-secondary to-accent"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-base-content/70 border border-base-content/5 bg-base-100 rounded-xl p-2.5 flex items-start gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">Tỷ lệ New Followers / Reach thể hiện sức hút giữ chân khán giả trung thực của kênh.</span>
        </div>
      </div>
    </div>
  );
}
