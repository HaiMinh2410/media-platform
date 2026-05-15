'use client'

import React, { useState, useEffect } from 'react';
import { AccountHealthData } from '../../domain/types/platform-account';
import { Settings, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface AccountHealthCardProps {
  account: AccountHealthData;
}

function StatusDot({ status }: { status: 'connected' | 'error' | 'warning' }) {
  return (
    <div className="relative flex h-3 w-3">
      {status === 'error' ? (
        <span className="absolute inline-flex h-full w-full rounded-full bg-error animate-pulse-red"></span>
      ) : status === 'warning' ? (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
      ) : (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-20"></span>
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-3 w-3 shadow-sm",
        status === 'connected' ? "bg-success" : status === 'warning' ? "bg-warning" : "bg-error"
      )}></span>
    </div>
  );
}

function ResponseRateBar({ rate }: { rate: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const color = rate >= 80 ? 'bg-success' : rate >= 50 ? 'bg-warning' : 'bg-error';
  const textColor = rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-error';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between text-[10px] font-black text-base-content/30 uppercase tracking-widest">
        <span>Response Rate</span>
        <span className={cn(textColor)}>
          {rate}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-base-200 rounded-full overflow-hidden border border-base-content/5 shadow-inner">
        <div
          className={cn("h-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]", color)}
          style={{ width: mounted ? `${rate}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function AccountHealthCard({ account }: AccountHealthCardProps) {
  const isError = account.status === 'error';
  const isWarning = account.status === 'warning';

  return (
    <div className={cn(
      "group bg-base-100/60 backdrop-blur-sm rounded-3xl border p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
      isError ? "border-error/30 bg-error/5 shadow-sm" : isWarning ? "border-warning/40 shadow-sm" : "border-base-content/5"
    )}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
            account.platform === 'facebook' ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-pink-500/20"
          )}>
            {account.platform === 'facebook' ? <Icon name="facebook" size={24} /> : <Icon name="instagram" size={24} />}
          </div>
          <div className="flex flex-col">
            <h3 className="font-black text-base leading-tight truncate max-w-[140px] text-base-content/90">{account.platform_user_name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black text-base-content/20 uppercase tracking-widest">{account.platform}</span>
              {account.isNew && (
                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full border border-primary/20">NEW</span>
              )}
            </div>
          </div>
        </div>
        <StatusDot status={account.status} />
      </div>

      <div className="flex-grow">
        {isError ? (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-center gap-2 text-error text-[11px] font-black bg-error/10 px-4 py-3 rounded-2xl border border-error/20 animate-pulse">
              <Icon lucide={AlertCircle} size={14} />
              <span>{account.errorReason || "Disconnected"}</span>
            </div>
            {account.tokenExpiresAt && (
              <p className="text-[10px] font-bold text-base-content/40 px-2 uppercase tracking-tight">
                Inactive for {formatDistanceToNow(new Date(account.tokenExpiresAt))}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ResponseRateBar rate={account.responseRate} />
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-base-content/30 uppercase tracking-widest">Last Activity</span>
                <span className="text-xs font-black text-base-content/60">
                  {account.lastActiveAt ? formatDistanceToNow(new Date(account.lastActiveAt)) + " ago" : "No activity"}
                </span>
              </div>
              {account.pendingCount > 0 && (
                <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg shadow-orange-500/30 animate-bounce">
                  {account.pendingCount} PENDING
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        {isError ? (
          <Link
            href="/dashboard/settings/accounts"
            className="flex-grow bg-error text-error-content py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-error/20"
          >
            <Icon lucide={RefreshCw} size={16} />
            RECONNECT NOW
          </Link>
        ) : (
          <>
            <Link
              href={`/dashboard/inbox?account=${account.id}`}
              className="flex-grow bg-base-200/80 hover:bg-primary hover:text-primary-content text-base-content py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all border border-base-content/5 shadow-sm"
            >
              Open Inbox
              <Icon lucide={ChevronRight} size={16} />
            </Link>
            <Link 
              href="/dashboard/settings/accounts" 
              className="p-3.5 bg-base-200/80 hover:bg-base-300 rounded-2xl active:scale-95 transition-all border border-base-content/5 shadow-sm"
            >
              <Icon lucide={Settings} size={18} className="text-base-content/40" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export function AccountHealthGrid({
  accounts
}: {
  accounts: AccountHealthData[]
}) {
  if (accounts.length === 0) {
    return (
      <div className="bg-base-200/50 rounded-2xl border-2 border-dashed border-base-300 p-12 text-center">
        <p className="text-base-content/50 font-medium">No accounts found in this workspace.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar -mx-6 px-6">
      {accounts.map(acc => (
        <div key={acc.id} className="w-[340px] shrink-0">
          <AccountHealthCard
            account={acc}
          />
        </div>
      ))}
    </div>
  );
}
