'use client';

import React, { memo } from 'react';
import { MessageWithSender } from '@/domain/types/messaging';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MessageBubble = memo(function MessageBubble({ 
  message, 
  showStatus = false 
}: { 
  message: MessageWithSender;
  showStatus?: boolean;
}) {
  const isUser = message.senderType === 'user';
  const isAi = message.senderType === 'ai';
  const isAgent = message.senderType === 'agent';

  return (
    <div 
      id={`msg-${message.id}`} 
      className={cn(
        "flex mb-4 max-w-full",
        isUser ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex flex-col max-w-[80%] gap-1",
        isUser ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "w-fit p-[12px_18px] rounded-[20px] shadow-md flex flex-col gap-1 relative break-words transition-all hover:-translate-y-px hover:shadow-lg",
          isUser && "bg-background-secondary border border-foreground/10 rounded-bl-sm text-foreground",
          isAgent && "bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-br-sm text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]",
          isAi && "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/40 rounded-br-sm text-foreground shadow-[0_4px_20px_rgba(168,85,247,0.15)] backdrop-blur-md"
        )}>
          {isAi && (
            <div className="flex items-center gap-1 text-[0.6875rem] font-bold uppercase text-purple-400 mb-1">
              <Sparkles size={12} className="text-purple-400" />
              <span>AI Auto-Reply</span>
            </div>
          )}
          <div className="text-[0.9375rem] leading-normal whitespace-pre-wrap">
            {message.content}
          </div>
        </div>

        {showStatus && (
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-[0.75rem] text-foreground-tertiary opacity-80">
              {message.is_read ? 'Đã xem' : (message.is_delivered ? 'Đã gửi' : 'Đang gửi...')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
