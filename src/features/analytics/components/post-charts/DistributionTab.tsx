import * as React from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis 
} from 'recharts';
import { Sparkles, Percent, Calendar } from 'lucide-react';
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

interface DistributionTabProps {
  data: PostDeepAnalyticsData;
}

export function DistributionTab({ data }: DistributionTabProps) {
  // 1. Heatmap Setup
  const daysName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const maxViews = Math.max(...data.bestTime.map(d => d.views), 1);

  // 2. Engagement Scatter Setup
  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Best Time to Post Heatmap (Col span 2) */}
      <div className="lg:col-span-2 bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Khung Giờ Đăng Bài Tối Ưu</h3>
              <p className="text-[11px] text-foreground/40">Ma trận Ngày × Giờ đăng bài, ô màu đậm = lượt xem cao</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-foreground/40">
              <span>Mờ (Ít view)</span>
              <span className="w-8 h-2.5 rounded bg-purple-500/20" />
              <span className="w-8 h-2.5 rounded bg-purple-500/50" />
              <span className="w-8 h-2.5 rounded bg-purple-500/90" />
              <span>Đậm (Nhiều view)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid implementation */}
        <div className="overflow-x-auto w-full mt-6 pb-2">
          <div className="min-w-[580px] space-y-1">
            {/* Hour Markers */}
            <div className="flex pl-8 text-[9px] font-bold text-foreground/30 tracking-tight">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex-1 text-center font-mono">
                  {i === 0 ? '12a' : i === 12 ? '12p' : i > 12 ? `${i - 12}` : `${i}`}
                </div>
              ))}
            </div>

            {/* Matrix Days Row */}
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                {/* Day Label */}
                <div className="w-8 text-[10px] font-bold text-foreground/50 text-left uppercase pr-2">
                  {daysName[dayIdx]}
                </div>

                {/* 24 Heat cells */}
                <div className="flex-1 flex gap-0.5">
                  {Array.from({ length: 24 }).map((_, hourIdx) => {
                    const cell = data.bestTime.find(d => d.day === dayIdx && d.hour === hourIdx) || { count: 0, views: 0 };
                    const opacityVal = cell.count > 0 ? Math.max(0.18, cell.views / maxViews) : 0;
                    
                    return (
                      <div
                        key={hourIdx}
                        className={cn(
                          "flex-1 h-5 rounded-[2px] transition-all duration-300 relative group cursor-pointer border border-transparent hover:border-foreground/20 hover:scale-105",
                          cell.count > 0 ? "bg-purple-500" : "bg-foreground/2"
                        )}
                        style={{ opacity: cell.count > 0 ? opacityVal : 1 }}
                      >
                        {/* Hover Tooltip HUD */}
                        <div className="hidden group-hover:block absolute bottom-7 left-1/2 -translate-x-1/2 z-50 bg-base-300 border border-foreground/10 p-2 rounded-xl text-[9px] text-foreground shadow-2xl min-w-[110px] pointer-events-none backdrop-blur-md">
                          <p className="font-bold text-purple-400">{daysName[dayIdx]} lúc {hourIdx}:00</p>
                          <p className="text-foreground/60 mt-0.5">{cell.count} bài viết đăng</p>
                          <p className="font-semibold text-foreground mt-0.5">Views: {numberFormatter(cell.views)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-foreground/30 border border-foreground/10 bg-foreground/2 rounded-xl p-2.5 flex items-center gap-2 mt-4">
          <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Thông tin: Đăng bài vào các ô màu đậm nhất giúp tối đa hóa khả năng tiếp cận khán giả mục tiêu.</span>
        </div>
      </div>

      {/* 2. Engagement Rate per Post Scatter Plot */}
      <div className="bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1">Độ lan truyền (Scatter Plot)</h3>
          <p className="text-[11px] text-foreground/40">Trục X: Lượt xem, Trục Y: Lượt Tương tác bài đăng</p>
        </div>

        <div className="h-[250px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.03} vertical={false} />
              <XAxis 
                type="number" 
                dataKey="views" 
                name="Views" 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <YAxis 
                type="number" 
                dataKey="interactions" 
                name="Interactions" 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <ZAxis type="number" dataKey="er" range={[40, 160]} name="ER" />
              <SafeTooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'oklch(var(--bc) / 0.1)' }}
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
                  if (name === 'Views') return [numberFormatter(value), 'Lượt xem'];
                  if (name === 'Interactions') return [numberFormatter(value), 'Tương tác'];
                  return [`${value}%`, 'ER%'];
                }}
              />
              <Scatter 
                name="Posts" 
                data={data.scatter} 
                fill="#ec4899" 
                fillOpacity={0.65}
                stroke="#ec4899"
                strokeWidth={1.5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-foreground/30 border border-foreground/10 bg-foreground/2 rounded-xl p-2.5 flex items-center gap-1.5 justify-center">
          <Percent className="w-3.5 h-3.5 text-pink-400" />
          <span>Bài viết nằm xa góc trên bên trái là bài có tỉ lệ tương tác rất cao.</span>
        </div>
      </div>
    </div>
  );
}
