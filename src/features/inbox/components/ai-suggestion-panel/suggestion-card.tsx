'use client';

import React from 'react';
import type { AiSuggestion } from '@features/inbox/types';
import { Zap, X } from 'lucide-react';
import { formatModelName, calculateTimeAgo } from './panel-constants';

type SuggestionCardProps = {
  suggestion: AiSuggestion;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
};

export function SuggestionCard({ suggestion, onUse, onDismiss }: SuggestionCardProps) {
  const modelDisplayName = formatModelName(suggestion.model);
  const timeDifferenceLabel = calculateTimeAgo(suggestion.createdAt);

  return (
    <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-foreground/[0.05] hover:border-foreground/10 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-accent-primary">
          <Zap size={12} fill="currentColor" />
          <span className="text-sm font-bold select-none tracking-wider">
            {modelDisplayName}
          </span>
        </div>
        <span className="text-xs text-foreground-tertiary flex items-center gap-1">
          {timeDifferenceLabel}
        </span>
      </div>

      <p className="text-sm text-foreground-secondary leading-relaxed m-0 italic">
        "{suggestion.response}"
      </p>

      <div className="flex items-center gap-2 mt-1">
        <button
          className="flex-1 bg-accent-primary text-foreground p-1.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
          onClick={() => onUse(suggestion.response)}
        >
          Sử dụng
        </button>
        <button
          className="w-9 h-9 flex items-center justify-center bg-foreground/5 border border-foreground/10 rounded-lg text-foreground-tertiary transition-all hover:bg-foreground/10 hover:text-foreground"
          onClick={() => onDismiss(suggestion.id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
