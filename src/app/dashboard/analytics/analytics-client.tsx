'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Users, BarChart3, Eye, MousePointer2, TrendingUp, Calendar } from 'lucide-react';
import { getAnalyticsAction } from '@/application/actions/analytics.actions';
import { AnalyticsSnapshot } from '@/domain/types/analytics';
import './analytics.css';

type Props = {
  initialData: AnalyticsSnapshot[];
  accounts: Array<{ id: string; name: string; platform: string }>;
};

export function AnalyticsDashboardClient({ initialData, accounts }: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [data, setData] = useState<AnalyticsSnapshot[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId !== accounts[0]?.id) {
      handleRefresh();
    }
  }, [selectedAccountId]);

  async function handleRefresh() {
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const result = await getAnalyticsAction({
      accountId: selectedAccountId,
      startDate,
      endDate
    });

    if (result.data) {
      setData(result.data);
    }
    setLoading(false);
  }

  const totals = data.reduce((acc, curr) => ({
    reach: acc.reach + curr.reach,
    impressions: acc.impressions + curr.impressions,
    engagement: acc.engagement + curr.engagement,
    followers: curr.followers, // Latest snapshot has current followers
  }), { reach: 0, impressions: 0, engagement: 0, followers: 0 });

  const chartData = data.map(s => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reach: s.reach,
    impressions: s.impressions,
    engagement: s.engagement,
    followers: s.followers
  }));

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/50 text-sm">Track your performance across platforms</p>
        </div>
        
        <div className="filter-controls">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1">
            <Calendar size={16} className="text-white/40" />
            <span className="text-sm text-white/80">Last 30 Days</span>
          </div>
          
          <select 
            className="select-control"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.platform})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard 
          label="Total Reach" 
          value={totals.reach.toLocaleString()} 
          icon={<Users className="text-blue-400" size={20} />} 
          trend="+12.5%" 
        />
        <StatsCard 
          label="Impressions" 
          value={totals.impressions.toLocaleString()} 
          icon={<Eye className="text-purple-400" size={20} />} 
          trend="+8.2%" 
        />
        <StatsCard 
          label="Engagement" 
          value={totals.engagement.toLocaleString()} 
          icon={<MousePointer2 className="text-emerald-400" size={20} />} 
          trend="+24.1%" 
        />
        <StatsCard 
          label="Followers" 
          value={totals.followers.toLocaleString()} 
          icon={<TrendingUp className="text-orange-400" size={20} />} 
          trend="+2.4%" 
        />
      </div>

      <div className="chart-container">
        <h2 className="chart-title">Reach & Engagement Trends</h2>
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
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
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
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="stats-card">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          {icon}
        </div>
        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div className="stats-label">{label}</div>
      <div className="stats-value">{value}</div>
    </div>
  );
}
