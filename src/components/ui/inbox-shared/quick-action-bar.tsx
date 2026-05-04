import React from 'react';
import { Search, Command, Zap, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuickActionProps = {
  className?: string;
};

export const QuickActionBar: React.FC<QuickActionProps> = ({ className }) => {
  return (
    <div className={cn(
      "glass flex items-center gap-2 px-3 py-2 rounded-2xl",
      "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      className
    )}>
      <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-accent-primary text-white hover:brightness-110 shadow-lg shadow-accent-primary/20">
        <Plus size={18} />
      </button>
      
      <div className="w-px h-6 bg-glass-border mx-1" />
      
      <button className="p-2 text-fg-secondary hover:text-fg-primary hover:bg-glass-bg rounded-xl transition-colors group">
        <Search size={18} className="group-hover:scale-110 transition-transform" />
      </button>
      
      <button className="p-2 text-fg-secondary hover:text-fg-primary hover:bg-glass-bg rounded-xl transition-colors group">
        <Zap size={18} className="group-hover:scale-110 text-teal-500 transition-transform" />
      </button>
      
      <button className="p-2 text-fg-secondary hover:text-fg-primary hover:bg-glass-bg rounded-xl transition-colors group">
        <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
      </button>
      
      <div className="w-px h-6 bg-glass-border mx-1" />
      
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-tertiary border border-glass-border">
        <Command size={12} className="text-fg-tertiary" />
        <span className="text-2xs font-mono font-bold text-fg-tertiary">K</span>
      </div>
    </div>
  );
};
