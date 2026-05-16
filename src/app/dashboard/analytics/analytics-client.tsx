'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, BarChart3, Eye, MousePointer2, TrendingUp, Calendar, Sparkles, RefreshCw, 
  ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/icon';
import { getAnalyticsAction, syncAnalyticsAction } from '@/application/actions/analytics.actions';
import { AnalyticsPeriodData, AnalyticsRange } from '@/domain/types/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useQueryClient } from '@tanstack/react-query';
import { calcSummary, fillDateGaps, getXAxisFormatter } from '@/lib/analytics-utils';
import AIAnalyticsPage from '../ai-analytics/page';
import './analytics.css';

type Props = {
  initialData?: AnalyticsPeriodData;
  accounts: Array<{ id: string; name: string; platform: string }>;
};

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

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-date">{label}</div>
        <div className="tooltip-items">
          <div className="tooltip-item">
            <div className="tooltip-item-label">
              <div className="tooltip-item-dot bg-blue-500" />
              <span>Reach</span>
            </div>
            <div className="tooltip-values">
              <span className="tooltip-value-current">{data.reach.toLocaleString()}</span>
              <span className="tooltip-value-previous">Previous: {data.prevReach.toLocaleString()}</span>
            </div>
          </div>
          <div className="tooltip-item">
            <div className="tooltip-item-label">
              <div className="tooltip-item-dot bg-emerald-500" />
              <span>Engagement</span>
            </div>
            <div className="tooltip-values">
              <span className="tooltip-value-current">{data.engagement.toLocaleString()}</span>
              <span className="tooltip-value-previous">Previous: {data.prevEngagement.toLocaleString()}</span>
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
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
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
        // Refetch the data
        queryClient.invalidateQueries({ queryKey: ['analytics', selectedAccountId] });
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

  const totals = data ? calcSummary(data.current, data.previous) : null;
  const xAxisFormatter = getXAxisFormatter(range);
  
  const currentSnapshots = data ? fillDateGaps(data.current, data.currentStart, data.currentEnd) : [];
  const previousSnapshots = data ? fillDateGaps(data.previous, data.previousStart, data.previousEnd) : [];

  const chartData = currentSnapshots.map((s, i) => {
    const prev = previousSnapshots[i];
    return {
      date: xAxisFormatter(s.date),
      reach: s.reach,
      engagement: s.engagement,
      prevReach: prev?.reach ?? 0,
      prevEngagement: prev?.engagement ?? 0,
      followers: s.followers
    };
  });


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
                title="Đồng bộ dữ liệu ngay"
              >
                <Icon lucide={RefreshCw} size={16} className={isSyncing ? 'animate-spin' : ''} />
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
                />
                <StatsCard 
                  label="Impressions" 
                  value={totals.impressions.value.toLocaleString()} 
                  icon={<Icon lucide={Eye} className="text-purple-400" size={20} />} 
                  trend={totals.impressions.trend.display} 
                  isPositive={totals.impressions.trend.isPositive}
                />
                <StatsCard 
                  label="Engagement" 
                  value={totals.engagement.value.toLocaleString()} 
                  icon={<Icon lucide={MousePointer2} className="text-emerald-400" size={20} />} 
                  trend={totals.engagement.trend.display} 
                  isPositive={totals.engagement.trend.isPositive}
                />
                <StatsCard 
                  label="Followers" 
                  value={totals.followers.value.toLocaleString()} 
                  icon={<Icon lucide={TrendingUp} className="text-orange-400" size={20} />} 
                  trend={totals.followers.trend.display} 
                  isPositive={totals.followers.trend.isPositive}
                  delta={totals.followers.delta}
                />
              </>
            )}
          </div>

          <div className={`chart-container transition-opacity duration-300 ${isFetching && !isPending ? 'opacity-50' : ''}`}>
            <h2 className="chart-title">Reach & Engagement Trends</h2>
            {isPending ? (
              <SkeletonChart />
            ) : isError || !totals ? (
              <div className="w-full h-[350px] flex items-center justify-center bg-white/[0.02] rounded-xl border border-white/5">
                <span className="text-white/40">No data available</span>
              </div>
            ) : (
              <div style={{ width: '100%', height: '350px' }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorReach)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEng)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
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
  delta 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  isPositive?: boolean;
  delta?: number;
}) {
  return (
    <div className="stats-card">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isPositive ? 'text-emerald-400 bg-emerald-400/10' : 
          trend === '—' ? 'text-white/40 bg-white/5' : 'text-red-400 bg-red-400/10'
        }`}>
          {trend}
        </span>
      </div>
      <div className="stats-label">{label}</div>
      <div className="stats-value flex items-end gap-2">
        {value}
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs pb-1 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
