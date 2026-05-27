'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { ToneMode } from '../../store/inbox.store';
import { SlidingTabs } from '@shared/ui/sliding-tabs';

type ToneSelectorProps = {
  selectedTone: ToneMode;
  setTone: (tone: ToneMode) => void;
  onRewrite: () => void;
  isRewriting: boolean;
  text: string;
};

const TONES: ToneMode[] = ['professional', 'sales', 'warm', 'flirty'];

export function ToneSelector({
  selectedTone,
  setTone,
  onRewrite,
  isRewriting,
  text
}: ToneSelectorProps) {
  const toneItems = TONES.map((t) => ({
    value: t,
    label: t.charAt(0).toUpperCase() + t.slice(1),
    activeBgClass: 'bg-accent-primary/10',
    activeTextClass: 'text-accent-primary',
  }));

  return (
    <div className="flex items-center justify-end gap-3 mb-2 px-1">
      <SlidingTabs
        items={toneItems}
        activeValue={selectedTone}
        onChange={setTone}
        size="sm"
        layoutId="toneSelectorTabs"
        className="border-none shadow-none bg-transparent p-0.5 rounded-md gap-0.5"
      />
      <button 
        type="button"
        className={cn(
          "flex items-center gap-1.5 bg-linear-to-br from-primary/20 to-secondary/20 border border-primary/40 text-foreground text-xs font-semibold px-3 py-1.5 rounded-sm cursor-pointer transition-all shadow-sm hover:from-primary/30 hover:to-secondary/30 hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          isRewriting && "opacity-80 cursor-wait"
        )}
        onClick={onRewrite}
        disabled={isRewriting || !text.trim()}
      >
        <Wand2 size={14} className={cn(isRewriting && "animate-spin")} />
        {isRewriting ? 'Rewriting...' : 'AI Rewrite'}
      </button>
    </div>
  );
}
