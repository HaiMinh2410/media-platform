'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

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
      case 'facebook': return <Icon name="facebook" size={14} className="text-facebook" />;
      case 'instagram': return <Icon name="instagram" size={14} className="text-instagram" />;
      default: return <Icon lucide={Users} size={14} className="text-base-content/40" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 h-8 bg-base-100 overflow-hidden border border-base-content/5 shadow-sm rounded-xl hover:bg-base-200 hover:border-base-content/20 transition-all duration-300 min-w-2xl max-w-[220px] justify-between group cursor-pointer"
      >
        <div className="truncate w-full flex items-center gap-2">
          {selected && getIcon(selected.platform)}
          <span className="text-xs font-bold text-base-content/70 group-hover:text-base-content">
            {selected?.name || 'Chọn tài khoản'}
          </span>
        </div>
        <Icon lucide={ChevronDown} size={14} className={`text-base-content/40 transition-transform duration-300 group-hover:text-base-content/70 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-full min-w-[240px] bg-base-300/95 backdrop-blur-xl border border-base-content/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelect(acc.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer ${
                    acc.id === selectedId 
                      ? 'bg-primary text-primary-content shadow-md font-bold' 
                      : 'hover:bg-base-content/5 text-base-content/70 hover:text-base-content font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border transition-colors ${
                    acc.id === selectedId 
                      ? 'bg-primary-content/20 border-primary-content/30' 
                      : 'bg-base-content/5 border-base-content/10 group-hover:border-base-content/20'
                  }`}>
                    {getIcon(acc.platform)}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold truncate w-full">{acc.name}</span>
                    <span className={`text-[9px] uppercase tracking-widest font-mono ${acc.id === selectedId ? 'text-primary-content/60' : 'text-base-content/40'}`}>{acc.platform}</span>
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
