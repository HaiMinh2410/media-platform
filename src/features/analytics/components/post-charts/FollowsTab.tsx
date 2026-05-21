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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export function FollowsTab({ data }: FollowsTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Build Waterfall Stack Data for Recharts safely
  // base = bottom transparent buffer, value = height of bar, color = rendering gradient
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Follower Growth Attribution (Waterfall Chart - Col span 2) */}
      <div className="lg:col-span-2 bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Đóng góp Lượt Theo Dõi mới</h3>
          <p className="text-[11px] text-foreground/40">Biểu đồ thác nước (Waterfall) đóng góp Follows mới của từng bài viết dẫn đầu</p>
        </div>

        <div className="h-[280px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 10, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.03} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={9} 
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
                labelStyle={{ color: 'oklch(var(--bc))', fontWeight: 'bold', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px' }}
                formatter={(value, name) => {
                  const item = waterfallData.find(w => w.name === name);
                  if (!item) return [numberFormatter(value), String(name)];
                  if (item.isFinal) return [`+${item.value} Follows`, 'Tổng cộng kênh'];
                  return [`+${item.displayVal} Follows`, 'Lượt đóng góp'];
                }}
              />
              {/* Stacked transparent base bar to float the waterfall */}
              <Bar dataKey="base" stackId="a" fill="transparent" />
              
              {/* Actual value bar with coloring based on index and final state */}
              <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]}>
                {waterfallData.map((entry, index) => {
                  const color = entry.isFinal ? '#8b5cf6' : COLORS[index % COLORS.length];
                  return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-foreground-tertiary border border-foreground/10 bg-foreground/2 rounded-xl p-2 text-center">
          Tổng số lượng follower mang lại từ bài viết trong kỳ: <span className="font-bold text-foreground">+{data.waterfall[data.waterfall.length - 1]?.total} Follows</span>
        </div>
      </div>

      {/* 2. Audience Retention Conversion Funnel */}
      <div className="bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Phễu Chuyển Đổi Khán Giả</h3>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[11px] text-foreground/40">Tỉ lệ rớt của hành động: Reach → Follower mới</p>
        </div>

        {/* Funnel list layout */}
        <div className="space-y-3.5 my-4 flex-1 flex flex-col justify-center">
          {data.funnel.map((f, idx) => {
            const widthVal = `${f.percentage}%`;
            return (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/60 mb-1 px-1 relative z-10">
                  <span className="truncate max-w-[120px]">{f.stage}</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-foreground">{numberFormatter(f.value)}</span>
                    <span className="text-purple-400">({f.percentage}%)</span>
                  </div>
                </div>

                {/* Custom bar design simulating the tapered funnel shape */}
                <div className="w-full h-4 bg-foreground/2 border border-foreground/10 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: widthVal }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full shadow-lg",
                      idx === 0 
                        ? "bg-linear-to-r from-blue-600 to-indigo-500" 
                        : idx === 5 
                          ? "bg-linear-to-r from-emerald-600 to-teal-500" 
                          : "bg-linear-to-r from-purple-600 to-pink-500"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[9px] text-foreground/30 border border-foreground/10 bg-foreground/2 rounded-xl p-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Tỷ lệ New Followers / Reach thể hiện sức hút giữ chân khán giả trung thực của kênh.</span>
        </div>
      </div>
    </div>
  );
}
