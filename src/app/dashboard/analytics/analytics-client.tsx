'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  Users, BarChart3, Eye, MousePointer2, TrendingUp, TrendingDown, Calendar, Sparkles, RefreshCw, 
  ChevronDown, CloudDownload, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/icon';
import { 
  getAnalyticsAction, syncAnalyticsAction, getTopPostsAction, getEngagementBreakdownAction,
  getPostFrequencyAction, syncAllAccountsAction, getTopContentAction, getFollowerDetailedAnalyticsAction
} from '@/application/actions/analytics.actions';
import { AnalyticsPeriodData, AnalyticsRange } from '@/domain/types/analytics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calcSummary, fillDateGaps, getXAxisFormatter } from '@/lib/analytics-utils';
import { ViewsCard } from '@/components/analytics/views-card';
import { InteractionsCard } from '@/components/analytics/interactions-card';
import { TopContentGrid, type TopContentPost } from '@/components/analytics/top-content-grid';
import { ActiveTimesChart } from '@/components/analytics/active-times-chart';
import { ProfileCard } from '@/components/analytics/profile-card';
import { FollowerDetailedSection } from '@/components/analytics/follower-detailed-section';
import AIAnalyticsPage from '../ai-analytics/page';
import './analytics.css';

type Props = {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
};

function getStaleTime(range: AnalyticsRange): number {
  switch (range) {
    case '7d': return 5 * 60 * 1000;    // 5 mins
    case '30d': return 15 * 60 * 1000;  // 15 mins
    case '90d': return 30 * 60 * 1000;  // 30 mins
    case 'custom': return 30 * 60 * 1000; // 30 mins
    default: return 5 * 60 * 1000;
  }
}

function useAnalytics(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date, initialData?: AnalyticsPeriodData) {
  return useQuery({
    queryKey: ['analytics', accountId, range, customStart, customEnd],
    queryFn: () => getAnalyticsAction(accountId, range, customStart, customEnd),
    initialData: initialData ? { data: initialData, error: null } : undefined,
    staleTime: getStaleTime(range),
  });
}



function useEngagementBreakdown(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date) {
  return useQuery({
    queryKey: ['engagement-breakdown', accountId, range, customStart, customEnd],
    queryFn: () => getEngagementBreakdownAction(accountId, range, customStart, customEnd),
    staleTime: getStaleTime(range),
  });
}

function usePostFrequency(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date) {
  return useQuery({
    queryKey: ['post-frequency', accountId, range, customStart, customEnd],
    queryFn: () => getPostFrequencyAction(accountId, range, customStart, customEnd),
    staleTime: getStaleTime(range),
  });
}

function useTopContent(accountId: string, sortBy: 'interactions' | 'reach' | 'likes' | 'profile_visits' | 'follows') {
  return useQuery({
    queryKey: ['top-content', accountId, sortBy],
    queryFn: () => getTopPostsAction(accountId, '30d', undefined, undefined, sortBy),
    staleTime: 5 * 60 * 1000,
  });
}

function useFollowerDetails(accountId: string, range: AnalyticsRange, customStart?: Date, customEnd?: Date) {
  return useQuery({
    queryKey: ['follower-details', accountId, range, customStart, customEnd],
    queryFn: () => getFollowerDetailedAnalyticsAction(accountId, range, customStart, customEnd),
    staleTime: getStaleTime(range),
    enabled: !!accountId,
  });
}

type ActiveMetric = 'reach' | 'impressions' | 'engagement' | 'followers';

function SkeletonStatsCard() {
  return (
    <div className="stats-card animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent shimmer" />
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-lg"></div>
        <div className="w-12 h-6 bg-white/5 rounded-full"></div>
      </div>
      <div className="w-24 h-4 bg-white/5 rounded mt-2 mb-3"></div>
      <div className="w-32 h-8 bg-white/5 rounded"></div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="w-full h-[350px] bg-white/[0.02] rounded-xl border border-white/5 animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent shimmer" />
      <div className="absolute bottom-10 left-10 right-10 top-10 flex flex-col justify-between">
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
      </div>
    </div>
  );
}



function InsufficientDataState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed text-center min-h-[400px] mt-6"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative p-6 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
          <Icon lucide={Users} size={40} className="text-blue-400" />
        </div>
        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1.5 shadow-lg animate-bounce">
          <Icon lucide={Sparkles} size={12} className="text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Tài khoản đang được tối ưu</h3>
      <p className="text-white/50 max-w-md leading-relaxed mb-8 text-sm">
        Meta Graph API yêu cầu tài khoản có ít nhất <span className="text-blue-400 font-bold">100 followers</span> để cung cấp các số liệu nhân khẩu học và thói quen hoạt động của người theo dõi.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
        {[
          { label: 'Followers', val: '< 100', icon: Users, color: 'text-blue-400' },
          { label: 'Nhân khẩu học', val: 'Khóa', icon: BarChart3, color: 'text-white/20' },
          { label: 'Hoạt động', val: 'Khóa', icon: Calendar, color: 'text-white/20' }
        ].map((item, i) => (
          <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
            <Icon lucide={item.icon} size={16} className={`${item.color} mb-2`} />
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{item.label}</div>
            <div className="text-sm font-bold text-white">{item.val}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ReauthNotice() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Icon lucide={TrendingDown} size={20} className="text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Token kết nối đã hết hạn hoặc bị thu hồi</h4>
          <p className="text-xs text-white/50">Vui lòng kết nối lại tài khoản Instagram của bạn để tiếp tục đồng bộ dữ liệu live theo thời gian thực.</p>
        </div>
      </div>
      <Link 
        href="/dashboard/settings/accounts"
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 no-underline"
      >
        <Icon lucide={RefreshCw} size={14} />
        Kết nối lại ngay
      </Link>
    </motion.div>
  );
}

function EngagementBreakdownChart({ accountId, range, customStart, customEnd }: {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
}) {
  const { data: result, isPending, isError } = useEngagementBreakdown(accountId, range, customStart, customEnd);

  if (isPending) {
    return (
      <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 animate-pulse">
        <div className="w-48 h-6 bg-white/5 rounded mb-8"></div>
        <div className="flex items-center gap-8">
          <div className="w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="w-full h-4 bg-white/5 rounded"></div>
            <div className="w-2/3 h-4 bg-white/5 rounded"></div>
            <div className="w-3/4 h-4 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !result?.data) return null;

  const { likes, comments, shares, saves } = result.data;
  const total = likes + comments + shares + saves;

  const data = [
    { name: 'Like', value: likes, color: '#3b82f6' },
    { name: 'Comment', value: comments, color: '#10b981' },
    { name: 'Share', value: shares, color: '#a855f7' },
    { name: 'Save', value: saves, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  if (total === 0) {
    return (
      <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 h-full flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-white/5 rounded-full mb-4">
          <Icon lucide={MousePointer2} size={24} className="text-white/20" />
        </div>
        <h3 className="text-white font-bold mb-1">Chưa có dữ liệu tương tác</h3>
        <p className="text-white/40 text-xs">Hãy thử đổi khoảng thời gian khác</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 h-full">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Icon lucide={BarChart3} size={18} className="text-emerald-400" />
        Engagement Breakdown
      </h3>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="w-full md:w-1/2 h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-white">{item.name}</span>
                        </div>
                        <div className="text-sm font-medium text-white/90">
                          {item.value.toLocaleString()} <span className="text-white/40 ml-1">({percent}%)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Total</span>
            <span className="text-xl font-bold text-white">{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{item.value.toLocaleString()}</div>
                <div className="text-[10px] text-white/30 font-medium">({((item.value / total) * 100).toFixed(1)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostFrequencyChart({ accountId, range, customStart, customEnd }: {
  accountId: string;
  range: AnalyticsRange;
  customStart?: Date;
  customEnd?: Date;
}) {
  const { data: result, isPending, isError } = usePostFrequency(accountId, range, customStart, customEnd);

  if (isPending) {
    return (
      <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 animate-pulse">
        <div className="w-48 h-6 bg-white/5 rounded mb-8"></div>
        <div className="w-full h-[220px] bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  if (isError || !result?.data) return null;

  const rawData = result.data;
  const totalPosts = rawData.reduce((sum, d) => sum + d.count, 0);

  if (totalPosts === 0) {
    return (
      <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 h-full flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-white/5 rounded-full mb-4">
          <Icon lucide={Calendar} size={24} className="text-white/20" />
        </div>
        <h3 className="text-white font-bold mb-1">Chưa có bài đăng nào</h3>
        <p className="text-white/40 text-xs">Hãy thử đổi khoảng thời gian khác</p>
      </div>
    );
  }

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const chartData = rawData.map(d => ({
    name: dayLabels[d.dayOfWeek],
    count: d.count,
    dayIndex: d.dayOfWeek
  })).sort((a, b) => {
    // Sort to T2 -> T7 -> CN (1 -> 6 -> 0)
    const orderA = a.dayIndex === 0 ? 7 : a.dayIndex;
    const orderB = b.dayIndex === 0 ? 7 : b.dayIndex;
    return orderA - orderB;
  });

  const maxCount = Math.max(...chartData.map(d => d.count));
  const optimalDays = chartData.filter(d => d.count === maxCount).map(d => d.name);

  return (
    <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon lucide={Calendar} size={18} className="text-blue-400" />
          Tần suất đăng bài
        </h3>
        <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-2 py-1 rounded">
          {totalPosts} Posts
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                      <div className="text-xs font-bold text-white mb-1">{payload[0].payload.name}</div>
                      <div className="text-sm font-medium text-blue-400">
                        {payload[0].value} bài đăng
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.count === maxCount ? '#f59e0b' : '#3b82f6'} 
                  fillOpacity={entry.count === maxCount ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
        <Icon lucide={Sparkles} size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/70 leading-relaxed">
          <span className="text-white font-bold">Thứ {optimalDays.join(', ')}</span> có tần suất đăng bài cao nhất. Hãy duy trì lịch đăng đều đặn vào những ngày này để tối đa hoá tiếp cận.
        </p>
      </div>
    </div>
  );
}



interface TooltipPayload {
  payload: Record<string, string | number>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  activeMetric: ActiveMetric;
}

function CustomTooltip({ active, payload, label, activeMetric }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Record<string, string | number>;
    
    const getMetricLabel = (m: string) => {
      switch(m) {
        case 'reach': return 'Reach';
        case 'impressions': return 'Impressions';
        case 'engagement': return 'Engagement';
        case 'followers': return 'Followers';
        default: return m;
      }
    };

    const getMetricColor = (m: string) => {
      switch(m) {
        case 'reach': return 'bg-blue-500';
        case 'impressions': return 'bg-purple-500';
        case 'engagement': return 'bg-emerald-500';
        case 'followers': return 'bg-orange-500';
        default: return 'bg-white';
      }
    };

    const prevKey = `prev${activeMetric.charAt(0).toUpperCase()}${activeMetric.slice(1)}`;
    const val = Number(data[activeMetric]) || 0;
    const prevValue = Number(data[prevKey]) || 0;
    
    const trend = prevValue > 0 ? ((val - prevValue) / prevValue) * 100 : 0;
    const isPositive = trend > 0;
    const absDiff = val - prevValue;

    return (
      <div className="custom-tooltip">
        <div className="tooltip-date">
          <Icon lucide={Calendar} size={10} />
          {label}
        </div>
        <div className="tooltip-items">
          <div className="tooltip-item">
            <div className="tooltip-item-label">
              <div className={`tooltip-item-dot ${getMetricColor(activeMetric)}`} />
              <span>{getMetricLabel(activeMetric)}</span>
            </div>
            <div className="tooltip-values">
              <div className="flex items-center gap-2">
                <span className="tooltip-value-current">{val.toLocaleString()}</span>
                {absDiff !== 0 && (
                  <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    <Icon lucide={isPositive ? TrendingUp : TrendingDown} size={10} />
                    <span>{isPositive ? '+' : ''}{absDiff.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {prevValue > 0 && (
                <div className="flex flex-col mt-1">
                  <span className="tooltip-value-previous">Kỳ trước: {prevValue.toLocaleString()}</span>
                  <span className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-red-400'} font-medium`}>
                    ({isPositive ? '+' : ''}{trend.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function AccountSelector({ 
  accounts, 
  selectedId, 
  onSelect 
}: { 
  accounts: Props['accounts'], 
  selectedId: string, 
  onSelect: (id: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = accounts.find(a => a.id === selectedId) || accounts[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Icon name="facebook" size={14} className="text-blue-400" />;
      case 'instagram': return <Icon name="instagram" size={14} className="text-pink-400" />;
      default: return <Icon lucide={Users} size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 min-w-[200px] justify-between group"
      >
        <div className="flex items-center gap-2">
          {selected && getIcon(selected.platform)}
          <span className="text-sm font-medium text-white/90 group-hover:text-white">
            {selected?.name || 'Chọn tài khoản'}
          </span>
        </div>
        <Icon lucide={ChevronDown} size={16} className={`text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-full min-w-[240px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelect(acc.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    acc.id === selectedId 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'hover:bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border transition-colors ${
                    acc.id === selectedId ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 group-hover:border-white/20'
                  }`}>
                    {getIcon(acc.platform)}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-semibold truncate w-full">{acc.name}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-widest">{acc.platform}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export function AnalyticsDashboardClient({ initialData, accounts }: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'content'>('general');
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('reach');
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const cStart = range === 'custom' && customStart ? new Date(customStart) : undefined;
  const cEnd = range === 'custom' && customEnd ? new Date(customEnd) : undefined;

  // Only use initialData if we are on the first account and default range
  // otherwise it will pollute the state of other accounts
  const isInitialState = selectedAccountId === accounts[0]?.id && range === '30d';

  const { data, isPending, isError, isFetching } = useAnalytics(
    selectedAccountId, 
    range, 
    cStart, 
    cEnd, 
    isInitialState ? initialData : undefined
  );

  async function handleSync() {
    if (!selectedAccountId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncAnalyticsAction(selectedAccountId);
      if (result.success) {
        // Refetch all queries for this account
        queryClient.invalidateQueries({ queryKey: ['analytics', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-posts', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency', selectedAccountId] });
        queryClient.invalidateQueries({ queryKey: ['top-content', selectedAccountId] });
      } else {
        console.error('Sync failed:', result.error);
        alert(`Sync failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncAll() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllAccountsAction();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['top-posts'] });
        queryClient.invalidateQueries({ queryKey: ['engagement-breakdown'] });
        queryClient.invalidateQueries({ queryKey: ['post-frequency'] });
        queryClient.invalidateQueries({ queryKey: ['top-content'] });
        alert(`Đã đồng bộ thành công ${result.successful}/${result.processed} tài khoản.`);
      } else {
        console.error('Sync All failed:', result.error);
        alert(`Sync All failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync All error:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  const totals = data?.data ? calcSummary(data.data) : null;
  const xAxisFormatter = getXAxisFormatter(range);
  
  const currentSnapshots = data?.data ? fillDateGaps(data.data.current, data.data.currentStart, data.data.currentEnd) : [];
  const previousSnapshots = data?.data ? fillDateGaps(data.data.previous, data.data.previousStart, data.data.previousEnd) : [];

  const chartData = currentSnapshots.map((s, i) => {
    const prev = previousSnapshots[i];
    return {
      date: xAxisFormatter(s.date),
      reach: s.reach,
      engagement: s.engagement,
      impressions: s.impressions,
      followers: s.followers,
      prevReach: prev?.reach ?? 0,
      prevEngagement: prev?.engagement ?? 0,
      prevImpressions: prev?.impressions ?? 0,
      prevFollowers: prev?.followers ?? 0,
    };
  });

  const getMetricConfig = (metric: ActiveMetric) => {
    switch (metric) {
      case 'reach': return { color: '#3b82f6', gradientId: 'colorReach', label: 'Reach' };
      case 'impressions': return { color: '#a855f7', gradientId: 'colorImpressions', label: 'Impressions' };
      case 'engagement': return { color: '#10b981', gradientId: 'colorEng', label: 'Engagement' };
      case 'followers': return { color: '#f97316', gradientId: 'colorFollowers', label: 'Followers' };
    }
  };

  const activeConfig = getMetricConfig(activeMetric);
  
  // Find the latest snapshot with active times (since it's a lifetime metric, latest is best)
  const latestWithActiveTimes = [...(data?.data?.current || [])].reverse().find(s => s.activeTimes);
  
  // 1. Get Followers vs Non-followers reach percentage over the selected period
  let followersPct = data?.data?.followersPct ?? 0;
  let nonfollowersPct = data?.data?.nonfollowersPct ?? 0;

  if (followersPct === 0 && nonfollowersPct === 0) {
    const currentSnapshotsWithFollowers = (data?.data?.current || []).filter(
      (s: any) => s.followersPct !== null && s.followersPct !== undefined &&
           s.nonfollowersPct !== null && s.nonfollowersPct !== undefined
    );

    if (currentSnapshotsWithFollowers.length > 0) {
      let totalReachWeight = 0;
      let sumFollowersPct = 0;
      let sumNonfollowersPct = 0;

      currentSnapshotsWithFollowers.forEach((s: any) => {
        // Use reach as the weight for reach breakdown percentage
        const dailyReach = s.reach || s.accountsReached || 0;
        const weight = dailyReach > 0 ? dailyReach : 1;

        totalReachWeight += weight;
        sumFollowersPct += (s.followersPct || 0) * weight;
        sumNonfollowersPct += (s.nonfollowersPct || 0) * weight;
      });

      if (totalReachWeight > 0) {
        followersPct = Math.round(sumFollowersPct / totalReachWeight);
        nonfollowersPct = Math.round(sumNonfollowersPct / totalReachWeight);

        // Normalize to sum to exactly 100
        const pctSum = followersPct + nonfollowersPct;
        if (pctSum > 0) {
          followersPct = Math.round((followersPct / pctSum) * 100);
          nonfollowersPct = 100 - followersPct;
        }
      }
    } else {
      // Fallback if no snapshots have these fields, find the latest snapshot with advanced data
      const latestWithAdvanced = [...(data?.data?.current || [])].reverse().find((s: any) => s.followersPct !== null && s.followersPct !== undefined);
      followersPct = latestWithAdvanced?.followersPct || 0;
      nonfollowersPct = latestWithAdvanced?.nonfollowersPct || 0;
    }
  }

  // 2. Aggregate Views Breakdown by Content Type over the selected period
  const currentSnapshotsWithViewsBreakdown = (data?.data?.current || []).filter(
    (s: any) => s.byContentViews && (
      (s.byContentViews.all && (s.byContentViews.all.posts > 0 || s.byContentViews.all.reels > 0 || s.byContentViews.all.stories > 0)) ||
      (s.byContentViews.followers && (s.byContentViews.followers.posts > 0 || s.byContentViews.followers.reels > 0 || s.byContentViews.followers.stories > 0))
    )
  );

  let aggregatedByContentViews: any = null;

  if (currentSnapshotsWithViewsBreakdown.length > 0) {
    let totalViewsWeight = 0;
    const temp = {
      all: { posts: 0, reels: 0, stories: 0 },
      followers: { posts: 0, reels: 0, stories: 0 },
      nonfollowers: { posts: 0, reels: 0, stories: 0 }
    };

    currentSnapshotsWithViewsBreakdown.forEach((s: any) => {
      // Use impressions as weight for views breakdown percentage
      const dailyViews = s.impressions || s.reach || 0;
      const weight = dailyViews > 0 ? dailyViews : 1;

      totalViewsWeight += weight;
      const v = s.byContentViews!;

      temp.all.posts += (v.all?.posts || 0) * weight;
      temp.all.reels += (v.all?.reels || 0) * weight;
      temp.all.stories += (v.all?.stories || 0) * weight;

      temp.followers.posts += (v.followers?.posts || 0) * weight;
      temp.followers.reels += (v.followers?.reels || 0) * weight;
      temp.followers.stories += (v.followers?.stories || 0) * weight;

      temp.nonfollowers.posts += (v.nonfollowers?.posts || 0) * weight;
      temp.nonfollowers.reels += (v.nonfollowers?.reels || 0) * weight;
      temp.nonfollowers.stories += (v.nonfollowers?.stories || 0) * weight;
    });

    if (totalViewsWeight > 0) {
      const getNormBreakdown = (breakdown: { posts: number; reels: number; stories: number }) => {
        const p = breakdown.posts;
        const r = breakdown.reels;
        const s = breakdown.stories;
        const total = p + r + s;
        if (total > 0) {
          let posts = Number((p / total * 100).toFixed(1));
          let reels = Number((r / total * 100).toFixed(1));
          let stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
          return { posts, reels, stories };
        }
        return { posts: 0, reels: 0, stories: 0 };
      };

      aggregatedByContentViews = {
        all: getNormBreakdown(temp.all),
        followers: getNormBreakdown(temp.followers),
        nonfollowers: getNormBreakdown(temp.nonfollowers)
      };
    }
  }

  const fallbackViewsBreakdown = data?.data?.currentPostTotals?.byContentViews;

  const viewsData = {
    totalViews: totals?.impressions?.value || 0,
    followersPct,
    nonfollowersPct,
    accountsReached: totals?.reach?.value || 0,
    byContentViews: aggregatedByContentViews 
      ? aggregatedByContentViews 
      : (fallbackViewsBreakdown ? {
          all: fallbackViewsBreakdown,
          followers: fallbackViewsBreakdown,
          nonfollowers: fallbackViewsBreakdown
        } : null),
  };

  // 3. Aggregate Interactions Breakdown by Content Type over the selected period
  const currentSnapshotsWithInteractions = (data?.data?.current || []).filter(
    (s: any) => s.byContentInteractions && (
      s.byContentInteractions.posts > 0 || 
      s.byContentInteractions.reels > 0 || 
      s.byContentInteractions.stories > 0
    )
  );

  let aggregatedByContentInteractions: any = null;

  if (currentSnapshotsWithInteractions.length > 0) {
    let totalEngWeight = 0;
    const temp = { posts: 0, reels: 0, stories: 0 };

    currentSnapshotsWithInteractions.forEach((s: any) => {
      // Use engagement as weight for interactions breakdown percentage
      const dailyEngagement = s.engagement || 0;
      const weight = dailyEngagement > 0 ? dailyEngagement : 1;

      totalEngWeight += weight;
      const v = s.byContentInteractions!;

      temp.posts += (v.posts || 0) * weight;
      temp.reels += (v.reels || 0) * weight;
      temp.stories += (v.stories || 0) * weight;
    });

    if (totalEngWeight > 0) {
      const p = temp.posts;
      const r = temp.reels;
      const s = temp.stories;
      const total = p + r + s;
      if (total > 0) {
        let posts = Number((p / total * 100).toFixed(1));
        let reels = Number((r / total * 100).toFixed(1));
        let stories = Number(Math.max(0, 100 - posts - reels).toFixed(1));
        aggregatedByContentInteractions = { posts, reels, stories };
      }
    }
  }

  const totalAccEngaged = (data?.data?.current || []).reduce((acc: number, curr: any) => acc + (curr.accountsEngaged || 0), 0);

  const interactionsData = {
    totalInteractions: data?.data?.uniqueInteractions ?? (totals?.engagement?.value || 0),
    accountsEngaged: data?.data?.uniqueAccountsEngaged ?? (totalAccEngaged > 0 ? totalAccEngaged : (totals?.engagement?.value || 0)),
    byContentInteractions: aggregatedByContentInteractions
      ? aggregatedByContentInteractions
      : (data?.data?.currentPostTotals?.byContentInteractions || null),
  };


  return (
    <div className="analytics-container">
      {/* TABS SELECTOR */}
      <div className="flex border-b border-white/5 mb-4 select-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-white bg-white/[0.02]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={BarChart3} size={14} />
          <span>Tổng quan Kênh</span>
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'content'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.01]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={Layers} size={14} className={activeTab === 'content' ? "text-indigo-500" : "text-white/30"} />
          <span>Bài viết</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-pink-500 text-pink-400 bg-pink-500/[0.01]'
              : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
          }`}
        >
          <Icon lucide={Sparkles} size={14} className={activeTab === 'ai' ? "text-pink-500 animate-pulse" : "text-white/30"} />
          <span>Phân tích AI Agent</span>
        </button>
      </div>

      {activeTab === 'ai' ? (
        <div className="-mx-6 -my-4">
          <AIAnalyticsPage onBack={() => setActiveTab('general')} />
        </div>
      ) : activeTab === 'content' ? (
        <ContentInsightsSection accountId={selectedAccountId} />
      ) : (
        <>
          <div className="analytics-header">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-white/50 text-sm">Track your performance across platforms</p>
            </div>
            
            <div className="filter-controls items-center">
              <div className="range-selector">
                {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`range-btn ${range === r ? 'active' : ''}`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
                <button 
                  onClick={() => setRange('custom')}
                  className={`range-btn ${range === 'custom' ? 'active' : ''}`}
                >
                  Custom
                </button>
              </div>

              {range === 'custom' && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-right-2 duration-300">
                  <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                  <span className="text-white/20 text-xs">→</span>
                  <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                </div>
              )}
              
              <div className="h-8 w-[1px] bg-white/10 mx-1" />
              
              <AccountSelector 
                accounts={accounts} 
                selectedId={selectedAccountId} 
                onSelect={setSelectedAccountId} 
              />

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  isSyncing 
                    ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50' 
                    : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400'
                }`}
                title="Đồng bộ dữ liệu tài khoản này"
              >
                <Icon lucide={RefreshCw} size={16} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                  isSyncing 
                    ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50 text-white/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                }`}
                title="Đồng bộ tất cả tài khoản"
              >
                <Icon lucide={CloudDownload} size={14} className={isSyncing ? 'animate-pulse text-blue-400' : ''} />
                <span className="hidden sm:inline">Sync All</span>
              </button>
            </div>
          </div>

          <div className={`stats-grid transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
            {isPending ? (
              <>
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
              </>
            ) : isError || !totals ? (
              <div className="col-span-4 p-4 text-center text-white/50 bg-white/5 rounded-xl border border-red-500/20">
                Failed to load analytics data.
              </div>
            ) : (
              <>
                <StatsCard 
                  label="Total Reach" 
                  value={totals.reach.value.toLocaleString()} 
                  icon={<Icon lucide={Users} className="text-blue-400" size={20} />} 
                  trend={totals.reach.trend.display} 
                  isPositive={totals.reach.trend.isPositive}
                  sparklineData={chartData.map(d => d.reach || 0)}
                  isActive={activeMetric === 'reach'}
                  onClick={() => setActiveMetric('reach')}
                  activeColor="#3b82f6"
                />
                <StatsCard 
                  label="Impressions" 
                  value={totals.impressions.value.toLocaleString()} 
                  icon={<Icon lucide={Eye} className="text-purple-400" size={20} />} 
                  trend={totals.impressions.trend.display} 
                  isPositive={totals.impressions.trend.isPositive}
                  sparklineData={chartData.map(d => d.impressions || 0)}
                  isActive={activeMetric === 'impressions'}
                  onClick={() => setActiveMetric('impressions')}
                  activeColor="#a855f7"
                />
                <StatsCard 
                  label="Engagement" 
                  value={totals.engagement.value.toLocaleString()} 
                  icon={<Icon lucide={MousePointer2} className="text-emerald-400" size={20} />} 
                  trend={totals.engagement.trend.display} 
                  isPositive={totals.engagement.trend.isPositive}
                  sparklineData={chartData.map(d => d.engagement || 0)}
                  isActive={activeMetric === 'engagement'}
                  onClick={() => setActiveMetric('engagement')}
                  activeColor="#10b981"
                />
                <StatsCard 
                  label="Followers" 
                  value={totals.followers.value.toLocaleString()} 
                  icon={<Icon lucide={TrendingUp} className="text-orange-400" size={20} />} 
                  trend={totals.followers.trend.display} 
                  isPositive={totals.followers.trend.isPositive}
                  delta={totals.followers.delta}
                  sparklineData={chartData.map(d => d.followers || 0)}
                  isActive={activeMetric === 'followers'}
                  onClick={() => setActiveMetric('followers')}
                  activeColor="#f97316"
                />
              </>
            )}
          </div>

          {/* Reauth Notice */}
          {(accounts.find(a => a.id === selectedAccountId && (a as any).needs_reauth) || data?.data?.needsReauth) && (
            <ReauthNotice />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
            <ViewsCard 
              {...viewsData}
              isLoading={isPending}
            />
            <InteractionsCard
              {...interactionsData}
              isLoading={isPending}
            />
          </div>

          <div className="mb-6">
            <TopContentGridWrapper 
              accountId={selectedAccountId} 
              onSeeAll={() => setActiveTab('content')}
            />
          </div>

          {activeMetric === 'followers' && accounts.find(a => a.id === selectedAccountId)?.platform === 'instagram' ? (
            <FollowerDetailedSection
              accountId={selectedAccountId}
              range={range}
              customStart={cStart}
              customEnd={cEnd}
            />
          ) : (
            <>
              <div className={`chart-container transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
                <h2 className="chart-title">{activeConfig?.label} Trend</h2>
                {isPending ? (
                  <SkeletonChart />
                ) : isError || !totals ? (
                  <div className="w-full h-[350px] flex items-center justify-center bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-white/40">No data available</span>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '350px' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeMetric}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <ResponsiveContainer>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#a855f7" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                <stop offset="50%" stopColor="#f97316" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                              dy={10}
                              interval={range === '30d' ? 4 : range === '90d' ? 6 : 0}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                              domain={activeMetric === 'followers' ? ['dataMin - 100', 'dataMax + 100'] : [0, 'auto']}
                              allowDecimals={false}
                            />
                            <Tooltip 
                              content={<CustomTooltip activeMetric={activeMetric} />}
                              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey={activeMetric} 
                              stroke={activeConfig?.color} 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill={`url(#${activeConfig?.gradientId})`} 
                              connectNulls
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Insufficient Data Guard */}
              {data?.data?.current[data.data.current.length - 1]?.insufficientData ? (
                <InsufficientDataState />
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <EngagementBreakdownChart 
                      accountId={selectedAccountId} 
                      range={range} 
                      customStart={cStart} 
                      customEnd={cEnd} 
                    />
                    <PostFrequencyChart 
                      accountId={selectedAccountId} 
                      range={range} 
                      customStart={cStart} 
                      customEnd={cEnd} 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-1">
                      <ProfileCard 
                        visits={totals?.profileVisits?.value || 0}
                        taps={totals?.profileLinksTaps?.value || 0}
                        isLoading={isPending}
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <ActiveTimesChart 
                        activeTimes={latestWithActiveTimes?.activeTimes || null}
                        totalFollowers={totals?.followers?.value || 0}
                        isLoading={isPending}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}


        </>
      )}
    </div>
  );
}

function StatsCard({ 
  label, 
  value, 
  icon, 
  trend, 
  isPositive, 
  delta,
  isActive,
  onClick,
  activeColor = '#3b82f6',
  sparklineData = []
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  isPositive?: boolean;
  delta?: number;
  isActive?: boolean;
  onClick?: () => void;
  activeColor?: string;
  sparklineData?: number[];
}) {
  return (
    <div 
      onClick={onClick}
      className={`stats-card cursor-pointer transition-all duration-300 select-none group ${
        isActive 
          ? 'stats-card-active border-opacity-50 ring-1 ring-opacity-20 shadow-lg scale-[1.02]' 
          : 'hover:bg-white/[0.04] active:scale-95'
      }`}
      style={isActive ? { 
        borderColor: `${activeColor}40`, 
        boxShadow: `0 0 20px ${activeColor}10`,
        '--active-glow': `${activeColor}20` 
      } as React.CSSProperties : {}}
    >
      {isActive && (
        <div 
          className="absolute inset-0 bg-gradient-to-br opacity-[0.03] pointer-events-none" 
          style={{ background: `linear-gradient(135deg, ${activeColor}, transparent)` }}
        />
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
          {icon}
        </div>
        <div className="w-16 h-8 opacity-20 group-hover:opacity-60 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Area 
                type="monotone" 
                dataKey="v" 
                stroke={activeColor} 
                strokeWidth={1.5} 
                fill={activeColor}
                fillOpacity={0.1}
                dot={false} 
                isAnimationActive={false} 
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="stats-label">{label}</div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="flex flex-col">
          <div className="stats-value">
            {value}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
              isPositive ? 'text-emerald-400 bg-emerald-400/10' : 
              trend === '—' ? 'text-white/40 bg-white/5' : 'text-red-400 bg-red-400/10'
            }`}>
              {trend !== '—' && (isPositive ? '▲' : '▼')} {trend.replace('+', '').replace('-', '')}
            </span>
            {delta !== undefined && delta !== 0 && (
              <span className={`text-[10px] font-bold opacity-40`}>
                {delta > 0 ? '+' : ''}{delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopContentGridWrapper({ 
  accountId,
  onSeeAll
}: { 
  accountId: string;
  onSeeAll?: () => void;
}) {
  const [activeMetric, setActiveMetric] = React.useState<'interactions' | 'reach' | 'likes' | 'profile_visits' | 'follows'>('interactions');
  const { data: result, isPending } = useTopContent(accountId, activeMetric);
  
  return (
    <TopContentGrid
      posts={(result?.data || []) as TopContentPost[]}
      activeMetric={activeMetric}
      setActiveMetric={setActiveMetric}
      isLoading={isPending}
      onSeeAll={onSeeAll}
    />
  );
}

// Media type filter definitions with inline beautiful SVGs
const MEDIA_FILTERS = [
  { 
    id: 'all', 
    label: 'All', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="21" y1="12" x2="3" y2="12"/>
        <line x1="12" y1="21" x2="12" y2="3"/>
      </svg>
    )
  },
  { 
    id: 'image', 
    label: 'Images', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    )
  },
  { 
    id: 'reels', 
    label: 'Reels', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
      </svg>
    )
  },
  { 
    id: 'carousel', 
    label: 'Carousels', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    )
  },
];

const METRIC_FILTERS = [
  { id: 'views', label: 'Views' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'reach', label: 'Reach' },
  { id: 'likes', label: 'Likes' },
  { id: 'profile_visits', label: 'Profile Visits' },
  { id: 'follows', label: 'Follows' },
];

const ORDER_FILTERS = [
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
];

const formatMetricValue = (val: number): string => {
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return val.toString();
};

function ContentInsightsSection({
  accountId
}: {
  accountId: string;
}) {
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'reels' | 'carousel'>('all');
  const [metricFilter, setMetricFilter] = useState<'views' | 'interactions' | 'reach' | 'likes' | 'profile_visits' | 'follows'>('views');
  const [orderFilter, setOrderFilter] = useState<'highest' | 'lowest'>('highest');
  const [activeDropdown, setActiveDropdown] = useState<'media' | 'metric' | 'order' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: result, isPending, isError } = useQuery({
    queryKey: ['content-insights-posts', accountId, metricFilter],
    queryFn: () => getTopPostsAction(accountId, '90d', undefined, undefined, metricFilter, 100),
    staleTime: 5 * 60 * 1000,
  });

  const posts = result?.data || [];

  const processedPosts = React.useMemo(() => {
    let filtered = [...posts];

    if (mediaFilter !== 'all') {
      filtered = filtered.filter(p => {
        const type = p.mediaType?.toUpperCase();
        if (mediaFilter === 'image') return type === 'IMAGE';
        if (mediaFilter === 'reels') return type === 'REELS';
        if (mediaFilter === 'carousel') return type === 'CAROUSEL_ALBUM';
        return true;
      });
    }

    if (orderFilter === 'lowest') {
      filtered.reverse();
    }

    return filtered;
  }, [posts, mediaFilter, orderFilter]);

  const getMetricValue = (post: any) => {
    const likes = post.likeCount || 0;
    const comments = post.commentsCount || 0;
    const shares = post.sharesCount || 0;
    const saves = post.savedCount || 0;
    const baseInteractions = likes + comments + shares + saves;

    switch (metricFilter) {
      case 'views': return post.views || post.reach || 0;
      case 'interactions': return post.totalInteractions > 0 ? post.totalInteractions : baseInteractions;
      case 'reach': return post.reach || 0;
      case 'likes': return likes;
      case 'profile_visits': return post.profileVisits || 0;
      case 'follows': return post.follows || 0;
      default: return 0;
    }
  };

  const selectedMedia = MEDIA_FILTERS.find(m => m.id === mediaFilter);
  const selectedMetric = METRIC_FILTERS.find(m => m.id === metricFilter);
  const selectedOrder = ORDER_FILTERS.find(o => o.id === orderFilter);

  return (
    <div className="bg-[#0b0c0e] min-h-[600px] text-white p-6 font-sans rounded-3xl border border-white/5 shadow-2xl relative transition-all duration-300">
      <div className="flex flex-col gap-6" ref={dropdownRef}>
        {/* Title Row */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Content insights</h2>
          <p className="text-white/40 text-xs mt-1">Phân tích hiệu suất truyền thông bài viết trọn đời</p>
        </div>

        {/* Dropdowns Filter Row */}
        <div className="flex items-center gap-3 relative select-none">
          {/* Media filter pill */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'media' ? null : 'media')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
            >
              {selectedMedia?.icon('w-3.5 h-3.5 text-white/80')}
              <span>{selectedMedia?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'media' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'media' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[140px] flex flex-col gap-0.5 backdrop-blur-xl"
                >
                  {MEDIA_FILTERS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMediaFilter(m.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                        mediaFilter === m.id
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {m.icon('w-3.5 h-3.5')}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Metric filter pill */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'metric' ? null : 'metric')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
            >
              <span>{selectedMetric?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'metric' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'metric' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[160px] flex flex-col gap-0.5 backdrop-blur-xl"
                >
                  {METRIC_FILTERS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMetricFilter(m.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                        metricFilter === m.id
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order filter pill */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'order' ? null : 'order')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
            >
              <span>{selectedOrder?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'order' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'order' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[120px] flex flex-col gap-0.5 backdrop-blur-xl"
                >
                  {ORDER_FILTERS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setOrderFilter(o.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                        orderFilter === o.id
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Media Grid */}
        {isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="w-full min-h-[300px] flex items-center justify-center border border-dashed border-white/5 rounded-3xl text-white/30 text-sm">
            Lỗi khi tải dữ liệu bài viết
          </div>
        ) : processedPosts.length === 0 ? (
          <div className="w-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl text-white/30 text-sm py-12">
            <svg className="w-12 h-12 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Không tìm thấy bài viết nào phù hợp
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-4">
            {processedPosts.map((post: any, index: number) => {
              const displayUrl = post.thumbnailUrl || post.mediaUrl;
              const value = getMetricValue(post);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="relative aspect-square rounded-[24px] overflow-hidden border border-white/5 bg-white/5 shadow-lg group cursor-pointer"
                >
                  {displayUrl ? (
                    <Image
                      src={displayUrl}
                      alt="Thumbnail"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-[10px] font-bold text-white/30 tracking-widest uppercase">
                      {post.mediaType}
                    </div>
                  )}

                  {/* Gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Format icon */}
                  {post.mediaType === 'CAROUSEL_ALBUM' ? (
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg flex items-center justify-center text-white">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </div>
                  ) : post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg flex items-center justify-center text-white">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : null}

                  {/* White transparent pill badge (Image 2 style) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-black font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 select-none min-w-[55px] text-center">
                    {formatMetricValue(value)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
