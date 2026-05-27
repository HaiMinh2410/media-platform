'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Icon } from '@shared/ui/icon';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /**
   * Optional custom background class for the active sliding indicator
   * @default 'bg-primary'
   */
  activeBgClass?: string;
  /**
   * Optional custom text class for the active button text/icon
   * @default 'text-primary-content'
   */
  activeTextClass?: string;
}

interface SlidingTabsProps<T extends string> {
  items: readonly TabItem<T>[] | TabItem<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  /**
   * Layout size of the tabs selector
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Optional custom layout ID for Framer Motion to prevent conflicts if multiple sliding tabs are on the same page
   * @default 'slidingTabIndicator'
   */
  layoutId?: string;
  className?: string;
  /**
   * Make the tabs expand to 100% width and stretch buttons equally
   * @default false
   */
  fullWidth?: boolean;
}

export function SlidingTabs<T extends string>({
  items,
  activeValue,
  onChange,
  size = 'md',
  layoutId = 'slidingTabIndicator',
  className = '',
  fullWidth = false,
}: SlidingTabsProps<T>) {
  // Định nghĩa styles cho từng kích thước
  const sizeStyles = {
    xs: {
      container: 'p-0.5 rounded-xl gap-0.5',
      button: 'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase gap-1',
      icon: 10,
    },
    sm: {
      container: 'p-1 rounded-xl gap-1',
      button: 'px-3 py-1.5 rounded-lg text-xs font-bold gap-2',
      icon: 12,
    },
    md: {
      container: 'p-1.5 rounded-2xl gap-1.5',
      button: 'px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider gap-2.5',
      icon: 14,
    },
    lg: {
      container: 'p-2 rounded-2xl gap-2',
      button: 'px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-widest gap-3',
      icon: 16,
    },
  };

  const currentStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`flex flex-wrap border border-base-content/5 rounded-2xl select-none shadow-inner relative ${
        fullWidth ? 'w-full' : 'w-fit'
      } ${currentStyle.container} ${className}`}
    >
      {items.map((item) => {
        const isActive = activeValue === item.value;
        const activeBg = item.activeBgClass || 'bg-primary';
        const activeText = item.activeTextClass || 'text-primary-content';

        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center transition-all duration-300 cursor-pointer select-none outline-none ${
              fullWidth ? 'flex-1 justify-center' : ''
            } ${currentStyle.button} ${
              isActive
                ? `${activeText} scale-[1.02]`
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/10'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={`absolute inset-0 rounded-xl shadow-md -z-10 ${activeBg}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            {item.icon && (
              <Icon
                lucide={item.icon}
                size={currentStyle.icon}
                className="relative z-10 transition-colors duration-300"
              />
            )}
            <span className="relative z-10 transition-colors duration-300">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
