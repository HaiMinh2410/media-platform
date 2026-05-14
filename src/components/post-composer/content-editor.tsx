'use client';

import React from 'react';
import { Type, Hash, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ValidationIssue } from '@/lib/validation/validation-engine';

type ContentEditorProps = {
  content: string;
  onChange: (content: string) => void;
  maxLength: number;
  issues: ValidationIssue[];
};

export function ContentEditor({ content, onChange, maxLength, issues }: ContentEditorProps) {
  const charCount = content.length;
  const contentIssues = issues.filter(i => i.message.includes('ký tự') || i.message.includes('hashtag'));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Post Content</label>
        <div className={cn(
          "text-2xs font-bold px-3 py-1 rounded-full bg-black/40 border border-white/5 shadow-inner transition-colors",
          charCount > maxLength ? "text-red-400 border-red-500/20" : "text-slate-500"
        )}>
          {charCount.toLocaleString()} <span className="opacity-40">/</span> {maxLength === Infinity ? '∞' : maxLength.toLocaleString()}
        </div>
      </div>

      <div className="relative group">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What would you like to share?"
          className="w-full min-h-[220px] bg-black/20 border border-white/5 rounded-3xl p-6 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all resize-none text-lg leading-relaxed shadow-inner"
        />
        
        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-all duration-300 translate-y-2 group-focus-within:translate-y-0">
          <button className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-blue-600 transition-all shadow-lg">
            <Smile size={18} />
          </button>
          <button className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-blue-600 transition-all shadow-lg">
            <Hash size={18} />
          </button>
        </div>
      </div>
      
      {contentIssues.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          {contentIssues.map((issue, idx) => (
            <span key={idx} className="text-xs font-medium text-red-400">{issue.message}</span>
          ))}
        </div>
      )}
    </div>
  );
}
