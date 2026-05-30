import { cn } from "@shared/lib";

import * as React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
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
      thumbnailUrl?: string | null;
      caption?: string | null;
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
        thumbnailUrl: w.thumbnailUrl,
        caption: w.caption,
      });

      return isFinal ? acc : acc + w.change;
    }, 0);

    return result;
  }, [data.waterfall]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-x divide-base-content/5 border-t border-base-content/5 p-5">
      {/* 1. Follower Growth Attribution (Waterfall Chart - Col span 2) */}
      <div className="lg:col-span-8 pr-5 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base-content">Đóng góp Lượt Theo Dõi mới</h3>
          <p className="text-xs text-base-content/50 font-medium mt-0.5">Biểu đồ thác nước (Waterfall) đóng góp Follows mới của từng bài viết dẫn đầu</p>
        </div>

        <div className="h-[300px] w-full mt-6 text-base-content/70">
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
                cursor={{ 
                  fill: 'transparent', 
                  stroke: 'var(--color-primary)', 
                  strokeWidth: 1.5, 
                  strokeOpacity: 0.25
                }}
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const name = payload[0].payload.name;
                    const item = waterfallData.find(w => w.name === name);
                    if (!item) return null;
                    
                    const isOther = name === 'Các bài viết khác';
                    const isTotal = item.isFinal;
                    
                    const label = isTotal ? 'Tổng cộng kênh' : 'Lượt đóng góp';
                    const displayValText = isTotal ? `+${item.value} Follows` : `+${item.displayVal} Follows`;
                    
                    return (
                      <div className="flex min-w-[100px] max-w-[150px] animate-in fade-in zoom-in-95 duration-150">
                        {item.thumbnailUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-full aspect-square rounded-t-md overflow-hidden shrink-0">
                              <img 
                                src={item.thumbnailUrl} 
                                alt="Post Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col justify-between bg-base-300/90 backdrop-blur-xl border border-base-content/10 p-3 rounded-b-md">
                              <div className="text-[11px] text-base-content font-bold line-clamp-2 leading-tight">
                                {item.caption || name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider font-mono">
                                  {label}
                                </span>
                                <span className="text-xs font-black font-mono text-accent">
                                  {displayValText}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-md bg-base-300/90 backdrop-blur-xl border border-base-content/10">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-black text-base-content">
                                {name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-2xs text-base-content/50 font-bold uppercase tracking-wider font-mono">
                                  {label}
                                </span>
                                <span className={cn(
                                  "text-xs font-black font-mono",
                                  isTotal ? "text-primary" : "text-secondary"
                                )}>
                                  {displayValText}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
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

        <div className="text-xs text-base-content/70 text-center font-medium mt-3">
          Tổng số lượng follower mang lại từ bài viết trong kỳ: <span className="font-bold text-base-content font-mono">+{data.waterfall[data.waterfall.length - 1]?.total} Follows</span>
        </div>
      </div>

      {/* 2. Audience Retention Conversion Funnel */}
      <div className="lg:col-span-4 pl-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base-content">Phễu Chuyển Đổi Khán Giả</h3>
            <div className="relative group/funnel-info">
              <Layers className="w-4 h-4 text-accent cursor-help hover:scale-110 transition-transform duration-200" />
              {/* Custom Tooltip HUD */}
              <div className="absolute right-0 top-6 hidden group-hover/funnel-info:block z-50 bg-base-100/95 border border-base-content/10 p-3 rounded-xl text-xs text-base-content shadow-2xl w-[300px] pointer-events-none backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                <p className="font-extrabold text-accent uppercase tracking-wider mb-1.5 font-mono">Cách phễu hoạt động</p>
                <p className="leading-relaxed font-semibold text-base-content/80">
                  Phễu theo dõi hành trình khán giả từ lúc <span className="font-bold text-primary">Tiếp cận</span> → xem nội dung nhiều lần → <span className="font-bold text-primary">Tương tác</span> → ghé thăm trang cá nhân → nhấn <span className="font-bold text-success">Theo dõi</span>.
                </p>
                <div className="border-t border-base-content/5 mt-2 pt-2 space-y-1 text-base-content/60 font-bold leading-relaxed">
                  <p>• <span className="text-accent font-extrabold font-mono">Tần suất xem (Ví dụ: 2.75x)</span>: Số lượt xem trung bình của mỗi người tiếp cận.</p>
                  <p>• <span className="text-accent font-extrabold font-mono">Tỉ lệ chuyển đổi (Ví dụ: 20.4%)</span>: Tỉ lệ người quyết định bấm Theo dõi sau khi ghé thăm trang cá nhân.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-base-content/50 font-medium mt-0.5">Tỉ lệ rớt của hành động: Reach → Follower mới</p>
        </div>

        {/* Funnel list layout */}
        <div className="space-y-3.5 my-4 flex-1 flex flex-col justify-center">
          {data.funnel.map((f, idx) => {
            const widthVal = `${f.barWidth}%`;
            return (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between text-xs font-semibold text-base-content/60 mb-1 px-1 relative z-10">
                  <span className="truncate max-w-[120px]">{f.stage}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base-content font-mono">{numberFormatter(f.value)}</span>
                    <span className="text-accent font-mono font-bold">({f.percentage})</span>
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
                        : idx === data.funnel.length - 1 
                          ? "bg-linear-to-r from-success to-teal-500" 
                          : "bg-linear-to-r from-secondary to-accent"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
