import React from 'react';
import { cn } from '@/lib/utils';

type SegmentTagProps = {
  label: string;
  type?: 'priority' | 'sentiment' | 'generic';
  value?: string;
  className?: string;
};

export const SegmentTag: React.FC<SegmentTagProps> = ({ label, type = 'generic', value, className }) => {
  const getStyles = () => {
    if (type === 'priority') {
      switch (value?.toLowerCase()) {
        case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: return 'bg-bg-tertiary text-fg-secondary border-glass-border';
      }
    }
    
    if (type === 'sentiment') {
      switch (value?.toLowerCase()) {
        case 'positive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'negative': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        case 'neutral': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        default: return 'bg-bg-tertiary text-fg-secondary border-glass-border';
      }
    }

    return 'bg-bg-tertiary text-fg-secondary border-glass-border';
  };

  return (
    <div className={cn(
      "px-2 py-0.5 rounded-md border text-2xs font-mono font-bold tracking-tight",
      getStyles(),
      className
    )}>
      {label}
    </div>
  );
};
