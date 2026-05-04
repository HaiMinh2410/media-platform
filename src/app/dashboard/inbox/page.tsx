import React from 'react';
import { Icon } from '@/components/ui/icon';
import { Mail } from 'lucide-react';

export default function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-foreground-secondary text-center">
      <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
        <Icon lucide={Mail} size={32} className="text-primary-content" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2 font-brand tracking-tight">Pulse Inbox</h3>
      <p className="text-foreground-secondary text-base max-w-md">Your synchronized message hub. Select a conversation to start engaging.</p>
      <div className="mt-8 flex gap-2">
        <div className="glass px-4 py-2 rounded-xl text-xs">Meta</div>
        <div className="glass px-4 py-2 rounded-xl text-xs">Instagram</div>
        <div className="glass px-4 py-2 rounded-xl text-xs">TikTok</div>
      </div>
    </div>
  );
}
