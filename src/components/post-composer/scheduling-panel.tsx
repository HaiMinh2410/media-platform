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
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Publishing Options</h3>
        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => onChange(null)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
              !isScheduled ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Now
          </button>
          <button
            onClick={() => onChange(new Date(Date.now() + 24 * 60 * 60 * 1000))}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
              isScheduled ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Schedule
          </button>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="datetime-local"
              value={scheduledAt.toISOString().slice(0, 16)}
              onChange={(e) => onChange(new Date(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-500 px-1">
            Post will be automatically published at the selected time.
          </p>
        </div>
      )}

      <button
        onClick={onPublish}
        disabled={isSubmitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-900/10",
          isSubmitting 
            ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
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
