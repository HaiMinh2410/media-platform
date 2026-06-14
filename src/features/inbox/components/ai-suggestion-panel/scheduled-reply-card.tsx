'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { PortalTooltip } from '@shared/ui';

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
  const headerRef = React.useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="card bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all duration-500" />
      
      <div className="flex items-center justify-between z-10">
        <span 
          ref={headerRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5 cursor-help hover:text-success/80 transition-colors select-none"
        >
          <Calendar size={12} className="text-success" /> Hẹn giờ gửi
        </span>
        <span className="font-mono text-success font-black bg-success/10 border border-success/20 px-2 py-0.5 rounded text-2xs animate-pulse">
          {timeLeft || 'đang gửi...'}
        </span>
      </div>
      
      <p className="text-xs text-base-content/70 leading-relaxed m-0 italic z-10">
        "{scheduledReply.replyText}"
      </p>

      <div className="flex gap-2 mt-1 z-10">
        <button
          onClick={() => onUse(scheduledReply.replyText)}
          className="btn btn-primary btn-sm flex-1"
        >
          Dùng tin nhắn
        </button>
        <button
          onClick={onCancel}
          className="btn btn-error btn-soft btn-sm"
          disabled={isCancelling}
        >
          {isCancelling && <span className="loading loading-spinner loading-xs" />}
          {isCancelling ? 'Đang hủy...' : 'Hủy gửi'}
        </button>
      </div>

      {showTooltip && (
        <PortalTooltip
          active={showTooltip}
          anchorRef={headerRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-2xs font-bold text-success uppercase tracking-wider">Hẹn giờ gửi (Scheduled Reply):</span>
            <p className="text-xs text-base-content/85 leading-normal">
              Tin nhắn tự động được xếp hàng đợi (BullMQ) và sẽ gửi sau khoảng trễ ngẫu nhiên để mô phỏng chính xác hành vi gõ phím tự nhiên của con người.
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}
