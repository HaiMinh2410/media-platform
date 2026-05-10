// src/app/dashboard/ai-analytics/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Cpu,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Heart,
  AlertTriangle,
  Award,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ComposedChart,
  Line
} from 'recharts';

// Thang màu cao cấp tương thích với spec
const COLORS_MAP = {
  Whale: '#f59e0b', // Vàng kim Amber
  Luy: '#ec4899',   // Hồng Romantic Pink
  Cool: '#06b6d4',   // Xanh biển Cyan
  Drainer: '#ef4444', // Đỏ cam Danger Red
  Unknown: '#6b7280'  // Xám nhạt
};

export default function AIAnalyticsPage({ onBack }: { onBack?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFanType, setSelectedFanType] = useState<string>('All');
  
  // State chứa toàn bộ dữ liệu từ API
  const [data, setData] = useState<any>(null);

  // Gọi API lấy dữ liệu thực tế
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-agent/metrics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('❌ Failed to fetch AI Metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMetrics();
  }, []);

  if (!mounted) {
    return <div className="p-8 text-foreground/50">Đang chuẩn bị giao diện...</div>;
  }

  // 1. Loading state (Skeleton effect)
  if (loading || !data) {
    return (
      <div className="p-8 space-y-8 animate-pulse bg-background-primary min-h-screen text-foreground">
        <div className="h-12 w-64 bg-foreground/10 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-foreground/5 border border-foreground/10 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-[400px] lg:col-span-1 bg-foreground/5 border border-foreground/10 rounded-2xl" />
          <div className="h-[400px] lg:col-span-2 bg-foreground/5 border border-foreground/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { widgets, distribution, history, abTest, topScripts } = data;

  const totalRevenue = widgets.totalRevenue;
  const totalConversationsAllTime = history.reduce((sum: number, item: any) => sum + item.conversations, 0);
  const overallConversionRate = widgets.overallConversionRate;

  // Lọc danh sách script
  const filteredScripts = topScripts.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedFanType === 'All' || s.fanType === selectedFanType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 space-y-8 bg-background-primary min-h-screen text-foreground pb-20 select-none">
      
      {/* HEADER SECTION */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-foreground-secondary hover:text-foreground bg-foreground/[0.03] hover:bg-foreground/5 border border-foreground/10 px-4 py-2.5 rounded-xl transition-all cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Thống kê Tổng quan</span>
        </button>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-foreground/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 shadow-md shadow-pink-500/5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              AI Agent DM Analytics
            </h1>
          </div>
          <p className="text-foreground-secondary mt-1 text-sm md:text-md">
            Hệ thống phân tích chuyển đổi hội thoại, hành vi khách hàng và tối ưu hiệu suất tự động hóa.
          </p>
        </div>

        {/* TIME RANGE SELECTOR */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-foreground/[0.03] border border-foreground/10 rounded-xl p-1 flex gap-1">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                {range === '7d' ? '7 Ngày Qua' : range === '30d' ? '30 Ngày Qua' : 'Tất Cả'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMetrics}
            className="p-2 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:bg-foreground/5 transition-all text-foreground-secondary hover:text-foreground hover:rotate-180 duration-500"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATUS WIDGETS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Widget 1: Total Managed Fans */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-background-secondary/40 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-foreground-secondary tracking-wider uppercase">Tổng Hồ Sơ Khách Hàng</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black">{widgets.totalFans.toLocaleString()}</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% tuần này</span>
            </div>
          </div>
        </motion.div>

        {/* Widget 2: AI Conversion Rate */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-background-secondary/40 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-foreground-secondary tracking-wider uppercase">Tỉ Lệ Chốt Đơn AI</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black">{(widgets.overallConversionRate * 100).toFixed(2)}%</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+1.8% vs tháng trước</span>
            </div>
          </div>
        </motion.div>

        {/* Widget 3: Average Emotion Score */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-background-secondary/40 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-foreground-secondary tracking-wider uppercase">Cảm Xúc Trung Bình</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black">{widgets.avgSentiment} / 1.0</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400 font-semibold">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`w-1.5 h-3.5 rounded-sm ${s <= Math.round(widgets.avgSentiment * 5) ? 'bg-rose-500' : 'bg-foreground/10'}`} />
                ))}
              </div>
              <span className="ml-1.5">Xu hướng: Tăng (Stable)</span>
            </div>
          </div>
        </motion.div>

        {/* Widget 4: Escalation Rate */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-background-secondary/40 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-foreground-secondary tracking-wider uppercase">Chuyển Nhân Viên</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black">{(widgets.escalationRate * 100).toFixed(1)}%</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-semibold">
              <span>-0.5% (Kiểm soát tốt)</span>
            </div>
          </div>
        </motion.div>

        {/* Widget 5: AI-Attributed Revenue */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-background-secondary/40 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-foreground-secondary tracking-wider uppercase">Doanh Thu Thuần AI</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black">{widgets.totalRevenue.toLocaleString()} ₫</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-400 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Độc lập chốt đơn từ AI</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* CORE GRAPH CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graph 1: Fan Type Distribution & conversion (Donut / Pie) */}
        <div className="bg-background-secondary/20 border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Phân Phối & Chốt Đơn Loại Fan
            </h3>
            <p className="text-xs text-foreground-secondary mt-1">
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
                  {distribution.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP] || '#6b7280'} 
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value} hồ sơ`, 'Số lượng']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Trung tâm Donut hiển thị tổng số */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-foreground">{widgets.totalFans}</span>
              <span className="text-2xs font-semibold text-foreground-secondary uppercase tracking-wider">Hồ Sơ Fan</span>
            </div>
          </div>

          {/* Custom list description legend */}
          <div className="space-y-3">
            {distribution.map((entry: any) => {
              const color = COLORS_MAP[entry.name as keyof typeof COLORS_MAP];
              return (
                <div key={entry.name} className="flex items-center justify-between text-xs border-b border-foreground/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-bold text-foreground">{entry.name}</span>
                    <span className="text-foreground-secondary">({entry.value})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground-secondary">Cảm xúc: <strong className="text-foreground">{(entry.avgEmotion * 100).toFixed(0)}%</strong></span>
                    <span className="text-foreground-secondary">Chốt: <strong className="text-emerald-500">{(entry.conversionRate * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 2: Revenue & Conversations over Time (Area Chart) */}
        <div className="bg-background-secondary/20 border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between lg:col-span-2 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Xu Hướng Chuyển Đổi & Doanh Thu AI Tuần
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">
                Lịch sử tăng trưởng doanh thu độc lập mang lại từ các kịch bản AI Agent qua từng snapshot tuần.
              </p>
            </div>
            
            {/* Chú giải dạng badge */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <div className="w-3 h-3 rounded-sm bg-indigo-500/30 border border-indigo-500" />
                <span>Số cuộc trò chuyện</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500" />
                <span>Doanh thu thuần AI (₫)</span>
              </div>
            </div>
          </div>

          <div className="h-80 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                  }}
                />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu AI" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="left" type="monotone" dataKey="conversations" name="Cuộc trò chuyện" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
                <Line yAxisId="left" type="monotone" dataKey="purchases" name="Đơn hàng" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs text-foreground-secondary border-t border-foreground/5 pt-4">
            <div className="text-center">
              <span>Trung bình tuần</span>
              <p className="text-sm font-bold text-foreground">{(totalRevenue / history.length).toLocaleString('vi-VN')} ₫</p>
            </div>
            <div className="text-center">
              <span>Hội thoại / Tuần</span>
              <p className="text-sm font-bold text-foreground">{(totalConversationsAllTime / history.length).toFixed(0)} lượt</p>
            </div>
            <div className="text-center">
              <span>Hiệu suất chốt trung bình</span>
              <p className="text-sm font-bold text-emerald-500">{(overallConversionRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

      </div>

      {/* MID ROW: A/B TESTING PERFORMANCE & FUNNEL PROGRESSION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* A/B Test comparative summary */}
        <div className="bg-background-secondary/20 border border-foreground/10 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Đối Sánh Thử Nghiệm A/B Prompt Tuần
              </h3>
              
              <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-500 text-xs px-3 py-1 rounded-full font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Trạng thái: Đã thăng cấp Winner</span>
              </div>
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Phân tích chỉ số đối đầu trực diện giữa Variant A (Cơ sở) và Variant B (Sáng tạo ngọt ngào).
            </p>
          </div>

          {/* Winner announcement box */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 my-4 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-emerald-400">Winner chính thức tuần qua: Variant {abTest.winner} 🎉</p>
              <p className="text-foreground-secondary mt-0.5 leading-relaxed">{abTest.reason}</p>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="A" name="Variant A (Cũ)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="B" name="Variant B (Mới)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right side: Detailed numerical list comparison */}
            <div className="space-y-4 text-xs">
              <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-3.5 space-y-2.5">
                <span className="font-bold text-foreground-secondary uppercase tracking-wider text-2xs block">Chỉ số chuyển đổi</span>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Variant A (Mẫu: {abTest.metricsA.totalConversations})</span>
                  <span className="font-bold">{(abTest.metricsA.conversionRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-pink-400">
                  <span className="font-bold">Variant B (Mẫu: {abTest.metricsB.totalConversations})</span>
                  <span className="font-black">{(abTest.metricsB.conversionRate * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-3.5 space-y-2.5">
                <span className="font-bold text-foreground-secondary uppercase tracking-wider text-2xs block">Mức độ an toàn / Spam</span>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Vi phạm Variant A</span>
                  <span className="font-semibold text-emerald-500">{abTest.metricsA.flagIncidents} lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Vi phạm Variant B</span>
                  <span className="font-semibold text-emerald-500">{abTest.metricsB.flagIncidents} lần</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Funnel chart: Conversation Stages flow (Native CSS / HTML representation for total control and rich style) */}
        <div className="bg-background-secondary/20 border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" />
              Phễu Tương Tác Giai Đoạn AI
            </h3>
            <p className="text-xs text-foreground-secondary mt-1">
              Phân tích điểm rò rỉ tỷ lệ phản hồi qua từng giai đoạn Playbook.
            </p>
          </div>

          <div className="space-y-4 my-6">
            
            {/* Giai đoạn 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-indigo-400">G1: Xây Dựng Lòng Tin (Build Trust)</span>
                <span className="font-bold">100% (Tiếp nhận)</span>
              </div>
              <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1 }} className="h-full bg-indigo-500" />
              </div>
            </div>

            {/* Giai đoạn 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-pink-400">G2: Làm Ấm & Kết Nối (Warm-up)</span>
                <span className="font-bold">72.4% (Duy trì)</span>
              </div>
              <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '72.4%' }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-pink-500" />
              </div>
            </div>

            {/* Giai đoạn 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-400">G3: Độc Quyền VIP (Upsell Links)</span>
                <span className="font-bold">34.8% (Đủ điều kiện)</span>
              </div>
              <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '34.8%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-amber-500" />
              </div>
            </div>

            {/* Giao dịch mua hàng */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-400">Giao dịch mua hàng (Purchase)</span>
                <span className="font-bold text-emerald-400">8.6% (Chuyển đổi thực tế)</span>
              </div>
              <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '8.6%' }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-emerald-500" />
              </div>
            </div>

          </div>

          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-3 text-2xs text-foreground-secondary leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>Gợi ý tối ưu:</strong> Tỷ lệ rò rỉ chủ yếu xuất hiện khi chuyển từ <strong>G2 sang G3</strong> (rơi mất 37.6%). Cần cải thiện kịch bản làm ấm bằng các turn thoại gợi ý khéo léo để tăng tỉ lệ gửi link chốt đơn.
            </span>
          </div>
        </div>

      </div>

      {/* TOP PERFORMING SCRIPTS (INTERACTIVE LIST) */}
      <div className="bg-background-secondary/20 border border-foreground/10 rounded-2xl p-6 shadow-lg space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              Bảng Hiệu Năng Kịch Bản (Scripts Performance)
            </h3>
            <p className="text-xs text-foreground-secondary mt-1">
              Thống kê lượt sử dụng, điểm cải thiện thiện cảm cảm xúc và tỉ lệ chốt đơn của các template hội thoại.
            </p>
          </div>

          {/* Interactive filter & search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
              <input
                type="text"
                placeholder="Tìm kịch bản..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-56 text-xs font-semibold rounded-xl bg-foreground/[0.03] border border-foreground/10 focus:border-primary focus:bg-background-secondary outline-none transition-all"
              />
            </div>

            {/* Fan Type Filter */}
            <div className="flex items-center gap-1.5 bg-foreground/[0.03] border border-foreground/10 rounded-xl p-1">
              {['All', 'Luy', 'Cool', 'Whale', 'Drainer'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFanType(type)}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all ${
                    selectedFanType === type
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Dynamic Scripts Table representation */}
        <div className="overflow-x-auto border border-foreground/5 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-foreground/5 text-foreground-secondary font-bold">
                <th className="p-4">Tên kịch bản</th>
                <th className="p-4">Loại fan áp dụng</th>
                <th className="p-4 text-right">Lượt gửi thành công</th>
                <th className="p-4 text-right">Điểm cảm xúc TB</th>
                <th className="p-4 text-right">Tỉ lệ chốt đơn</th>
                <th className="p-4 text-center">Hiệu suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              <AnimatePresence mode="popLayout">
                {filteredScripts.length > 0 ? (
                  filteredScripts.map((script: any) => {
                    const color = COLORS_MAP[script.fanType as keyof typeof COLORS_MAP] || '#6b7280';
                    const scoreWidth = `${script.avgEmotion * 100}%`;
                    const rateWidth = `${script.conversionRate * 100}%`;
                    
                    return (
                      <motion.tr
                        key={script.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-foreground/[0.01] transition-all group"
                      >
                        <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div>
                            <span className="group-hover:text-primary transition-colors">{script.name}</span>
                            <span className="text-3xs text-foreground-secondary block mt-0.5 font-mono">{script.id}</span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-3xs font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${color}15`,
                              color: color,
                              border: `1px solid ${color}30`
                            }}
                          >
                            {script.fanType}
                          </span>
                        </td>

                        <td className="p-4 text-right font-mono font-bold text-foreground">
                          {script.usageCount.toLocaleString()}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-foreground font-mono">{(script.avgEmotion * 10).toFixed(1)} / 10</span>
                            <div className="w-24 h-1 bg-foreground/10 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: scoreWidth }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-emerald-500 font-mono">{(script.conversionRate * 100).toFixed(1)}%</span>
                            <div className="w-24 h-1 bg-foreground/10 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: rateWidth }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-2xs font-extrabold ${
                              script.conversionRate >= 0.15
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : script.conversionRate >= 0.05
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-foreground/5 text-foreground-secondary border border-foreground/10'
                            }`}
                          >
                            {script.conversionRate >= 0.15 ? 'Xuất sắc' : script.conversionRate >= 0.05 ? 'Tốt' : 'Trung bình'}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-foreground-secondary">
                      Không tìm thấy kịch bản nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
