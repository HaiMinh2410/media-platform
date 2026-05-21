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
      default: return <Icon lucide={Users} size={14} className="text-foreground-tertiary" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-base-300 border border-foreground/10 rounded-xl hover:bg-base-200 hover:border-foreground/20 transition-all duration-300 min-w-[200px] justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {selected && getIcon(selected.platform)}
          <span className="text-sm font-medium text-foreground-secondary group-hover:text-foreground">
            {selected?.name || 'Chọn tài khoản'}
          </span>
        </div>
        <Icon lucide={ChevronDown} size={16} className={`text-foreground-tertiary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-full min-w-[240px] bg-base-200/95 backdrop-blur-xl border border-foreground/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelect(acc.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    acc.id === selectedId 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-foreground/5 text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border transition-colors ${
                    acc.id === selectedId ? 'bg-primary/20 border-primary/30' : 'bg-foreground/5 border-foreground/10 group-hover:border-foreground/20'
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
