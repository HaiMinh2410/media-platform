'use client';

import React from 'react';

type ContextProps = {
  platform: string;
  externalId: string;
  lastMessageAt: Date;
  pageName: string;
  customerName?: string;
};

export function ConversationContext({ platform, externalId, lastMessageAt, pageName, customerName }: ContextProps) {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 px-1">Conversation Details</h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">Sender Name</span>
            <span className="text-sm font-medium text-white">{customerName || 'Syncing...'}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">Platform</span>
            <span className="text-sm font-medium text-white capitalize">{platform}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">External ID</span>
            <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded leading-none">{externalId}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">Last Message</span>
            <span className="text-sm font-medium text-white" suppressHydrationWarning>
              {new Date(lastMessageAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 px-1">Account Context</h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">Connected Account</span>
            <span className="text-sm font-medium text-white">{pageName}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs text-white/50">Status</span>
            <span className="text-sm font-bold text-emerald-400">Active</span>
          </div>
        </div>
      </div>
    </>
  );
}
