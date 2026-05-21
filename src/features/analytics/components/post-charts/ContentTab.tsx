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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export function ContentTab({ data }: ContentTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Media Type Donut Chart */}
      <div className="bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1">Phân phối Loại Media</h3>
          <p className="text-[11px] text-foreground/40">Tỷ lệ đóng góp bài viết của các định dạng nội dung khác nhau</p>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
                  ))}
                </Pie>
                <SafeTooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--b3))',
                    border: '1px solid oklch(var(--bc) / 0.1)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: 'oklch(var(--bc))' }}
                  formatter={(value) => [`${value} bài viết`, 'Số lượng']}
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
                <div key={idx} className="flex items-center gap-3 bg-foreground/2 border border-foreground/10 rounded-xl px-3.5 py-1.5 min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[11px] font-semibold text-foreground/70">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-[10px] text-foreground/30 border border-foreground/10 bg-foreground/2 rounded-xl p-2 text-center">
          Tổng số lượng nội dung phân tích trong kỳ: <span className="font-bold text-foreground">{data.contentType.mediaDistribution.reduce((acc, curr) => acc + curr.value, 0)} bài viết</span>
        </div>
      </div>

      {/* 2. Location Type Performance Bar Chart */}
      <div className="bg-foreground/1 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1">Hiệu quả theo Bối cảnh chụp (Shot Type)</h3>
          <p className="text-[11px] text-foreground/40">So sánh lượt xem và tương tác trung bình của từng phong cách</p>
        </div>

        <div className="h-[250px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.contentType.locationTypePerformance}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.03} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                opacity={0.3} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
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
                labelStyle={{ color: 'oklch(var(--bc))', fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}
                itemStyle={{ fontSize: '11px' }}
                formatter={(value, name) => {
                  const label = name === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB';
                  return [numberFormatter(value), label];
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10} 
                fontSize={10}
                formatter={(value) => <span className="text-[10px] text-foreground/60 font-semibold">{value === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB'}</span>}
              />
              <Bar dataKey="avgViews" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="avgInteractions" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-foreground-tertiary border border-foreground/10 bg-foreground/2 rounded-xl p-2 flex items-center gap-2 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Gợi ý: Dữ liệu giúp định hướng phong cách chụp hình thu hút nhiều tương tác nhất.</span>
        </div>
      </div>
    </div>
  );
}
