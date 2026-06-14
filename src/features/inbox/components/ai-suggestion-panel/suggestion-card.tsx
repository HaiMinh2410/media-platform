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
    <div className="card bg-base-100 border border-base-content/5 hover:border-base-content/10 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-base-200/30 group shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <Zap size={12} fill="currentColor" />
          <span className="text-sm font-bold select-none tracking-wider">
            {modelDisplayName}
          </span>
        </div>
        <span className="text-xs text-base-content/40 flex items-center gap-1">
          {timeDifferenceLabel}
        </span>
      </div>

      <p className="text-sm text-base-content/70 leading-relaxed m-0 italic">
        "{suggestion.response}"
      </p>

      <div className="flex items-center gap-2 mt-1">
        <button
          className="btn btn-primary btn-sm flex-1"
          onClick={() => onUse(suggestion.response)}
        >
          Sử dụng
        </button>
        <button
          className="btn btn-square btn-ghost btn-sm bg-base-200/50 hover:bg-base-200 text-base-content/40 hover:text-base-content border border-base-content/5"
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Bỏ qua gợi ý"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
