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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* 1. Best Time to Post Heatmap (Col span 2) */}
      <div className="lg:col-span-2 bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-base-content font-brand">Khung Giờ Đăng Bài Tối Ưu</h3>
              <p className="text-[11px] text-base-content/50 font-medium">Ma trận Ngày × Giờ đăng bài, ô màu đậm = lượt xem cao</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-base-content/40 font-bold uppercase tracking-wider font-brand">
              <span>Ít view</span>
              <span className="w-8 h-2.5 rounded-[2px] bg-secondary/20" />
              <span className="w-8 h-2.5 rounded-[2px] bg-secondary/50" />
              <span className="w-8 h-2.5 rounded-[2px] bg-secondary/90" />
              <span>Nhiều view</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid implementation */}
        <div className="overflow-x-auto w-full mt-6 pb-2">
          <div className="min-w-[580px] space-y-1">
            {/* Hour Markers */}
            <div className="flex pl-8 text-[9px] font-extrabold text-base-content/30 tracking-tight">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex-1 text-center font-mono uppercase">
                  {i === 0 ? '12a' : i === 12 ? '12p' : i > 12 ? `${i - 12}` : `${i}`}
                </div>
              ))}
            </div>

            {/* Matrix Days Row */}
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                {/* Day Label */}
                <div className="w-8 text-[10px] font-bold text-base-content/50 text-left uppercase pr-2 font-mono">
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
                          "flex-1 h-5 rounded-[2px] transition-all duration-300 relative group cursor-pointer border border-transparent hover:border-base-content/20 hover:scale-105",
                          cell.count > 0 ? "bg-secondary" : "bg-base-300/30"
                        )}
                        style={{ opacity: cell.count > 0 ? opacityVal : 1 }}
                      >
                        {/* Hover Tooltip HUD */}
                        <div className="hidden group-hover:block absolute bottom-7 left-1/2 -translate-x-1/2 z-50 bg-base-300/95 border border-base-content/10 p-2.5 rounded-xl text-[9px] text-base-content shadow-2xl min-w-[125px] pointer-events-none backdrop-blur-md">
                          <p className="font-bold text-secondary font-brand">{daysName[dayIdx]} lúc {hourIdx}:00</p>
                          <p className="text-base-content/60 font-semibold mt-0.5">{cell.count} bài viết đăng</p>
                          <p className="font-extrabold text-base-content font-mono mt-0.5">Views: {numberFormatter(cell.views)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-base-content/70 border border-base-content/5 bg-base-100 rounded-xl p-2.5 flex items-start gap-2 mt-4 shadow-xs">
          <Calendar className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">Thông tin: Đăng bài vào các ô màu đậm nhất giúp tối đa hóa khả năng tiếp cận khán giả mục tiêu.</span>
        </div>
      </div>

      {/* 2. Engagement Rate per Post Scatter Plot */}
      <div className="bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-base-content mb-1 font-brand">Độ lan truyền (Scatter Plot)</h3>
          <p className="text-[11px] text-base-content/50 font-medium">Trục X: Lượt xem, Trục Y: Lượt Tương tác bài đăng</p>
        </div>

        <div className="h-[250px] w-full mt-6 text-base-content/70">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
              <XAxis 
                type="number" 
                dataKey="views" 
                name="Views" 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={9} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <YAxis 
                type="number" 
                dataKey="interactions" 
                name="Interactions" 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={9} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <ZAxis type="number" dataKey="er" range={[40, 160]} name="ER" />
              <SafeTooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const viewVal = payload.find((p: any) => p.name === 'Views')?.value || 0;
                    const intVal = payload.find((p: any) => p.name === 'Interactions')?.value || 0;
                    const erVal = payload.find((p: any) => p.name === 'ER')?.value || 0;
                    return (
                      <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[150px] space-y-1.5 font-sans">
                        <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1 font-mono">Chi tiết bài viết</div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-base-content/70 font-semibold">Lượt xem:</span>
                          <span className="text-xs font-black font-mono text-base-content">{numberFormatter(viewVal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-base-content/70 font-semibold">Tương tác:</span>
                          <span className="text-xs font-black font-mono text-base-content">{numberFormatter(intVal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                          <span className="text-xs text-base-content/40 font-bold">Tỷ lệ tương tác:</span>
                          <span className="text-xs font-black font-mono text-accent">{erVal}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-base-content)', strokeOpacity: 0.15, strokeWidth: 1.5 }}
              />
              <Scatter 
                name="Posts" 
                data={data.scatter} 
                fill="var(--color-accent)" 
                fillOpacity={0.65}
                stroke="var(--color-accent)"
                strokeWidth={1.5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-base-content/70 border border-base-content/5 bg-base-100 rounded-xl p-2.5 flex items-start gap-1.5 justify-center shadow-xs">
          <Percent className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">Bài viết nằm xa góc trên bên trái là bài có tỉ lệ tương tác rất cao.</span>
        </div>
      </div>
    </div>
  );
}
