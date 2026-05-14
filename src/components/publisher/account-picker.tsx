'use client';

import React from 'react';
import { PlatformAccount } from '@/domain/types/platform-account';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Globe, Camera, MoreHorizontal } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

type AccountPickerProps = {
  accounts: PlatformAccount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function AccountPicker({ accounts, selectedIds, onChange }: AccountPickerProps) {
  const toggleAccount = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === accounts.length) {
      onChange([]);
    } else {
      onChange(accounts.map((a) => a.id));
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Select Accounts
          </label>
          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20"
              >
                {selectedCount} Selected
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={selectAll}
          className="text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
        >
          {selectedCount === accounts.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="relative group">
        {/* Horizontal Scroll Area */}
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth">
          {accounts.map((account: any) => {
            const isSelected = selectedIds.includes(account.id);
            const platformLower = account.platform?.toLowerCase();
            const isFacebook = platformLower === 'facebook';
            const isInstagram = platformLower === 'instagram';
            const avatarUrl = account.avatar_url || account.metadata?.picture;

            return (
              <motion.button
                key={account.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleAccount(account.id)}
                className={cn(
                  "flex-shrink-0 relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition-all duration-300",
                  isSelected
                    ? isFacebook
                      ? "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20"
                      : isInstagram
                        ? "bg-pink-500/10 border-pink-500/50 ring-1 ring-pink-500/20"
                        : "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60"
                )}
              >
                {/* Avatar/Icon Circle */}
                <div className={cn(
                  "relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300",
                  isSelected ? "scale-110 shadow-lg" : "bg-slate-800"
                )}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className={isSelected ? "text-primary" : "text-slate-500"} />
                  )}
                  
                  {/* Small Platform Badge Over Avatar */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-950",
                    isFacebook ? "bg-blue-600" : isInstagram ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500" : "bg-primary"
                  )}>
                    <Icon 
                      name={isFacebook ? 'facebook' : isInstagram ? 'instagram' : undefined} 
                      size={8} 
                      className="text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <span className={cn(
                    "text-sm font-bold truncate max-w-[120px]",
                    isSelected ? "text-white" : "text-slate-400"
                  )}>
                    {account.name}
                  </span>
                </div>

                {/* Selected Checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="ml-1"
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center",
                        isFacebook ? "bg-blue-500" : isInstagram ? "bg-pink-500" : "bg-primary"
                      )}>
                        <Check size={10} className="text-white stroke-[3px]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}

          {/* Add Account Placeholder */}
          <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-all">
            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-lg font-light leading-none">+</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Connect</span>
          </button>
        </div>

        {/* Scroll Shadows */}
        <div className="absolute top-0 right-0 h-[calc(100%-1rem)] w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
