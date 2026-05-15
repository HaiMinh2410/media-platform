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
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
            Inbox Metrics
            {isPending && <span className="loading loading-spinner loading-xs text-primary"></span>}
          </h2>
          <p className="text-[10px] text-base-content/40 font-black uppercase tracking-widest">Funnel & Lead Distribution</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Account Switcher */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm bg-base-200/60 hover:bg-base-300/80 border-none normal-case px-4 rounded-xl flex items-center gap-2 transition-all">
              {selectedAccount ? (
                <>
                  <div className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center text-white",
                    selectedAccount.platform === 'facebook' ? "bg-blue-600" : "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"
                  )}>
                    <Icon name={selectedAccount.platform as any} size={10} />
                  </div>
                  <span className="truncate max-w-[80px] text-xs font-bold">{selectedAccount.platform_user_name}</span>
                </>
              ) : (
                <>
                  <Icon lucide={Globe} size={14} className="text-primary" />
                  <span className="text-xs font-bold">Tất cả</span>
                </>
              )}
              <ChevronDown size={14} className="text-base-content/30" />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[10] menu p-2 shadow-2xl bg-base-100 border border-base-200 rounded-2xl w-64 mt-2">
              <li>
                <button 
                  onClick={() => setSelectedAccountId(undefined)}
                  className={cn("rounded-xl p-3 flex items-center gap-3", !selectedAccountId && "bg-primary/10 text-primary font-bold")}
                >
                  <Icon lucide={Globe} size={18} />
                  <span>Tất cả tài khoản</span>
                </button>
              </li>
              <div className="divider my-1 opacity-50 px-2"></div>
              {accounts.map(account => (
                <li key={account.id}>
                  <button 
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      "rounded-xl p-3 flex items-center gap-3",
                      selectedAccountId === account.id && "bg-primary/10 text-primary font-bold"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                      account.platform === 'facebook' ? "bg-blue-600" : "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"
                    )}>
                      <Icon name={account.platform as any} size={16} />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="truncate w-full text-sm font-bold">{account.platform_user_name}</span>
                      <span className="text-[10px] opacity-50 uppercase font-black">{account.platform}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Date Toggle */}
          <div className="bg-base-200/60 p-1 rounded-xl flex gap-1 border border-base-content/5">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                  period === p ? "bg-primary text-primary-content shadow-md shadow-primary/20" : "text-base-content/40 hover:text-base-content/70"
                )}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center flex-grow">
        {/* Funnel Chart */}
        <div className="md:col-span-8 flex flex-col gap-6 h-full justify-center">
          <div className="flex flex-col gap-6">
            <FunnelBar 
              label="Total Messages" 
              value={metrics?.totalMessages || 0} 
              percent={100} 
              colorClass="from-indigo-600 to-blue-500"
              icon={<Icon lucide={LayoutGrid} size={16} />}
              delay="delay-0"
            />
            <FunnelBar 
              label="AI Handled" 
              value={metrics?.aiHandled || 0} 
              percent={metrics?.aiHandledPct || 0} 
              colorClass="from-emerald-500 to-teal-400"
              icon={<span className="text-[10px] font-black">AI</span>}
              delay="delay-100"
            />
            <FunnelBar 
              label="Human Needed" 
              value={metrics?.humanNeeded || 0} 
              percent={metrics?.humanNeededPct || 0} 
              colorClass="from-orange-500 to-amber-400"
              icon={<Icon lucide={Users} size={16} />}
              delay="delay-200"
            />
          </div>
        </div>

        {/* Tag Distribution */}
        <div className="md:col-span-4 flex items-center justify-center h-full">
          <TagDistributionChart distribution={metrics?.leadDistribution} />
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, percent, colorClass, icon, delay }: { label: string, value: number, percent: number, colorClass: string, icon: React.ReactNode, delay: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col gap-2.5 group">
      <div className="flex justify-between items-end px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-base-200/80 border border-base-content/5 flex items-center justify-center text-base-content/60 group-hover:scale-110 transition-transform shadow-sm">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-base-content/80 leading-none">{label}</span>
            <span className="text-[10px] text-base-content/30 font-black uppercase tracking-widest">{value.toLocaleString()} messages</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xl font-black tracking-tight text-base-content">{percent}%</span>
        </div>
      </div>
      <div className="h-5 bg-base-200/50 rounded-xl overflow-hidden p-1 border border-base-content/5 shadow-inner">
        <div 
          className={cn(
            "h-full rounded-lg bg-gradient-to-r shadow-lg transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
            colorClass,
            mounted ? "" : "w-0"
          )}
          style={{ width: mounted ? `${percent}%` : '0%' }}
        />
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
    <div className="flex items-center gap-8 bg-base-200/30 p-6 rounded-3xl border border-base-content/5 h-full w-full justify-center">
      {/* Vertical Stacked Bar */}
      <div className="w-14 h-52 bg-base-200/80 rounded-2xl overflow-hidden flex flex-col-reverse p-1 border border-base-content/5 shadow-inner relative">
        <div 
          className="bg-error rounded-t-[2px] rounded-b-xl transition-all duration-1000 ease-out shadow-sm flex items-center justify-center overflow-hidden relative group" 
          style={{ height: mounted ? `${hotPct}%` : '0%' }}
        >
          {hotPct > 12 && <span className="text-[9px] font-black text-white rotate-90 whitespace-nowrap opacity-80">HOT</span>}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div 
          className="bg-warning transition-all duration-1000 ease-out shadow-sm flex items-center justify-center overflow-hidden relative group" 
          style={{ height: mounted ? `${warmPct}%` : '0%' }}
        >
           {warmPct > 12 && <span className="text-[9px] font-black text-warning-content rotate-90 whitespace-nowrap opacity-80">WARM</span>}
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div 
          className="bg-success rounded-b-[2px] rounded-t-xl transition-all duration-1000 ease-out shadow-sm flex items-center justify-center overflow-hidden relative group" 
          style={{ height: mounted ? `${coldPct}%` : '0%' }}
        >
           {coldPct > 12 && <span className="text-[9px] font-black text-success-content rotate-90 whitespace-nowrap opacity-80">COLD</span>}
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-5">
        <LegendItem color="bg-error" label="Hot" count={distribution?.hot || 0} percent={hotPct} />
        <LegendItem color="bg-warning" label="Warm" count={distribution?.warm || 0} percent={warmPct} />
        <LegendItem color="bg-success" label="Cold" count={distribution?.cold || 0} percent={coldPct} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, count, percent }: { color: string, label: string, count: number, percent: number }) {
  return (
    <div className="flex items-center gap-4 group cursor-default">
      <div className={cn("w-3.5 h-3.5 rounded-full shadow-lg transition-transform group-hover:scale-125", color)}></div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-base-content/80">{label}</span>
          <span className="text-[10px] font-bold text-primary">{percent}%</span>
        </div>
        <span className="text-[10px] text-base-content/40 font-black tracking-tight">{count} leads</span>
      </div>
    </div>
  );
}
