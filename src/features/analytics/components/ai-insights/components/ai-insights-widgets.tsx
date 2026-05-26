import React from 'react';
import { Users, Zap, Heart, AlertTriangle, DollarSign, Cpu, TrendingUp } from 'lucide-react';

interface AIInsightsWidgetsProps {
  widgets: {
    totalFans: number;
    overallConversionRate: number;
    avgSentiment: number;
    escalationRate: number;
    totalRevenue: number;
  };
}

export function AIInsightsWidgets({ widgets }: AIInsightsWidgetsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      
      {/* Widget 1: Total Managed Fans */}
      <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-base-content/40 tracking-widest uppercase font-mono">Tổng Hồ Sơ Fan</span>
          <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-xs">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-base-content font-mono tracking-tight">{widgets.totalFans.toLocaleString()}</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-success font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% tuần này</span>
          </div>
        </div>
      </div>

      {/* Widget 2: AI Conversion Rate */}
      <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-base-content/40 tracking-widest uppercase font-mono">Tỉ Lệ Chốt Đơn AI</span>
          <div className="p-2 rounded-xl bg-success/10 text-success shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-base-content font-mono tracking-tight">{(widgets.overallConversionRate * 100).toFixed(2)}%</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-success font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+1.8% vs tháng trước</span>
          </div>
        </div>
      </div>

      {/* Widget 3: Average Emotion Score */}
      <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-base-content/40 tracking-widest uppercase font-mono">Cảm Xúc Trung Bình</span>
          <div className="p-2 rounded-xl bg-error/10 text-error shadow-xs">
            <Heart className="w-4 h-4 fill-error/20" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-base-content font-mono tracking-tight">{widgets.avgSentiment} / 1.0</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-error font-bold">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`w-1.5 h-3.5 rounded-xs ${s <= Math.round(widgets.avgSentiment * 5) ? 'bg-error' : 'bg-base-content/10'}`} />
              ))}
            </div>
            <span className="ml-1.5 font-sans font-semibold">Tăng nhẹ</span>
          </div>
        </div>
      </div>

      {/* Widget 4: Escalation Rate */}
      <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl group-hover:bg-warning/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-base-content/40 tracking-widest uppercase font-mono">Chuyển Nhân Viên</span>
          <div className="p-2 rounded-xl bg-warning/10 text-warning shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-base-content font-mono tracking-tight">{(widgets.escalationRate * 100).toFixed(1)}%</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-success font-bold">
            <span>-0.5% (Kiểm soát tốt)</span>
          </div>
        </div>
      </div>

      {/* Widget 5: AI-Attributed Revenue */}
      <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 rounded-full blur-2xl group-hover:bg-info/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-base-content/40 tracking-widest uppercase font-mono">Doanh Thu Thuần AI</span>
          <div className="p-2 rounded-xl bg-info/10 text-info shadow-xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-base-content font-mono tracking-tight">{widgets.totalRevenue.toLocaleString()} ₫</span>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-info font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Độc lập chốt bởi AI</span>
          </div>
        </div>
      </div>

    </div>
  );
}
