'use client';

import { DatetimePicker } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { Calendar, Clock, Send, Zap } from "lucide-react";

type SchedulingPanelProps = {
  scheduledAt: Date | null;
  onChange: (date: Date | null) => void;
  isSubmitting: boolean;
  onPublish: () => void;
  selectedAccountCount: number;
};

export function SchedulingPanel({
  scheduledAt,
  onChange,
  isSubmitting,
  onPublish,
  selectedAccountCount,
}: SchedulingPanelProps) {
  const isScheduled = !!scheduledAt;

  return (
    <div className="bg-base-100 border border-base-content/5 shadow-md rounded-2xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 font-mono">
           PHÂN PHỐI
        </h3>
        <div className="join bg-base-200 p-1 border border-base-content/5 rounded-xl">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "join-item btn btn-sm rounded-lg border-0 transition-all duration-200 cursor-pointer uppercase tracking-wider text-2xs font-extrabold px-4",
              !isScheduled
                ? "bg-primary text-primary-content hover:bg-primary/95 shadow-xs"
                : "btn-ghost text-base-content/50 hover:text-base-content",
            )}
          >
            Đăng ngay
          </button>
          <button
            type="button"
            onClick={() => onChange(new Date(Date.now() + 60 * 60 * 1000))}
            className={cn(
              "join-item btn btn-sm rounded-lg border-0 transition-all duration-200 cursor-pointer uppercase tracking-wider text-2xs font-extrabold px-4",
              isScheduled
                ? "bg-primary text-primary-content hover:bg-primary/95 shadow-xs"
                : "btn-ghost text-base-content/50 hover:text-base-content",
            )}
          >
            Lên lịch
          </button>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <DatetimePicker value={scheduledAt} onChange={onChange} />
          <p className="text-2xs text-base-content/50 px-1 italic">
            Bài viết sẽ được tự động đăng vào thời gian đã chọn.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPublish}
          disabled={isSubmitting}
          className={cn(
            "btn btn-primary rounded-xl flex-1 h-12 font-bold text-lg shadow-md hover:-translate-y-0.5 transition-all cursor-pointer",
            isSubmitting && "btn-disabled",
          )}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Đang xử lý...
            </>
          ) : isScheduled ? (
            <>
              <Clock size={18} />
              Lên lịch đăng
              {selectedAccountCount > 0 && (
                <span className="bg-primary-content text-primary size-5 rounded-full flex items-center justify-center text-xs font-bold ml-1.5 shadow-sm">
                  {selectedAccountCount}
                </span>
              )}
            </>
          ) : (
            <>
              Đăng ngay
              {selectedAccountCount > 0 && (
                <span className="bg-primary-content text-primary size-5 rounded-full flex items-center justify-center text-xs font-bold ml-1.5 shadow-sm">
                  {selectedAccountCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
