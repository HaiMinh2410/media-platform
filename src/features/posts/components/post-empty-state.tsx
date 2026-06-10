'use client';

import React from 'react';
import { FileText, Plus, CircleOff } from 'lucide-react';
import Link from 'next/link';

type PostEmptyStateProps = {
  hasFilters?: boolean;
  onClear?: () => void;
};

export function PostEmptyState({ hasFilters, onClear }: PostEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-base-200 flex items-center justify-center border border-base-content/10">
        {hasFilters ? (
          <CircleOff className="text-base-content/40" size={32} />
        ) : (
          <FileText className="text-primary" size={32} />
        )}
      </div>

      <div className="max-w-xs space-y-2">
        <h3 className="text-lg font-bold text-base-content">
          {hasFilters ? 'No posts matched' : 'No posts yet'}
        </h3>
        <p className="text-sm text-base-content/70 leading-relaxed">
          {hasFilters 
            ? "Try adjusting your filters or search terms to find what you're looking for."
            : 'Start creating amazing content and schedule them across your social platforms.'}
        </p>
      </div>

      {hasFilters ? (
        <button
          onClick={onClear}
          className="text-lg font-semibold tracking-wide text-primary/80 hover:text-primary transition-colors cursor-pointer"
        >
          Clear all filters
        </button>
      ) : (
        <Link
          href="/dashboard/composer"
          className="btn btn-primary rounded-xl flex items-center gap-2 font-bold text-sm hover:-translate-y-0.5 shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Create First Post
        </Link>
      )}
    </div>
  );
}
