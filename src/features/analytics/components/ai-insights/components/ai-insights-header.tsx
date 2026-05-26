import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIInsightsHeaderProps {
  timeRange: '7d' | '30d' | 'all';
  setTimeRange: (range: '7d' | '30d' | 'all') => void;
  fetchMetrics: () => Promise<void>;
}

export function AIInsightsHeader({
  timeRange,
  setTimeRange,
  fetchMetrics
}: AIInsightsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-base-content/5 pb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Agent DM Analytics
          </h1>
        </div>
        <p className="text-base-content/50 mt-1.5 text-sm font-medium">
          Hệ thống phân tích chuyển đổi hội thoại, hành vi khách hàng và tối ưu hiệu suất tự động hóa.
        </p>
      </div>

      {/* TIME RANGE SELECTOR */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="bg-base-200/70 border border-base-content/5 rounded-xl p-1 flex gap-1 shadow-inner">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
              }`}
            >
              {range === '7d' ? '7 Ngày Qua' : range === '30d' ? '30 Ngày Qua' : 'Tất Cả'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-base-200/70 border border-base-content/5 hover:bg-base-200 transition-all text-base-content/70 hover:text-base-content hover:rotate-180 duration-500 shadow-xs"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
