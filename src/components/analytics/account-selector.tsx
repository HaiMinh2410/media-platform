'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

interface Account {
  id: string;
  name: string;
  platform: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountSelector({ 
  accounts, 
  selectedId, 
  onSelect 
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = accounts.find(a => a.id === selectedId) || accounts[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Icon name="facebook" size={14} className="text-blue-400" />;
      case 'instagram': return <Icon name="instagram" size={14} className="text-pink-400" />;
      default: return <Icon lucide={Users} size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 min-w-[200px] justify-between group"
      >
        <div className="flex items-center gap-2">
          {selected && getIcon(selected.platform)}
          <span className="text-sm font-medium text-white/90 group-hover:text-white">
            {selected?.name || 'Chọn tài khoản'}
          </span>
        </div>
        <Icon lucide={ChevronDown} size={16} className={`text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-full min-w-[240px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelect(acc.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    acc.id === selectedId 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'hover:bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border transition-colors ${
                    acc.id === selectedId ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 group-hover:border-white/20'
                  }`}>
                    {getIcon(acc.platform)}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-semibold truncate w-full">{acc.name}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-widest">{acc.platform}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
