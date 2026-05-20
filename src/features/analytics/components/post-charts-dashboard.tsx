'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  TrendingUp, 
  BarChart2, 
  PieChart as PieIcon, 
  Grid3X3, 
  Users, 
  Flame, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Percent,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { PostDeepAnalyticsData } from '@features/analytics/services/post-analytics-engine';

interface PostChartsDashboardProps {
  accountId: string;
  range: string;
  customStart?: Date;
  customEnd?: Date;
  data: PostDeepAnalyticsData | null;
  isLoading?: boolean;
}

type TabType = 'performance' | 'content' | 'distribution' | 'follows';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
const LOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function PostChartsDashboard({
  accountId,
  range,
  data,
  isLoading = false
}: PostChartsDashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('performance');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !data) {
    return <PostChartsSkeleton />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return <PerformanceTab data={data} />;
      case 'content':
        return <ContentTab data={data} />;
      case 'distribution':
        return <DistributionTab data={data} />;
      case 'follows':
        return <FollowsTab data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl transition-all duration-300">
      {/* Header and Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Thống kê Nội dung Nâng cao</h2>
          </div>
          <p className="text-xs text-white/50 mt-1">Phân tích sâu hiệu suất bài đăng, xu hướng tương tác và phễu chuyển đổi</p>
        </div>

        {/* Glass Tabs */}
        <div className="flex flex-wrap bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-1 gap-1 self-start md:self-auto">
          {(
            [
              { id: 'performance', label: 'Xu hướng & So sánh', icon: TrendingUp },
              { id: 'content', label: 'Loại nội dung', icon: PieIcon },
              { id: 'distribution', label: 'Thời điểm & Chuyển đổi', icon: Grid3X3 },
              { id: 'follows', label: 'Tăng trưởng Follower', icon: Users }
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 select-none",
                  isActive ? "text-white" : "text-white/60 hover:text-white/80 hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePostChartTab"
                    className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-xl shadow-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-purple-400" : "text-white/60")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area with Transitions */}
      <div className="min-h-[480px] transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// TAB 1: PERFORMANCE & MOM COMPARISON
// ==========================================
function PerformanceTab({ data }: { data: PostDeepAnalyticsData }) {
  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Performance Line Chart (Col span 2) */}
      <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Xu hướng Hiệu suất theo thời gian</h3>
            <p className="text-[11px] text-white/40">Biểu diễn lượt xem, lượt tiếp cận và tương tác tích lũy</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-medium">
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-1.5 bg-purple-500 rounded-full" /> Views
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-1.5 bg-blue-500 rounded-full" /> Reach
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-1.5 bg-emerald-500 rounded-full" /> Interactions
            </span>
          </div>
        </div>

        <div className="h-[360px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={numberFormatter}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={numberFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}
                itemStyle={{ fontSize: '11px', padding: '2px 0' }}
                formatter={(value: any, name: any) => {
                  const label = name === 'views' ? 'Lượt xem' : name === 'reach' ? 'Tiếp cận' : 'Tương tác';
                  return [numberFormatter(Number(value)), label];
                }}

              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="views" 
                stroke="#a855f7" 
                strokeWidth={2.5} 
                dot={{ stroke: '#a855f7', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#a855f7' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="reach" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ stroke: '#3b82f6', strokeWidth: 1, r: 1 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="interactions" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ stroke: '#10b981', strokeWidth: 1, r: 1 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. MoM Comparison Metrics Cards */}
      <div className="flex flex-col gap-4">
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-400 mb-2">
              <Activity className="w-4 h-4" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">So sánh chu kỳ trước (MoM)</h3>
            </div>
            <p className="text-[11px] text-white/40">Phân tích mức độ tăng trưởng tương đối giữa 2 chu kỳ gần nhất</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {data.mom.map((m, idx) => {
              const isPositive = m.growth >= 0;
              return (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">{m.metric}</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-bold text-white">{numberFormatter(m.current)}</span>
                      <span className="text-[9px] text-white/30">vs {numberFormatter(m.previous)}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg border",
                    isPositive 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{m.growth}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-white/30 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Mẹo: Tăng trưởng tương tác cao hơn lượt xem thể hiện chất lượng nội dung hấp dẫn tăng.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TAB 2: CONTENT TYPE BREAKDOWN
// ==========================================
function ContentTab({ data }: { data: PostDeepAnalyticsData }) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Media Type Donut Chart */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Phân phối Loại Media</h3>
          <p className="text-[11px] text-white/40">Tỷ lệ đóng góp bài viết của các định dạng nội dung khác nhau</p>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${value} bài viết`, 'Số lượng']}
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
                <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-1.5 min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[11px] font-semibold text-white/70">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-white">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-[10px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2 text-center">
          Tổng số lượng nội dung phân tích trong kỳ: <span className="font-bold text-white">{data.contentType.mediaDistribution.reduce((acc, curr) => acc + curr.value, 0)} bài viết</span>
        </div>
      </div>

      {/* 2. Location Type Performance Bar Chart */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Hiệu quả theo Bối cảnh chụp (Shot Type)</h3>
          <p className="text-[11px] text-white/40">So sánh lượt xem và tương tác trung bình của từng phong cách</p>
        </div>

        <div className="h-[250px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.contentType.locationTypePerformance}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}
                itemStyle={{ fontSize: '11px' }}
                formatter={(value: any, name: any) => {
                  const label = name === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB';
                  return [numberFormatter(Number(value)), label];
                }}

              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10} 
                fontSize={10}
                formatter={(value) => <span className="text-[10px] text-white/60 font-semibold">{value === 'avgViews' ? 'Lượt xem TB' : 'Tương tác TB'}</span>}
              />
              <Bar dataKey="avgViews" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="avgInteractions" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2 flex items-center gap-2 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Gợi ý: Dữ liệu giúp định hướng phong cách chụp hình thu hút nhiều tương tác nhất.</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TAB 3: BEST TIME HEATMAP & RETENTION FUNNEL
// ==========================================
function DistributionTab({ data }: { data: PostDeepAnalyticsData }) {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Best Time to Post Heatmap (Col span 2) */}
      <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Khung Giờ Đăng Bài Tối Ưu</h3>
              <p className="text-[11px] text-white/40">Ma trận Ngày × Giờ đăng bài, ô màu đậm = lượt xem cao</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-white/40">
              <span>Mờ (Ít view)</span>
              <span className="w-8 h-2.5 rounded bg-purple-500/20" />
              <span className="w-8 h-2.5 rounded bg-purple-500/50" />
              <span className="w-8 h-2.5 rounded bg-purple-500/90" />
              <span>Đậm (Nhiều view)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid implementation */}
        <div className="overflow-x-auto w-full mt-6 pb-2">
          <div className="min-w-[580px] space-y-1">
            {/* Hour Markers */}
            <div className="flex pl-8 text-[9px] font-bold text-white/30 tracking-tight">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex-1 text-center font-mono">
                  {i === 0 ? '12a' : i === 12 ? '12p' : i > 12 ? `${i - 12}` : `${i}`}
                </div>
              ))}
            </div>

            {/* Matrix Days Row */}
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                {/* Day Label */}
                <div className="w-8 text-[10px] font-bold text-white/50 text-left uppercase pr-2">
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
                          "flex-1 h-5 rounded-[2px] transition-all duration-300 relative group cursor-pointer border border-transparent hover:border-white/20 hover:scale-105",
                          cell.count > 0 ? "bg-purple-500" : "bg-white/[0.02]"
                        )}
                        style={{ opacity: cell.count > 0 ? opacityVal : 1 }}
                      >
                        {/* Hover Tooltip HUD */}
                        <div className="hidden group-hover:block absolute bottom-7 left-1/2 -translate-x-1/2 z-50 bg-black border border-white/10 p-2 rounded-xl text-[9px] text-white shadow-2xl min-w-[110px] pointer-events-none backdrop-blur-md">
                          <p className="font-bold text-purple-400">{daysName[dayIdx]} lúc {hourIdx}:00</p>
                          <p className="text-white/60 mt-0.5">{cell.count} bài viết đăng</p>
                          <p className="font-semibold text-white mt-0.5">Views: {numberFormatter(cell.views)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2.5 flex items-center gap-2 mt-4">
          <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>Thông tin: Đăng bài vào các ô màu đậm nhất giúp tối đa hóa khả năng tiếp cận khán giả mục tiêu.</span>
        </div>
      </div>

      {/* 2. Engagement Rate per Post Scatter Plot */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Độ lan truyền (Scatter Plot)</h3>
          <p className="text-[11px] text-white/40">Trục X: Lượt xem, Trục Y: Lượt Tương tác bài đăng</p>
        </div>

        <div className="h-[250px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                type="number" 
                dataKey="views" 
                name="Views" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <YAxis 
                type="number" 
                dataKey="interactions" 
                name="Interactions" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <ZAxis type="number" dataKey="er" range={[40, 160]} name="ER" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px' }}
                formatter={(value: any, name: any) => {
                  if (name === 'Views') return [numberFormatter(Number(value)), 'Lượt xem'];
                  if (name === 'Interactions') return [numberFormatter(Number(value)), 'Tương tác'];
                  return [`${value}%`, 'ER%'];
                }}

              />
              <Scatter 
                name="Posts" 
                data={data.scatter} 
                fill="#ec4899" 
                fillOpacity={0.65}
                stroke="#ec4899"
                strokeWidth={1.5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2.5 flex items-center gap-1.5 justify-center">
          <Percent className="w-3.5 h-3.5 text-pink-400" />
          <span>Bài viết nằm xa góc trên bên trái là bài có tỉ lệ tương tác rất cao.</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TAB 4: FOLLOWER GROWTH WATERFALL & RETENTION FUNNEL
// ==========================================
function FollowsTab({ data }: { data: PostDeepAnalyticsData }) {
  const numberFormatter = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  // Build Waterfall Stack Data for Recharts safely
  // base = bottom transparent buffer, value = height of bar, color = rendering gradient
  const waterfallData = React.useMemo(() => {
    let accumulated = 0;
    return data.waterfall.map((w, index) => {
      const isFinal = index === data.waterfall.length - 1;
      const isAttribution = w.change > 0;
      
      let base = 0;
      let value = 0;
      
      if (isFinal) {
        base = 0;
        value = w.total; // final column represents total followers
      } else {
        base = accumulated;
        value = w.change;
        accumulated += w.change;
      }
      
      return {
        name: w.name,
        base,
        value,
        displayVal: isFinal ? w.total : w.change,
        isFinal
      };
    });
  }, [data.waterfall]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Follower Growth Attribution (Waterfall Chart - Col span 2) */}
      <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Đóng góp Lượt Theo Dõi mới</h3>
          <p className="text-[11px] text-white/40">Biểu đồ thác nước (Waterfall) đóng góp Follows mới của từng bài viết dẫn đầu</p>
        </div>

        <div className="h-[280px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 10, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px' }}
                formatter={(value: any, name: any, props: any) => {
                  const item = props.payload;
                  if (item.isFinal) return [`+${item.value} Follows`, 'Tổng cộng kênh'];
                  return [`+${item.displayVal} Follows`, 'Lượt đóng góp'];
                }}

              />
              {/* Stacked transparent base bar to float the waterfall */}
              <Bar dataKey="base" stackId="a" fill="transparent" />
              
              {/* Actual value bar with coloring based on index and final state */}
              <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]}>
                {waterfallData.map((entry, index) => {
                  const color = entry.isFinal ? '#8b5cf6' : COLORS[index % COLORS.length];
                  return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2 text-center">
          Tổng số lượng follower mang lại từ bài viết trong kỳ: <span className="font-bold text-white">+{data.waterfall[data.waterfall.length - 1]?.total} Follows</span>
        </div>
      </div>

      {/* 2. Audience Retention Conversion Funnel */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Phễu Chuyển Đổi Khán Giả</h3>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[11px] text-white/40">Tỉ lệ rớt của hành động: Reach → Follower mới</p>
        </div>

        {/* Funnel list layout */}
        <div className="space-y-3.5 my-4 flex-1 flex flex-col justify-center">
          {data.funnel.map((f, idx) => {
            const widthVal = `${f.percentage}%`;
            return (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between text-[10px] font-semibold text-white/60 mb-1 px-1 relative z-10">
                  <span className="truncate max-w-[120px]">{f.stage}</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-white">{numberFormatter(f.value)}</span>
                    <span className="text-purple-400">({f.percentage}%)</span>
                  </div>
                </div>

                {/* Custom bar design simulating the tapered funnel shape */}
                <div className="w-full h-4 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: widthVal }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full shadow-lg",
                      idx === 0 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500" 
                        : idx === 5 
                          ? "bg-gradient-to-r from-emerald-600 to-teal-500" 
                          : "bg-gradient-to-r from-purple-600 to-pink-500"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[9px] text-white/30 border border-white/5 bg-white/[0.02] rounded-xl p-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span>Tỷ lệ New Followers / Reach thể hiện sức hút giữ chân khán giả trung thực của kênh.</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LOADING SKELETON PLACEHOLDER
// ==========================================
function PostChartsSkeleton() {
  return (
    <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl animate-pulse space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-white/10 rounded-lg" />
          <div className="h-3.5 w-64 bg-white/5 rounded-md" />
        </div>
        <div className="h-8 w-80 bg-white/5 rounded-xl border border-white/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-2xl h-full" />
        <div className="bg-white/5 border border-white/5 rounded-2xl h-full flex flex-col gap-4 p-4">
          <div className="h-10 bg-white/10 rounded-xl" />
          <div className="h-10 bg-white/10 rounded-xl" />
          <div className="h-10 bg-white/10 rounded-xl" />
          <div className="h-10 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
