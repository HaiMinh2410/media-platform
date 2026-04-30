import React from 'react';
import { cn } from '@/lib/utils';

type UnreadBadgeProps = {
  count: number;
  className?: string;
  size?: 'sm' | 'md';
};

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, className, size = 'md' }) => {
  if (count <= 0) return null;

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-accent-primary text-white font-mono font-bold leading-none",
      size === 'sm' ? "min-w-[14px] h-[14px] text-[8px] px-0.5" : "min-w-[20px] h-[20px] text-[10px] px-1",
      "shadow-[0_0_12px_rgba(99,102,241,0.4)]",
      className
    )}>
      {count > 99 ? '99+' : count}
    </div>
  );
};
