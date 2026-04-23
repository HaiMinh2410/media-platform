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
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-400">Select Accounts</label>
      <div className="flex flex-wrap gap-3">
        {accounts.map((account) => {
          const isSelected = selectedIds.includes(account.id);
          const PlatformIcon = account.platform === 'facebook' ? Globe : Camera;

          return (
            <button
              key={account.id}
              onClick={() => toggleAccount(account.id)}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left min-w-[180px]",
                isSelected 
                  ? "bg-blue-600/10 border-blue-500/50 text-blue-100" 
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
              )}>
                <PlatformIcon size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{account.name}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">{account.platform}</p>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
