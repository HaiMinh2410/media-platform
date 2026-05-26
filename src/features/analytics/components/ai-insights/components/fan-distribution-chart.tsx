import React from 'react';
import { Users } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS_MAP = {
  Whale: 'var(--color-status-warning)',    // Vàng Amber của hệ thống
  Luy: 'var(--color-accent-secondary)',    // Hồng Romantic của hệ thống
  Cool: 'var(--color-status-info)',        // Xanh Cyan của hệ thống
  Drainer: 'var(--color-status-error)',    // Đỏ cam của hệ thống
  Unknown: 'var(--color-foreground-tertiary)' // Xám nhạt
};

interface FanDistributionChartProps {
  distribution: Array<{
    name: string;
    value: number;
    avgEmotion: number;
    conversionRate: number;
  }>;
  totalFans: number;
}

export function FanDistributionChart({ distribution, totalFans }: FanDistributionChartProps) {
  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm tracking-tight font-brand text-base-content">
            Phân Phối & Chốt Đơn Loại Fan
          </h3>
        </div>
        <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
          Phân mảnh lưu lượng và hiệu quả chuyển đổi thực tế từng nhóm.
        </p>
      </div>

      <div className="h-64 my-4 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
            >
              {distribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP] || COLORS_MAP.Unknown} 
                  stroke="var(--color-base-100)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  if (!item) return null;
                  const name = item.name as string;
                  const value = typeof item.value === 'number' ? item.value : Number(item.value) || 0;
                  return (
                    <div className="bg-base-200/95 border border-base-content/10 rounded-xl p-3 shadow-lg text-xs text-base-content backdrop-blur-md">
                      <p className="font-bold flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block" 
                          style={{ backgroundColor: COLORS_MAP[name as keyof typeof COLORS_MAP] }} 
                        />
                        {name}
                      </p>
                      <p className="text-base-content/70 mt-1.5 font-medium">Số lượng: <span className="font-bold text-base-content font-mono">{value.toLocaleString()} fan</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Trung tâm Donut hiển thị tổng số */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-base-content font-mono">{totalFans.toLocaleString()}</span>
          <span className="text-3xs font-bold text-base-content/40 uppercase tracking-widest font-mono mt-0.5">Hồ Sơ Fan</span>
        </div>
      </div>

      {/* Custom list description legend */}
      <div className="space-y-2.5 border-t border-base-content/5 pt-4">
        {distribution.map((entry) => {
          const color = COLORS_MAP[entry.name as keyof typeof COLORS_MAP] || COLORS_MAP.Unknown;
          return (
            <div key={entry.name} className="flex items-center justify-between text-xs border-b border-base-content/5 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-bold text-base-content">{entry.name}</span>
                <span className="text-base-content/40 font-mono">({entry.value})</span>
              </div>
              <div className="flex items-center gap-3.5 font-medium text-base-content/70">
                <span>Cảm xúc: <strong className="text-base-content font-mono">{(entry.avgEmotion * 100).toFixed(0)}%</strong></span>
                <span>Chốt: <strong className="text-success font-mono">{(entry.conversionRate * 100).toFixed(0)}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
