'use client';

import React, { useState, useEffect } from 'react';
import { Pin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MessageWithSender } from '@features/inbox/types';

type PinnedMessageBannerProps = {
  pinnedMessages: MessageWithSender[];
  onJumpToMessage: (id: string) => void;
  onUnpin: (id: string) => void;
  customerName?: string;
};

export function PinnedMessageBanner({
  pinnedMessages,
  onJumpToMessage,
  onUnpin,
  customerName
}: PinnedMessageBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  // Sync activeIndex if it exceeds bounds (e.g. after an unpin action)
  const safeActiveIndex = activeIndex >= pinnedMessages.length 
    ? Math.max(0, pinnedMessages.length - 1) 
    : activeIndex;

  const currentMessage = pinnedMessages[safeActiveIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(() => (safeActiveIndex - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(() => (safeActiveIndex + 1) % pinnedMessages.length);
  };

  return (
    <div 
      className="sticky-pinned-banner sticky top-0 z-10 w-full backdrop-blur-md border-y-2 border-background-secondary px-4.5 py-1.5 flex items-center justify-between gap-3 select-none transition-all duration-300 cursor-pointer"
      onClick={() => onJumpToMessage(currentMessage.id)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground-secondary shrink-0">
          <Pin fill="currentColor" className="rotate-45 size-4.5" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs tracking-wider text-foreground-secondary">
            {currentMessage.senderType === 'user' ? (customerName || 'Khách hàng') : 'Bạn'}
          </span>
          <span className="text-sm text-foreground truncate max-w-full font-semibold">
            {currentMessage.content || 'Ghim tập tin / phương tiện'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {pinnedMessages.length > 1 && (
          <div className="flex items-center gap-1.5 bg-foreground/5 rounded-full p-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/5 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
              title="Tin nhắn ghim trước"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-foreground-tertiary font-bold px-1 select-none">
              {safeActiveIndex + 1}/{pinnedMessages.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/5 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
              title="Tin nhắn ghim tiếp theo"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(currentMessage.id);
          }}
          className="p-1.5 rounded-full text-foreground-tertiary hover:text-error hover:bg-error/10 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
          title="Bỏ ghim tin nhắn này"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
