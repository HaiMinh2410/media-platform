'use client';

import React from 'react';
import { Type, Hash, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContentEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export function ContentEditor({ content, onChange }: ContentEditorProps) {
  const charCount = content.length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-400">Post Content</label>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800",
          charCount > 2200 ? "text-red-400" : "text-slate-500"
        )}>
          {charCount} / 2200 (IG Limit)
        </span>
      </div>

      <div className="relative group">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What would you like to share?"
          className="w-full min-h-[160px] bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none"
        />
        
        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all">
            <Smile size={16} />
          </button>
          <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all">
            <Hash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
