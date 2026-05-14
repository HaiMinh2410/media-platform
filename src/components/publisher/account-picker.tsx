'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlatformAccount } from '@/domain/types/platform-account';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

type AccountPickerProps = {
  accounts: PlatformAccount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function AccountPicker({ accounts, selectedIds, onChange }: AccountPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAccount = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectGroup = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const groupIds = accounts.filter(a => a.platform.toLowerCase() === platform.toLowerCase()).map(a => a.id);
    const newSelected = new Set(selectedIds);
    groupIds.forEach(id => newSelected.add(id));
    onChange(Array.from(newSelected));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedAccounts = accounts.filter(a => selectedIds.includes(a.id));
  const visibleChips = selectedAccounts.slice(0, 3);
  const overflowCount = selectedAccounts.length - 3;

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.username && a.username.toLowerCase().includes(search.toLowerCase()))
  );

  const fbAccounts = filteredAccounts.filter(a => a.platform.toLowerCase() === 'facebook');
  const igAccounts = filteredAccounts.filter(a => a.platform.toLowerCase() === 'instagram');

  return (
    <div className="relative w-full font-sans" ref={containerRef}>
      {/* TRIGGER BAR */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center min-h-[52px] bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-xl px-3 py-2 cursor-pointer hover:border-[#4f7cff]/50 transition-colors"
      >
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {selectedAccounts.length === 0 ? (
            <span className="text-[#7a7a9a] text-[13px] ml-1">Chọn tài khoản đăng bài...</span>
          ) : (
            <>
              {visibleChips.map(acc => {
                const isFb = acc.platform.toLowerCase() === 'facebook';
                return (
                  <div key={acc.id} className="flex items-center bg-[#252836] rounded-[20px] pl-1 pr-2 py-1 border border-[#2a2f42] gap-2">
                    <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: isFb ? '#1877F2' : '#E1306C' }}>
                      {acc.avatar_url ? (
                        <img src={acc.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        acc.name.charAt(0).toUpperCase()
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center border border-[#161920]" style={{ background: isFb ? '#1877F2' : 'linear-gradient(45deg, #405DE6 0%, #E1306C 100%)' }}>
                        {isFb ? <Icon name="facebook" size={6} className="text-white" /> : <Icon name="instagram" size={6} className="text-white" />}
                      </div>
                    </div>
                    <span className="text-[12px] text-white font-medium whitespace-nowrap">{acc.name}</span>
                    <button 
                      onClick={(e) => toggleAccount(acc.id, e)}
                      className="text-[#7a7a9a] hover:text-[#ff5c6a] transition-colors p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {overflowCount > 0 && (
                <div className="bg-[#4f7cff]/20 text-[#4f7cff] text-[12px] font-semibold px-3 py-1 rounded-[20px] border border-[#4f7cff]/30">
                  +{overflowCount} khác
                </div>
              )}
            </>
          )}
        </div>
        <ChevronDown size={16} className={cn("text-[#7a7a9a] transition-transform duration-200 ml-2", isOpen && "rotate-180")} />
      </div>

      {/* DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-[calc(100%+8px)] left-0 w-full bg-[#161920] border border-[#2a2f42] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
          >
            {/* Search input */}
            <div className="p-3 border-b border-[#2a2f42]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a9a]" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tài khoản..." 
                  className="w-full bg-[#0d0f14] border border-[#2a2f42] rounded-lg pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#7a7a9a] focus:outline-none focus:border-[#4f7cff]"
                />
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2 p-3 pb-2">
              <button onClick={(e) => selectGroup('facebook', e)} className="text-[11px] font-medium bg-[#252836] text-[#e0e0e0] px-3 py-1.5 rounded-[20px] hover:bg-[#2a2f42] transition-colors border border-[#2a2f42]">
                ✓ Tất cả Facebook
              </button>
              <button onClick={(e) => selectGroup('instagram', e)} className="text-[11px] font-medium bg-[#252836] text-[#e0e0e0] px-3 py-1.5 rounded-[20px] hover:bg-[#2a2f42] transition-colors border border-[#2a2f42]">
                ✓ Tất cả Instagram
              </button>
              <button className="text-[11px] font-medium bg-[#252836] text-[#e0e0e0] px-3 py-1.5 rounded-[20px] hover:bg-[#2a2f42] transition-colors border border-[#2a2f42]">
                📦 Preset Marketing
              </button>
              <button onClick={clearAll} className="text-[11px] font-medium bg-transparent text-[#ff5c6a] px-3 py-1.5 rounded-[20px] hover:bg-[#ff5c6a]/10 transition-colors border border-transparent ml-auto">
                ✕ Bỏ hết
              </button>
            </div>

            {/* Account List */}
            <div className="overflow-y-auto pb-2">
              {fbAccounts.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-[11px] font-bold text-[#7a7a9a] tracking-[1px] font-mono">FACEBOOK</div>
                  {fbAccounts.map(acc => (
                    <AccountRow 
                      key={acc.id} 
                      account={acc} 
                      isSelected={selectedIds.includes(acc.id)} 
                      onToggle={() => toggleAccount(acc.id)} 
                    />
                  ))}
                </div>
              )}
              {igAccounts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[11px] font-bold text-[#7a7a9a] tracking-[1px] font-mono">INSTAGRAM</div>
                  {igAccounts.map(acc => (
                    <AccountRow 
                      key={acc.id} 
                      account={acc} 
                      isSelected={selectedIds.includes(acc.id)} 
                      onToggle={() => toggleAccount(acc.id)} 
                    />
                  ))}
                </div>
              )}
              {fbAccounts.length === 0 && igAccounts.length === 0 && (
                <div className="p-8 text-center text-[#7a7a9a] text-[13px]">
                  Không tìm thấy tài khoản nào
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountRow({ account, isSelected, onToggle }: { account: PlatformAccount; isSelected: boolean; onToggle: () => void }) {
  const isFb = account.platform.toLowerCase() === 'facebook';
  
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors border-b border-[#2a2f42]/50 last:border-0",
        isSelected ? "bg-[#dce8ff] hover:bg-[#c5d7fa]" : "hover:bg-[#252836]"
      )}
    >
      <div className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: isFb ? '#1877F2' : '#E1306C' }}>
        {account.avatar_url ? (
          <img src={account.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          account.name.charAt(0).toUpperCase()
        )}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-[14px] h-[14px] rounded-full flex items-center justify-center border-2",
          isSelected ? "border-[#dce8ff]" : "border-[#161920]"
        )} style={{ background: isFb ? '#1877F2' : 'linear-gradient(45deg, #405DE6 0%, #E1306C 100%)' }}>
          {isFb ? <Icon name="facebook" size={7} className="text-white" /> : <Icon name="instagram" size={7} className="text-white" />}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <span className={cn("text-[13px] font-bold truncate", isSelected ? "text-[#1a3a8c]" : "text-white")}>{account.name}</span>
        <span className={cn("text-[11px] truncate", isSelected ? "text-[#4f7cff]" : "text-[#7a7a9a]")}>
          {account.username ? `@${account.username}` : ''}
        </span>
      </div>
      
      {isSelected && (
        <div className="shrink-0 text-[#2d5be3]">
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}
