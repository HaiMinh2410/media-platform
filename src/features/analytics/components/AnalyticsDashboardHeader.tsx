import { Icon, RangeSelector } from "@shared/ui";

import React from 'react';
import { RefreshCw, CloudDownload } from 'lucide-react';
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
  syncType?: 'account' | 'all' | null;
  handleSync: () => Promise<void>;
  handleSyncAll: () => Promise<void>;
  activeTab?: string;
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
  syncType,
  handleSync,
  handleSyncAll,
  activeTab
}: AnalyticsDashboardHeaderProps) {
  const rangeOptions = [
    { id: '7d', label: 'Last 7 days' },
    { id: '14d', label: 'Last 14 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    ...(activeTab === 'content' ? [{ id: 'all', label: 'All Time' }] : []),
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 relative z-30">
      {/* FILTER GROUP */}
      <div className="flex flex-wrap items-center gap-1.5 p-1">
        {/* RANGE SELECTOR DROPDOWN */}
        <RangeSelector 
          value={range}
          onChange={setRange}
          options={rangeOptions}
        />

        {/* CUSTOM DATE INPUTS */}
        {range === 'custom' && (
          <div className="flex items-center gap-2 bg-base-100 dark:bg-base-200/60 border border-base-content/5 rounded-xl px-3 py-2 animate-in fade-in slide-in-from-right-2 duration-300 shadow-sm">
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
        
        <div className="h-6 w-px bg-base-content/10 mx-0.5 shrink-0" />
        
        <AccountSelector 
          accounts={accounts} 
          selectedId={selectedAccountId} 
          onSelect={setSelectedAccountId} 
        />
      </div>

      {/* ACTION GROUP */}
      <div className="flex items-center gap-1.5 p-1 border border-base-content/5 rounded-2xl shadow-inner">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`btn btn-ghost hover:bg-transparent rounded-full btn-sm transition-all duration-300 ${
            isSyncing 
              ? 'btn-disabled opacity-50 bg-base-300' 
              : 'text-base-content/60 hover:text-info'
          }`}
          title="Đồng bộ dữ liệu tài khoản này"
        >
          <Icon 
            lucide={RefreshCw} 
            size={15} 
            className={syncType === 'account' ? 'animate-spin text-info' : ''} 
          />
        </button>
        <div className="h-6 w-px bg-base-content/10 shrink-0" />
        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className={`btn btn-sm btn-ghost rounded-full hover:bg-transparent transition-all duration-300 font-bold ${
            isSyncing 
              ? 'btn-disabled opacity-50 bg-base-300' 
              : 'text-base-content/60 hover:text-info'
          }`}
          title="Đồng bộ tất cả tài khoản"
        >
          <Icon 
            lucide={syncType === 'all' ? RefreshCw : CloudDownload} 
            size={14} 
            className={syncType === 'all' ? 'animate-spin text-info' : 'text-base-content/70'} 
          />
          <span className="hidden sm:inline text-xs">Sync All</span>
        </button>
      </div>
    </div>
  );
}
