'use client';

import React from 'react';
import { Calendar, Clock, Send, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground-tertiary">Publishing</h3>
        <div className="flex bg-background-tertiary/40 rounded-2xl p-1.5 border border-foreground/5 shadow-inner">
          <button
            onClick={() => onChange(null)}
            className={cn(
              "px-5 py-2.5 text-11 font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
              !isScheduled ? "bg-primary text-primary-content shadow-lg shadow-primary/30" : "text-foreground-tertiary hover:text-foreground-secondary"
            )}
          >
            Now
          </button>
          <button
            onClick={() => onChange(new Date(Date.now() + 24 * 60 * 60 * 1000))}
            className={cn(
              "px-5 py-2.5 text-11 font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
              isScheduled ? "bg-primary text-primary-content shadow-lg shadow-primary/30" : "text-foreground-tertiary hover:text-foreground-secondary"
            )}
          >
            Schedule
          </button>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={16} />
            <input
              type="datetime-local"
              value={scheduledAt.toISOString().slice(0, 16)}
              onChange={(e) => onChange(new Date(e.target.value))}
              className="w-full bg-background-tertiary border border-foreground/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
          <p className="text-2xs text-foreground-tertiary px-1">
            Post will be automatically published at the selected time.
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
