'use client';

import React from 'react';
import type { AiSuggestion } from '@/domain/types/messaging';
import { cn } from '@/lib/utils';
import { Zap, Info, X, Loader2, Sparkles, Clock } from 'lucide-react';

type Props = {
  suggestions: AiSuggestion[];
  tags: string[];
  priority: string | null;
  sentiment: string | null;
  loading: boolean;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
  onUpdateTags?: (tags: string[]) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateSentiment?: (sentiment: string) => void;
};

function formatModel(model: string): string {
  if (model.includes('llama-3.3-70b')) return 'LLaMA 3.3 70B';
  if (model.includes('llama-3.1-8b')) return 'LLaMA 3.1 8B';
  if (model.includes('qwen-qwq-32b')) return 'Qwen3 32B';
  if (model.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
  return model;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function SuggestionCard({ suggestion, onUse, onDismiss }: {
  suggestion: AiSuggestion;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-foreground/[0.05] hover:border-foreground/10 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[0.75rem] font-bold text-accent-primary">
          <Zap size={12} fill="currentColor" />
          <span>AI Reply</span>
          <span className="bg-accent-primary/10 px-1.5 py-0.5 rounded text-[0.625rem] font-bold uppercase tracking-wider">
            {formatModel(suggestion.model)}
          </span>
        </div>
        <span className="text-[0.65rem] text-foreground-tertiary flex items-center gap-1">
          <Clock size={10} />
          {timeAgo(suggestion.createdAt)}
        </span>
      </div>

      <p className="text-[0.875rem] text-foreground-secondary leading-relaxed m-0 italic">
        "{suggestion.response}"
      </p>

      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex-1 bg-accent-primary text-white py-2 rounded-lg text-[0.8125rem] font-bold transition-all hover:brightness-110 active:scale-[0.98]"
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

export function AiSuggestionPanel({ 
  suggestions, 
  tags, 
  priority, 
  sentiment, 
  loading, 
  onUse, 
  onDismiss,
  onUpdateTags,
  onUpdatePriority,
  onUpdateSentiment
}: Props) {
  const visible = suggestions.slice(0, 5);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) {
        onUpdateTags?.([...tags, newTag]);
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateTags?.(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex flex-col h-full bg-base-200 text-foreground">
      {/* --- Insights Section --- */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-[0.875rem] font-bold text-foreground uppercase tracking-wider">
            <Sparkles size={14} className="text-accent-primary" />
            <span>Phân tích hội thoại</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.7rem] font-bold text-foreground-tertiary uppercase tracking-wider">Độ ưu tiên</span>
            <select 
              className={cn(
                "bg-background-secondary border border-foreground/10 rounded-md p-2 text-[0.8125rem] text-foreground outline-none transition-all focus:border-accent-primary appearance-none cursor-pointer",
                priority === 'high' && "text-red-400 border-red-500/30 bg-red-500/5",
                priority === 'medium' && "text-amber-400 border-amber-500/30 bg-amber-500/5",
                priority === 'low' && "text-blue-400 border-blue-500/30 bg-blue-500/5"
              )}
              value={priority || 'none'}
              onChange={(e) => onUpdatePriority?.(e.target.value)}
            >
              <option value="none">Trống</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.7rem] font-bold text-foreground-tertiary uppercase tracking-wider">Sắc thái</span>
            <select 
              className="bg-background-secondary border border-foreground/10 rounded-md p-2 text-[0.8125rem] text-foreground outline-none transition-all focus:border-accent-primary appearance-none cursor-pointer"
              value={sentiment || 'neutral'}
              onChange={(e) => onUpdateSentiment?.(e.target.value)}
            >
              <option value="positive">Tích cực 😊</option>
              <option value="neutral">Bình thường 😐</option>
              <option value="frustrated">Khó chịu 😠</option>
              <option value="negative">Tiêu cực 😟</option>
            </select>
          </div>
        </div>

        <div className="mt-1">
          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-md text-[0.75rem] text-accent-primary font-medium">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
            <input 
              className="bg-transparent border-none outline-none text-[0.75rem] text-foreground-secondary placeholder:text-foreground-tertiary w-24 p-1" 
              placeholder="+ Thêm nhãn..." 
              onKeyDown={handleAddTag}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-foreground/5 mx-4 my-2" />

      {/* --- Suggestions Section --- */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[0.875rem] font-bold text-foreground uppercase tracking-wider">
          <Zap size={14} className="text-accent-primary" />
          <span>Gợi ý phản hồi AI</span>
        </div>
        {visible.length > 0 && (
          <span className="bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold">
            {visible.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-foreground/10">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                <div className="h-3 bg-foreground/5 rounded w-1/3" />
                <div className="h-4 bg-foreground/5 rounded w-full" />
                <div className="h-4 bg-foreground/5 rounded w-4/5" />
              </div>
            ))}
            <div className="flex items-center justify-center py-5 text-foreground-tertiary text-[0.8125rem] gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Đang tạo phản hồi...</span>
            </div>
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-foreground-tertiary gap-3">
            <Info size={24} />
            <p className="text-[0.875rem] italic">Chưa có gợi ý nào</p>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="flex flex-col gap-4">
            {visible.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onUse={onUse}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
