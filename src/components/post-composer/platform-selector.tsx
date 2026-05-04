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
      <label className="text-sm font-bold uppercase tracking-widest text-foreground-tertiary ml-1">Select Accounts</label>
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
                  ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20" 
                  : "bg-background-secondary/40 border-foreground/10 text-foreground-secondary hover:border-foreground/20 hover:bg-background-tertiary/40"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                isSelected 
                  ? "bg-primary text-primary-content shadow-lg shadow-primary/40 scale-110" 
                  : "bg-background-tertiary text-foreground-tertiary group-hover:text-foreground-secondary"
              )}>
                <PlatformIcon size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={cn(
                  "text-md font-bold truncate transition-colors",
                  isSelected ? "text-foreground" : "text-foreground-secondary"
                )}>{account.name}</p>
                <p className="text-2xs font-bold uppercase tracking-widest opacity-50">{account.platform}</p>
              </div>
              
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-4 border-base-100 shadow-lg">
                  <Check size={12} className="text-primary-content stroke-[3px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
