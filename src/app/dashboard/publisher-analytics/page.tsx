'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, TrendingUp, CheckCircle2, XCircle, Activity, Share2, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PublisherAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    // Để an toàn và đồng nhất, thay vì check feature flag tại client (do thiếu userId),
    // ta gọi API metrics. Nếu API trả về 403/Flag disabled thì xử lý.
    const res = await fetch('/api/publish/metrics');
    
    if (res.status === 403) {
      setHasAccess(false);
      setLoading(false);
      return;
    }
    
    setHasAccess(true);
    
    try {
      const result = await res.json();
      if (result.chartData) {
        setData(result);
      } else {
        toast.error(result.message || 'Failed to load metrics');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
         <div className="relative">
           <Activity className="animate-spin text-blue-500" size={48} />
           <div className="absolute inset-0 animate-ping opacity-20 bg-blue-500 rounded-full" />
         </div>
         <p className="text-slate-400 font-medium animate-pulse">Đang tải dữ liệu phân tích...</p>
       </div>
     );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-2">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Social Publisher Pro</h2>
        <p className="text-slate-400 font-medium leading-relaxed">
          Tính năng theo dõi và phân tích đăng bài đa nền tảng đang trong giai đoạn thử nghiệm (Canary Rollout).
          Chúng tôi đang triển khai dần cho người dùng và sẽ sớm mở rộng cho tài khoản của bạn!
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Activity size={12} />
            Real-time Insights
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            Publisher <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Analytics</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-2xl">
            Phân tích hiệu suất đăng bài đa nền tảng. Theo dõi tỷ lệ thành công và xu hướng tăng trưởng nội dung của bạn.
          </p>
        </div>
        
        <button 
          onClick={checkAccessAndFetch}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/10 transition-all active:scale-95"
        >
          <Loader2 className={loading ? "animate-spin" : ""} size={16} />
          Làm mới dữ liệu
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Tổng bài đăng" 
          value={data.summary.total} 
          icon={<Share2 size={24} className="text-blue-400" />}
          description="7 ngày qua"
        />
        <MetricCard 
          label="Tỷ lệ thành công" 
          value={data.summary.successRate} 
          icon={<TrendingUp size={24} className="text-green-400" />}
          trend={parseInt(data.summary.successRate) > 80 ? 'Positive' : 'Neutral'}
          description="Dựa trên tổng job"
        />
        <MetricCard 
          label="Thành công" 
          value={data.summary.success} 
          icon={<CheckCircle2 size={24} className="text-emerald-400" />}
          description="Jobs hoàn tất"
        />
        <MetricCard 
          label="Thất bại" 
          value={data.summary.failed} 
          icon={<XCircle size={24} className="text-red-400" />}
          trend={data.summary.failed > 0 ? 'Negative' : 'Positive'}
          description="Jobs lỗi"
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/[0.02] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-blue-500/10" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Activity size={24} className="text-blue-500" />
                Performance Trends
              </h2>
              <p className="text-slate-500 text-sm font-medium">Biểu đồ so sánh số lượng bài đăng thành công và thất bại theo ngày</p>
            </div>
            
            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-xs font-bold text-green-400 uppercase">Thành công</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <span className="text-xs font-bold text-red-400 uppercase">Thất bại</span>
              </div>
            </div>
          </div>
          
          <div className="h-[450px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1.5rem',
                    padding: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ fontSize: '14px', fontWeight: 700, padding: '4px 0' }}
                  labelStyle={{ color: '#64748b', fontWeight: 800, marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area 
                  name="Thành công"
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSuccess)" 
                  animationDuration={1500}
                />
                <Area 
                  name="Thất bại"
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorFailed)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  trend, 
  description 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: 'Positive' | 'Negative' | 'Neutral';
  description?: string;
}) {
  return (
    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] flex flex-col justify-between hover:bg-white/[0.05] transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-black/40 rounded-2xl border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
            trend === 'Positive' ? "text-green-400 bg-green-400/10 border-green-500/20" : 
            trend === 'Negative' ? "text-red-400 bg-red-400/10 border-red-500/20" :
            "text-slate-400 bg-slate-400/10 border-slate-500/20"
          )}>
            {trend === 'Positive' ? <ArrowUpRight size={12} /> : 
             trend === 'Negative' ? <ArrowDownRight size={12} /> : null}
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-4xl font-black text-white tracking-tighter">{value}</div>
        {description && <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider pt-2">{description}</p>}
      </div>
    </div>
  );
}
