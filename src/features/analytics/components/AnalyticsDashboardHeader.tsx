import React from 'react';
import { RefreshCw, CloudDownload } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { AccountSelector } from '@features/analytics/components/account-selector';
import { AnalyticsRange } from '@features/analytics/types';

interface AnalyticsDashboardHeaderProps {
  accounts: Array<{ id: string; name: string; platform: string }>;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  range: AnalyticsRange;
  setRange: (range: AnalyticsRange) => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  isSyncing: boolean;
  handleSync: () => Promise<void>;
  handleSyncAll: () => Promise<void>;
}

export function AnalyticsDashboardHeader({
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  range,
  setRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  isSyncing,
  handleSync,
  handleSyncAll
}: AnalyticsDashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-black text-base-content font-brand tracking-tight">Analytics</h1>
        <p className="text-base-content/50 text-sm font-medium mt-1">Theo dõi hiệu suất truyền thông trên các nền tảng</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-0.5 bg-base-200/70 border border-base-content/5 rounded-xl p-1 shadow-inner">
          {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                range === r 
                  ? 'bg-primary text-primary-content shadow-sm scale-[1.02]' 
                  : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button 
            onClick={() => setRange('custom')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              range === 'custom' 
                ? 'bg-primary text-primary-content shadow-sm scale-[1.02]' 
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            Custom
          </button>
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2 bg-base-200/50 border border-base-content/5 rounded-xl px-3 py-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-xs text-base-content outline-none scheme-light dark:scheme-dark font-mono font-semibold"
            />
            <span className="text-base-content/20 text-xs font-bold">→</span>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-xs text-base-content outline-none scheme-light dark:scheme-dark font-mono font-semibold"
            />
          </div>
        )}
        
        <div className="h-8 w-px bg-base-content/10 mx-1" />
        
        <AccountSelector 
          accounts={accounts} 
          selectedId={selectedAccountId} 
          onSelect={setSelectedAccountId} 
        />

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`btn btn-square btn-sm transition-all duration-300 ${
            isSyncing 
              ? 'btn-disabled opacity-50 bg-base-300' 
              : 'btn-soft btn-info hover:scale-105'
          }`}
          title="Đồng bộ dữ liệu tài khoản này"
        >
          <Icon lucide={RefreshCw} size={16} className={isSyncing ? 'animate-spin' : ''} />
        </button>
        
        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className={`btn btn-sm transition-all duration-300 font-bold ${
            isSyncing 
              ? 'btn-disabled opacity-50 bg-base-300' 
              : 'btn-soft hover:scale-105'
          }`}
          title="Đồng bộ tất cả tài khoản"
        >
          <Icon lucide={CloudDownload} size={14} className={isSyncing ? 'animate-pulse text-info' : ''} />
          <span className="hidden sm:inline">Sync All</span>
        </button>
      </div>
    </div>
  );
}
