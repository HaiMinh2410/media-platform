'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { InboxMetrics, getInboxMetrics } from '../../application/actions/dashboard.actions';
import { AccountHealthData } from '../../domain/types/platform-account';
import { Icon } from '@/components/ui/icon';
import { cn } from '../../lib/utils';
import { ChevronDown, Globe, LayoutGrid, Users } from 'lucide-react';

interface InboxMetricsCardProps {
  workspaceId: string;
  accounts: AccountHealthData[];
  initialData?: InboxMetrics;
}

export function InboxMetricsCard({ workspaceId, accounts, initialData }: InboxMetricsCardProps) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [metrics, setMetrics] = useState<InboxMetrics | null>(initialData || null);
  const [isPending, startTransition] = useTransition();

  const fetchMetrics = () => {
    // Skip first fetch if initialData is present and no filters changed from default
    if (initialData && !selectedAccountId && period === '24h' && metrics === initialData) return;

    startTransition(async () => {
      const data = await getInboxMetrics(workspaceId, selectedAccountId, period);
      setMetrics(data);
    });
  };

  useEffect(() => {
    fetchMetrics();
  }, [workspaceId, selectedAccountId, period]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="bg-base-100/50 rounded-3xl border border-base-content/5 p-8 flex flex-col gap-8 shadow-sm h-full backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      {/* Panel header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <span className="text-lg">📥</span> Inbox Metrics — Phễu Hội Thoại
            {isPending && <span className="loading loading-spinner loading-xs text-primary"></span>}
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-base-200/50 p-1 rounded-xl border border-base-content/5">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-mono transition-all",
                period === p 
                  ? "bg-primary text-primary-content shadow-sm" 
                  : "text-base-content/40 hover:text-base-content/70"
              )}
            >
              {p === '24h' ? '24h' : p === '7d' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </div>

      {/* Body: account switcher + charts */}
      <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-8 flex-grow">
        {/* Switcher */}
        <div className="border-r border-base-content/5 pr-4 flex flex-col gap-1 overflow-y-auto max-h-[400px]">
          <div className="text-[9px] text-base-content/40 uppercase font-black tracking-widest px-2 mb-2">Chọn TK</div>
          
          <button 
            onClick={() => setSelectedAccountId(undefined)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold transition-all",
              !selectedAccountId 
                ? "bg-primary/10 text-primary" 
                : "text-base-content/50 hover:bg-base-200/50"
            )}
          >
            🌐 Tất cả
          </button>

          {accounts.map(account => (
            <button 
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold transition-all truncate",
                selectedAccountId === account.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-base-content/50 hover:bg-base-200/50"
              )}
            >
              {account.platform === 'facebook' ? 'f ' : '📸 '}{account.platform_user_name}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Funnel Chart */}
          <div className="flex flex-col">
            <div className="text-[11px] text-base-content/40 mb-4">Phễu xử lý tin nhắn</div>
            <div className="flex flex-col gap-4">
              <FunnelBar 
                label="📨 Tổng đến" 
                value={metrics?.totalMessages || 0} 
                percent={100} 
                colorClass="from-[#6d28d9] to-[#7c3aed]"
                delay="delay-0"
              />
              <FunnelBar 
                label="🤖 AI xử lý" 
                value={metrics?.aiHandled || 0} 
                percent={metrics?.aiHandledPct || 0} 
                colorClass="from-[#0891b2] to-[#06b6d4]"
                delay="delay-100"
              />
              <FunnelBar 
                label="👤 Cần người" 
                value={metrics?.humanNeeded || 0} 
                percent={metrics?.humanNeededPct || 0} 
                colorClass="from-[#c2410c] to-[#ea580c]"
                delay="delay-200"
              />
            </div>
          </div>

          {/* Tag Distribution */}
          <div className="flex flex-col">
            <div className="text-[11px] text-base-content/40 mb-4">Phân bổ Lead theo AI Tag</div>
            <TagDistributionChart distribution={metrics?.leadDistribution} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, percent, colorClass, delay }: { label: string, value: number, percent: number, colorClass: string, delay: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] text-base-content/60 font-semibold">{label}</span>
        <span className="text-[10px] text-base-content/60 font-mono">{value.toLocaleString()}{percent < 100 ? ` (${percent}%)` : ''}</span>
      </div>
      <div className="h-[28px] bg-base-200/50 rounded-lg overflow-hidden border border-base-content/5">
        <div 
          className={cn(
            "h-full bg-gradient-to-r flex items-center pl-3 text-[11px] text-white font-bold transition-all duration-1000 ease-out", 
            colorClass,
            mounted ? "" : "w-0"
          )}
          style={{ width: mounted ? `${percent}%` : '0%' }}
        >
          {mounted && value > 0 && <span>{value.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

function TagDistributionChart({ distribution }: { distribution?: InboxMetrics['leadDistribution'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const total = (distribution?.hot || 0) + (distribution?.warm || 0) + (distribution?.cold || 0);
  
  const hotPct = total > 0 ? Math.round((distribution!.hot / total) * 100) : 0;
  const warmPct = total > 0 ? Math.round((distribution!.warm / total) * 100) : 0;
  const coldPct = total > 0 ? Math.round((distribution!.cold / total) * 100) : 0;

  return (
    <div className="flex items-center gap-6">
      {/* Vertical Stacked Bar */}
      <div className="w-[38px] h-[140px] bg-base-200/50 rounded-lg overflow-hidden flex flex-col-reverse border border-base-content/5">
        <div 
          className="bg-[#3b82f6] transition-all duration-1000 ease-out" 
          style={{ height: mounted ? `${coldPct}%` : '0%' }}
        />
        <div 
          className="bg-[#f97316] transition-all duration-1000 ease-out" 
          style={{ height: mounted ? `${warmPct}%` : '0%' }}
        />
        <div 
          className="bg-[#ef4444] transition-all duration-1000 ease-out" 
          style={{ height: mounted ? `${hotPct}%` : '0%' }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-4">
        <LegendItem 
          color="#ef4444" 
          label="Hot Lead" 
          emoji="🔥"
          count={distribution?.hot || 0} 
          percent={hotPct} 
        />
        <LegendItem 
          color="#f97316" 
          label="Warm Lead" 
          emoji="🌡"
          count={distribution?.warm || 0} 
          percent={warmPct} 
        />
        <LegendItem 
          color="#3b82f6" 
          label="Cold Lead" 
          emoji="❄️"
          count={distribution?.cold || 0} 
          percent={coldPct} 
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label, emoji, count, percent }: { color: string, label: string, emoji: string, count: number, percent: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: color }}></div>
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-base-content">{count.toLocaleString()}</span>
          <span className="text-[10px] text-base-content/40 font-medium">{percent}%</span>
        </div>
        <span className="text-[10px] text-base-content/50">{emoji} {label}</span>
      </div>
    </div>
  );
}
