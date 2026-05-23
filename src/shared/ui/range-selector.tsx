'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RangeOption {
  id: string;
  label: string;
}

interface RangeSelectorProps {
  value: string;
  onChange: (value: any) => void;
  options: RangeOption[];
  className?: string;
}

export function RangeSelector({
  value,
  onChange,
  options,
  className = ''
}: RangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedLabel = () => {
    const found = options.find(o => o.id === value);
    return found ? found.label : 'Chọn khoảng thời gian';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-base-100 dark:bg-base-200/60 hover:bg-base-200 dark:hover:bg-base-100 border border-base-content/5 rounded-xl px-4 h-8 text-xs font-bold text-base-content/85 flex items-center gap-2 transition-all duration-300 cursor-pointer shadow-sm shrink-0"
      >
        <Calendar className="w-3.5 h-3.5 text-base-content/60" />
        <span>{getSelectedLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-base-content/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[110%] left-0 bg-base-300/95 border border-base-content/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[155px] flex flex-col gap-0.5 backdrop-blur-xl"
          >
            {options.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  value === r.id
                    ? 'text-primary bg-primary/10'
                    : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'
                }`}
              >
                <span>{r.label}</span>
                {value === r.id && (
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
  );
}
