import React from 'react';

export default function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-foreground-secondary text-center">
      <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-[var(--accent-gradient)] shadow-[0_0_30px_rgba(99,102,241,0.4)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <polyline points="22 7 12 14 2 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2 font-brand tracking-tight">Pulse Inbox</h3>
      <p className="opacity-70 text-base max-w-[400px]">Your synchronized message hub. Select a conversation to start engaging.</p>
      <div className="mt-8 flex gap-2">
        <div className="glass px-4 py-2 rounded-[20px] text-[0.8rem]">Meta</div>
        <div className="glass px-4 py-2 rounded-[20px] text-[0.8rem]">Instagram</div>
        <div className="glass px-4 py-2 rounded-[20px] text-[0.8rem]">TikTok</div>
      </div>
    </div>
  );
}
