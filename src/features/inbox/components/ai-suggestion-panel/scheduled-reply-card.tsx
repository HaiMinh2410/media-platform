'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

type ScheduledReplyCardProps = {
  scheduledReply: {
    replyText: string;
    scheduledAt: string;
  };
  timeLeft: string;
  onUse: (text: string) => void;
  onCancel: () => Promise<void>;
  isCancelling: boolean;
};

export function ScheduledReplyCard({
  scheduledReply,
  timeLeft,
  onUse,
  onCancel,
  isCancelling,
}: ScheduledReplyCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
      
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={12} className="text-teal-400" /> Hẹn giờ gửi
        </span>
        <span className="font-mono text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-2xs animate-pulse">
          {timeLeft || 'đang gửi...'}
        </span>
      </div>
      
      <p className="text-xs text-foreground-secondary leading-relaxed m-0 italic z-10">
        "{scheduledReply.replyText}"
      </p>

      <div className="flex gap-2 mt-1 z-10">
        <button
          onClick={() => onUse(scheduledReply.replyText)}
          className="flex-1 bg-accent-primary text-foreground py-1.5 rounded-lg text-2xs font-bold transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Dùng tin nhắn
        </button>
        <button
          onClick={onCancel}
          className="py-1.5 px-3 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-lg text-2xs font-bold transition-all hover:bg-rose-500/25 disabled:opacity-50"
          disabled={isCancelling}
        >
          {isCancelling ? 'Đang hủy...' : 'Hủy gửi'}
        </button>
      </div>
    </div>
  );
}
