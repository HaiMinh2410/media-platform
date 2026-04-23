'use client';

import React from 'react';
import { PlatformAccount } from '@/domain/types/platform-account';
import { Check, Globe, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlatformSelectorProps = {
  accounts: PlatformAccount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function PlatformSelector({ accounts, selectedIds, onChange }: PlatformSelectorProps) {
  const toggleAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-bold uppercase tracking-widest text-slate-500 ml-1">Select Accounts</label>
      <div className="flex flex-wrap gap-4">
        {accounts.map((account) => {
          const isSelected = selectedIds.includes(account.id);
          const PlatformIcon = account.platform === 'facebook' ? Globe : Camera;

          return (
            <button
              key={account.id}
              onClick={() => toggleAccount(account.id)}
              className={cn(
                "group relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 text-left min-w-[200px]",
                isSelected 
                  ? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20" 
                  : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                isSelected 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-110" 
                  : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
              )}>
                <PlatformIcon size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={cn(
                  "text-[15px] font-bold truncate transition-colors",
                  isSelected ? "text-white" : "text-slate-300"
                )}>{account.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{account.platform}</p>
              </div>
              
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg">
                  <Check size={12} className="text-white stroke-[3px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
