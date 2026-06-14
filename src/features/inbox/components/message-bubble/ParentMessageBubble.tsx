import { cn } from "@shared/lib";

import React from 'react';
import { Paperclip } from 'lucide-react';
import { MessageWithSender } from '@features/inbox/types';

interface ParentMessageBubbleProps {
  parent: MessageWithSender;
  onScrollToParent: () => void;
  isUser: boolean;
}

export function ParentMessageBubble({
  parent,
  onScrollToParent,
  isUser,
}: ParentMessageBubbleProps) {
  const hasContent = !!parent.content;

  return (
    <div 
      onClick={onScrollToParent}
      className={cn(
        "w-fit p-2 px-3.5 text-xs leading-relaxed cursor-pointer transition-all duration-200 select-none max-w-60 border-none",
        "opacity-55 hover:opacity-85 active:scale-[0.98]",
        "rounded-2xl",
        "bg-foreground/8 text-foreground/70 backdrop-blur-[0.5px]",
        isUser ? "rounded-bl-sm" : "rounded-br-sm"
      )}
    >
      <div className={cn(
        "flex items-center gap-1.5",
        !hasContent && "italic text-foreground/60"
      )}>
        {!hasContent && <Paperclip size={12} className="shrink-0 opacity-70" />}
        <span className="line-clamp-2 wrap-break-word">
          {parent.content || 'File đính kèm'}
        </span>
      </div>
    </div>
  );
}
