'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SendButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSending?: boolean;
  size?: number;
  iconClassName?: string;
  duration?: number; // Tailwind transition duration value (e.g. 150, 200, 300, 500), default is 200
}

export function SendButton({
  isSending = false,
  size = 16,
  className,
  iconClassName,
  disabled,
  type = 'submit',
  duration = 200,
  ...props
}: SendButtonProps) {
  // Map numerical duration to Tailwind class (e.g. duration-200)
  const durationClass = `duration-${duration}`;

  const isDisabled = disabled || isSending;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "relative transition-all shrink-0 flex items-center justify-center cursor-pointer group",
        durationClass,
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      <Send
        size={size}
        className={cn(
          "transition-all",
          durationClass,
          // When hovering the button, rotate the send icon 45 degrees, change to primary color and fill it with primary (if not disabled)
          !isDisabled && "group-hover:rotate-45 group-hover:text-primary group-hover:fill-primary",
          iconClassName
        )}
      />
    </button>
  );
}
