import * as React from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Sparkles } from 'lucide-react';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';

const SafeTooltip = Tooltip as unknown as React.ComponentType<
  Omit<React.ComponentProps<typeof Tooltip>, 'formatter'> & {
    formatter?: (
      value: number,
      name: string
    ) => [React.ReactNode, React.ReactNode] | React.ReactNode;
  }
>;

interface ContentTabProps {
  data: PostDeepAnalyticsData;
}

const COLORS = ['var(--color-info)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-success)'];

export function ContentTab({ data }: ContentTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* 1. Media Type Donut Chart */}
      <div className="bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-base-content mb-1 font-brand">Phân phối Loại Media</h3>
          <p className="text-[11px] text-base-content/50 font-medium">Tỷ lệ đóng góp bài viết của các định dạng nội dung khác nhau</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-6 h-[240px]">
          <div className="w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.contentType.mediaDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.contentType.mediaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--color-base-100)" strokeWidth={2} />
                  ))}
                </Pie>
                <SafeTooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[120px] font-sans">
                          <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1.5 font-mono">{item.name}</div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-base-content/70 font-semibold">Số lượng:</span>
                            <span className="text-xs font-black font-mono text-base-content">{item.value} bài viết</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Custom Legends */}
          <div className="flex flex-col gap-2">
            {data.contentType.mediaDistribution.map((item, idx) => {
              const total = data.contentType.mediaDistribution.reduce((acc, curr) => acc + curr.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
              return (
                <div key={idx} className="flex items-center gap-3 bg-base-100 border border-base-content/5 rounded-xl px-3.5 py-1.5 min-w-[140px] justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[11px] font-bold text-base-content/70 font-brand">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-base-content font-mono">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-[10px] text-base-content/50 border border-base-content/5 bg-base-100 rounded-xl p-2.5 text-center font-medium shadow-xs">
          Tổng số lượng nội dung phân tích trong kỳ: <span className="font-bold text-base-content font-mono">{data.contentType.mediaDistribution.reduce((acc, curr) => acc + curr.value, 0)} bài viết</span>
        </div>
      </div>

      {/* 2. Location Type Performance Bar Chart */}
      <div className="bg-base-200/50 border border-base-content/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-base-content mb-1 font-brand">Hiệu quả theo Bối cảnh chụp (Shot Type)</h3>
          <p className="text-[11px] text-base-content/50 font-medium">So sánh lượt xem và tương tác trung bình của từng phong cách</p>
        </div>

        <div className="h-[250px] w-full mt-6 text-base-content/70">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.contentType.locationTypePerformance}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={10} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="currentColor" 
                opacity={0.5} 
                fontSize={10} 
                fontFamily="var(--font-mono)"
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <SafeTooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl min-w-[160px] space-y-1.5 font-sans">
                        <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1 font-mono">{label}</div>
                        {payload.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="text-xs text-base-content/70 font-semibold">
                                {item.name === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB'}
                              </span>
                            </div>
                            <span className="text-xs font-black font-mono text-base-content" style={{ color: item.fill }}>
                              {numberFormatter(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={8} 
                iconType="circle"
                formatter={(value) => <span className="text-xs text-base-content/70 font-semibold font-brand uppercase tracking-wider">{value === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB'}</span>}
              />
              <Bar dataKey="avgViews" fill="var(--color-info)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="avgInteractions" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-base-content/70 border border-base-content/5 bg-base-100 rounded-xl p-2.5 flex items-start gap-2 justify-center shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
          <span className="font-semibold">Gợi ý: Dữ liệu giúp định hướng phong cách chụp hình thu hút nhiều tương tác nhất.</span>
        </div>
      </div>
    </div>
  );
}
