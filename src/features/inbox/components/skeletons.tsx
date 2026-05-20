'use client';

import React from 'react';

export function ConversationSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl">
      <div className="w-11 h-11 rounded-full bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col p-6 gap-4">
      <div className="h-10 w-3/5 bg-white/5 animate-pulse rounded-xl self-start" />
      <div className="h-10 w-[45%] bg-accent-primary/10 animate-pulse rounded-xl self-end" />
      <div className="h-10 w-[70%] bg-white/5 animate-pulse rounded-xl self-start" />
      <div className="h-10 w-2/5 bg-accent-primary/10 animate-pulse rounded-xl self-end" />
    </div>
  );
}
