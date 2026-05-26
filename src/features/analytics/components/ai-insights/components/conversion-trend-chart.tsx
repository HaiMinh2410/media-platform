import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line
} from 'recharts';

interface ConversionTrendChartProps {
  history: Array<{
    week: string;
    conversations: number;
    purchases: number;
    revenue: number;
  }>;
  totalRevenue: number;
  overallConversionRate: number;
}

export function ConversionTrendChart({
  history,
  totalRevenue,
  overallConversionRate
}: ConversionTrendChartProps) {
  const totalConversationsAllTime = history.reduce((sum, item) => sum + item.conversations, 0);

  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 flex flex-col justify-between lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-98">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm tracking-tight font-brand text-base-content">
              Xu Hướng Chuyển Đổi & Doanh Thu AI Tuần
            </h3>
          </div>
          <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
            Lịch sử tăng trưởng doanh thu độc lập mang lại từ các kịch bản AI Agent qua từng snapshot tuần.
          </p>
        </div>
        
        {/* Chú giải dạng badge */}
        <div className="flex items-center gap-3.5 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-primary">
            <div className="w-3 h-3 rounded-xs bg-primary/20 border border-primary" />
            <span>Số cuộc trò chuyện</span>
          </div>
          <div className="flex items-center gap-1.5 text-success">
            <div className="w-3 h-3 rounded-xs bg-success/20 border border-success" />
            <span>Doanh thu tuần (₫)</span>
          </div>
        </div>
      </div>

      <div className="h-80 my-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-content)" strokeOpacity={0.05} />
            <XAxis dataKey="week" stroke="var(--color-base-content)" strokeOpacity={0.3} fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" stroke="var(--color-base-content)" strokeOpacity={0.3} fontSize={11} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--color-base-content)" strokeOpacity={0.3} fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-base-200/95 border border-base-content/10 rounded-xl p-3.5 shadow-lg text-xs text-base-content backdrop-blur-md space-y-1.5">
                      <p className="font-bold text-base-content border-b border-base-content/5 pb-1 mb-1 font-mono">{label}</p>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex justify-between gap-6 font-medium">
                          <span style={{ color: p.color }} className="font-semibold">{p.name}:</span>
                          <span className="font-mono font-bold text-base-content">
                            {p.name.includes("Doanh thu") ? `${p.value.toLocaleString()} ₫` : p.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu AI" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            <Area yAxisId="left" type="monotone" dataKey="conversations" name="Cuộc trò chuyện" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
            <Line yAxisId="left" type="monotone" dataKey="purchases" name="Đơn hàng" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-around text-xs text-base-content/40 border-t border-base-content/5 pt-4">
        <div className="text-center">
          <span className="font-mono uppercase tracking-widest font-bold text-3xs">Trung bình tuần</span>
          <p className="text-sm font-bold text-base-content mt-0.5 font-mono">{(totalRevenue / history.length).toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="text-center">
          <span className="font-mono uppercase tracking-widest font-bold text-3xs">Hội thoại / Tuần</span>
          <p className="text-sm font-bold text-base-content mt-0.5 font-mono">{(totalConversationsAllTime / history.length).toFixed(0)} lượt</p>
        </div>
        <div className="text-center">
          <span className="font-mono uppercase tracking-widest font-bold text-3xs">Tỉ lệ chốt TB</span>
          <p className="text-sm font-bold text-success mt-0.5 font-mono">{(overallConversionRate * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
