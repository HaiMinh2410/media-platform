'use client';

import React from 'react';
import { Calendar, Clock, Send, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatetimePicker } from '@/components/ui/datetime-picker';

type SchedulingPanelProps = {
  scheduledAt: Date | null;
  onChange: (date: Date | null) => void;
  isSubmitting: boolean;
  onPublish: () => void;
};

export function SchedulingPanel({ scheduledAt, onChange, isSubmitting, onPublish }: SchedulingPanelProps) {
  const isScheduled = !!scheduledAt;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Publishing</h3>
        <div className="flex bg-slate-900/40 rounded-2xl p-1.5 border border-white/5 shadow-inner">
          <button
            onClick={() => onChange(null)}
            className={cn(
              "px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
              !isScheduled ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Now
          </button>
          <button
            onClick={() => onChange(new Date(Date.now() + 60 * 60 * 1000))}
            className={cn(
              "px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
              isScheduled ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Schedule
          </button>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <DatetimePicker 
            value={scheduledAt} 
            onChange={onChange} 
          />
          <p className="text-[10px] text-slate-500 px-1 italic">
            Bài viết sẽ được tự động đăng vào thời gian đã chọn.
          </p>
        </div>
      )}

      <button
        onClick={onPublish}
        disabled={isSubmitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all shadow-xl shadow-primary/10",
          isSubmitting 
            ? "bg-background-tertiary text-foreground-tertiary cursor-not-allowed" 
            : "bg-primary hover:brightness-110 text-primary-content hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            Processing...
          </>
        ) : isScheduled ? (
          <>
            <Clock size={18} />
            Schedule Post
          </>
        ) : (
          <>
            <Zap size={18} />
            Publish Now
          </>
        )}
      </button>
    </div>
  );
}
