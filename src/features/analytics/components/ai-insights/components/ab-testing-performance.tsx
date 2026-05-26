import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface ABTestingPerformanceProps {
  abTest: {
    winner: string;
    reason: string;
    metricsA: {
      totalConversations: number;
      conversionRate: number;
      avgEmotionScore: number;
      flagIncidents: number;
    };
    metricsB: {
      totalConversations: number;
      conversionRate: number;
      avgEmotionScore: number;
      flagIncidents: number;
    };
  };
}

export function ABTestingPerformance({ abTest }: ABTestingPerformanceProps) {
  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm tracking-tight font-brand text-base-content">
              Đối Sánh Thử Nghiệm A/B Prompt Tuần
            </h3>
          </div>
          
          <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 text-secondary text-xs px-3 py-1 rounded-full font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Trạng thái: Đã thăng cấp Winner</span>
          </div>
        </div>
        <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
          Phân tích chỉ số đối đầu trực diện giữa Variant A (Cơ sở) và Variant B (Sáng tạo ngọt ngào).
        </p>
      </div>

      {/* Winner announcement box */}
      <div className="bg-success/5 border border-success/15 rounded-xl p-4 my-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-success/10 text-success mt-0.5 shadow-xs">
          <Award className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-success">Winner chính thức tuần qua: Variant {abTest.winner} 🎉</p>
          <p className="text-base-content/60 mt-1 leading-relaxed">{abTest.reason}</p>
        </div>
      </div>

      {/* 2-Column charts or direct stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Left side: Bar chart comparison */}
        <div className="h-56 md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Tỷ lệ chốt đơn', A: abTest.metricsA.conversionRate * 100, B: abTest.metricsB.conversionRate * 100 },
                { name: 'Cảm xúc fan', A: abTest.metricsA.avgEmotionScore * 100, B: abTest.metricsB.avgEmotionScore * 100 }
              ]}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-content)" strokeOpacity={0.05} />
              <XAxis dataKey="name" stroke="var(--color-base-content)" strokeOpacity={0.3} fontSize={11} tickLine={false} />
              <YAxis stroke="var(--color-base-content)" strokeOpacity={0.3} fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const itemA = payload[0];
                    const itemB = payload[1];
                    if (!itemA || !itemB) return null;
                    const valA = typeof itemA.value === 'number' ? itemA.value : Number(itemA.value) || 0;
                    const valB = typeof itemB.value === 'number' ? itemB.value : Number(itemB.value) || 0;
                    return (
                      <div className="bg-base-200/95 border border-base-content/10 rounded-xl p-3 shadow-lg text-xs text-base-content backdrop-blur-md space-y-1.5">
                        <p className="font-bold text-base-content border-b border-base-content/5 pb-1 mb-1 font-mono">{itemA.payload?.name}</p>
                        <div className="flex justify-between gap-6 font-medium">
                          <span className="text-primary font-semibold">Variant A (Mẫu):</span>
                          <span className="font-mono font-bold text-base-content">{valA.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between gap-6 font-medium">
                          <span className="text-secondary font-semibold">Variant B (Thử nghiệm):</span>
                          <span className="font-mono font-bold text-base-content">{valB.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="A" name="Variant A" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name="Variant B" fill="var(--color-accent-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right side: Detailed numerical list comparison */}
        <div className="space-y-3.5 text-xs">
          <div className="bg-base-200/50 border border-base-content/5 rounded-xl p-3.5 space-y-2.5 shadow-inner">
            <span className="font-bold text-base-content/40 uppercase tracking-widest font-mono text-3xs block">Chỉ số chuyển đổi</span>
            <div className="flex justify-between font-medium">
              <span className="text-base-content/50">Variant A (N={abTest.metricsA.totalConversations})</span>
              <span className="font-bold text-base-content font-mono">{(abTest.metricsA.conversionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between font-bold text-secondary">
              <span>Variant B (N={abTest.metricsB.totalConversations})</span>
              <span className="font-mono">{(abTest.metricsB.conversionRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-base-200/50 border border-base-content/5 rounded-xl p-3.5 space-y-2.5 shadow-inner">
            <span className="font-bold text-base-content/40 uppercase tracking-widest font-mono text-3xs block">Mức độ an toàn / Spam</span>
            <div className="flex justify-between font-medium">
              <span className="text-base-content/50">Vi phạm Var A</span>
              <span className="font-semibold text-success font-mono">{abTest.metricsA.flagIncidents} lần</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-base-content/50">Vi phạm Var B</span>
              <span className="font-semibold text-success font-mono">{abTest.metricsB.flagIncidents} lần</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
