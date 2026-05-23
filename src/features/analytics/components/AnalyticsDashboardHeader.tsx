import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, CloudDownload, Calendar, ChevronDown } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { AccountSelector } from '@features/analytics/components/account-selector';
import { AnalyticsRange } from '@features/analytics/types';
import { motion, AnimatePresence } from 'framer-motion';

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
  handleSync,
  handleSyncAll,
  activeTab
}: AnalyticsDashboardHeaderProps) {
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRangeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rangeOptions = [
    { id: '7d', label: '7 Ngày' },
    { id: '30d', label: '30 Ngày' },
    { id: '90d', label: '90 Ngày' },
    ...(activeTab === 'content' ? [{ id: 'all', label: 'Tất cả thời gian' }] : []),
    { id: 'custom', label: 'Tùy chỉnh' },
  ];

  const getSelectedRangeLabel = () => {
    const found = rangeOptions.find(o => o.id === range);
    return found ? found.label : 'Chọn khoảng thời gian';
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* RANGE SELECTOR DROPDOWN */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsRangeOpen(!isRangeOpen)}
          className="bg-base-200/70 hover:bg-base-300/50 border border-base-content/5 rounded-xl px-4 py-2 text-xs font-bold text-base-content/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-base-content/60" />
          <span>{getSelectedRangeLabel()}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-base-content/40 transition-transform duration-200 ${isRangeOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isRangeOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[110%] right-0 bg-base-300/95 border border-base-content/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[155px] flex flex-col gap-0.5 backdrop-blur-xl"
            >
              {rangeOptions.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRange(r.id as any);
                    setIsRangeOpen(false);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    range === r.id
                      ? 'text-primary bg-primary/10'
                      : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'
                  }`}
                >
                  <span>{r.label}</span>
                  {range === r.id && (
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CUSTOM DATE INPUTS */}
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
  );
}
