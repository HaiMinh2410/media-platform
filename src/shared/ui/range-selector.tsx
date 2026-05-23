'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RangeOption {
  id: string;
  label: string;
  icon?: React.ReactNode | ((className?: string) => React.ReactNode);
  dropdownLabel?: React.ReactNode;
  iconColorClass?: string;
}

interface RangeSelectorProps {
  value: string;
  onChange: (value: any) => void;
  options: RangeOption[];
  className?: string;
  
  // Controlled state from parent
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Customization
  defaultIcon?: React.ReactNode;
  hideIcon?: boolean;
  menuMinWidth?: string;
  menuAlign?: 'left' | 'right';
}

export function RangeSelector({
  value,
  onChange,
  options,
  className = '',
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultIcon,
  hideIcon = false,
  menuMinWidth = 'min-w-[155px]',
  menuAlign = 'left',
}: RangeSelectorProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : localIsOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setLocalIsOpen(val);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (open && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, isControlled, onOpenChange]);

  const selectedOption = options.find(o => o.id === value);
  const getSelectedLabel = () => {
    return selectedOption ? selectedOption.label : 'Chọn tùy chọn';
  };

  // Helper to render icon
  const renderIcon = (
    iconElement: React.ReactNode | ((className?: string) => React.ReactNode) | undefined,
    fallbackIcon: React.ReactNode,
    iconClassName: string
  ) => {
    if (hideIcon) return null;
    if (!iconElement) return fallbackIcon;
    
    if (typeof iconElement === 'function') {
      return iconElement(iconClassName);
    }
    return iconElement;
  };

  const activeIcon = selectedOption?.icon || defaultIcon;
  const activeIconFallback = <Calendar className="w-3.5 h-3.5 text-base-content/60" />;
  const triggerIconColor = selectedOption?.iconColorClass || 'text-base-content/60';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-4.5 h-8 text-xs font-bold text-foreground/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner shrink-0"
      >
        {renderIcon(activeIcon, activeIconFallback, `w-3.5 h-3.5 ${triggerIconColor}`)}
        <span>{getSelectedLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-base-content/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-[110%] ${menuAlign === 'left' ? 'left-0' : 'right-0'} bg-foreground/5 border border-foreground/10 rounded-xl p-1.5 shadow-2xl z-50 ${menuMinWidth} flex flex-col gap-0.5 backdrop-blur-xl`}
          >
            {options.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  value === r.id
                    ? 'text-foreground bg-foreground/10'
                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {renderIcon(r.icon, null, `w-3.5 h-3.5 ${r.iconColorClass || ''}`)}
                <span className="flex-1 text-left">{r.dropdownLabel || r.label}</span>
                {value === r.id && !r.icon && (
                  <svg className="w-3.5 h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
