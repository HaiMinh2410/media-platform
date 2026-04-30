import React from 'react';
import { Sparkles, Zap, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIState = 'off' | 'shadow' | 'draft' | 'auto';

type AIStateChipProps = {
  state: AIState;
  className?: string;
};

export const AIStateChip: React.FC<AIStateChipProps> = ({ state, className }) => {
  const configs = {
    off: { label: 'Off', icon: null, color: 'text-fg-tertiary bg-bg-tertiary border-transparent' },
    shadow: { 
      label: 'Shadow', 
      icon: Eye, 
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]' 
    },
    draft: { 
      label: 'Draft', 
      icon: Edit, 
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20 shadow-[0_0_12px_rgba(217,70,239,0.15)]' 
    },
    auto: { 
      label: 'Auto', 
      icon: Zap, 
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
    },
  };

  const config = configs[state];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-mono font-black uppercase tracking-tighter transition-all",
      config.color,
      className
    )}>
      {Icon && <Icon size={10} />}
      <span>{config.label}</span>
    </div>
  );
};
