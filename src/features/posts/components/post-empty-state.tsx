'use client';

import React from 'react';
import { FileText, Plus, XCircle } from 'lucide-react';
import Link from 'next/link';

type PostEmptyStateProps = {
  hasFilters?: boolean;
  onClear?: () => void;
};

export function PostEmptyState({ hasFilters, onClear }: PostEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 bg-background-secondary border border-dashed border-foreground/10 rounded-[2rem] text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-background-tertiary flex items-center justify-center shadow-2xl border border-foreground/10 ring-4 ring-foreground/5">
        {hasFilters ? (
          <XCircle className="text-slate-500" size={32} />
        ) : (
          <FileText className="text-blue-500" size={32} />
        )}
      </div>

      <div className="max-w-xs space-y-2">
        <h3 className="text-lg font-bold text-foreground">
          {hasFilters ? 'No posts matched' : 'No posts yet'}
        </h3>
        <p className="text-sm text-foreground-tertiary leading-relaxed">
          {hasFilters 
            ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
            : 'Start creating amazing content and schedule them across your social platforms.'}
        </p>
      </div>

      {hasFilters ? (
        <button
          onClick={onClear}
          className="text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
        >
          Clear all filters
        </button>
      ) : (
        <Link
          href="/dashboard/composer"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Create First Post
        </Link>
      )}
    </div>
  );
}
