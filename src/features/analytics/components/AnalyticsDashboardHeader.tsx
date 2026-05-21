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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-foreground-secondary text-sm">Track your performance across platforms</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-0.5 bg-foreground/5 border border-foreground/10 rounded-xl p-1">
          {(['7d', '30d', '90d'] as AnalyticsRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                range === r 
                  ? 'bg-primary/15 text-primary shadow-lg' 
                  : 'text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button 
            onClick={() => setRange('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              range === 'custom' 
                ? 'bg-primary/15 text-primary shadow-lg' 
                : 'text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5'
            }`}
          >
            Custom
          </button>
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-right-2 duration-300">
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none scheme-dark"
            />
            <span className="text-foreground-secondary/20 text-xs">→</span>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none scheme-dark"
            />
          </div>
        )}
        
        <div className="h-8 w-px bg-foreground/10 mx-1" />
        
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
              ? 'bg-foreground/5 border-foreground/10 cursor-not-allowed opacity-50' 
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
              ? 'bg-foreground/5 border-foreground/10 cursor-not-allowed opacity-50 text-foreground-tertiary' 
              : 'bg-foreground/5 border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20 text-foreground'
          }`}
          title="Đồng bộ tất cả tài khoản"
        >
          <Icon lucide={CloudDownload} size={14} className={isSyncing ? 'animate-pulse text-blue-400' : ''} />
          <span className="hidden sm:inline">Sync All</span>
        </button>
      </div>
    </div>
  );
}
