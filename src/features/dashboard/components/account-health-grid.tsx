'use client'

import React from 'react';
import { AccountHealthData } from '@features/settings';
import { Settings, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import { Icon } from '@shared/ui/icon';
import { cn } from '@shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { RangeSelector } from '@shared/ui/range-selector';

interface AccountHealthRowProps {
  account: AccountHealthData;
}

function AccountHealthRow({ account }: AccountHealthRowProps) {
  const isError = account.status === 'error';
  const hasPending = account.pendingCount > 0;
  const firstChar = account.platform_user_name?.charAt(0).toUpperCase() || 'A';

  // Cột 2: Response Rate màu sắc trạng thái
  const rateColor = account.responseRate >= 80 ? 'text-success' : account.responseRate >= 50 ? 'text-warning' : 'text-error';
  const dotColor = account.responseRate >= 80 ? 'bg-success' : account.responseRate >= 50 ? 'bg-warning' : 'bg-error';

  // Định nghĩa background và border động theo trạng thái của tài khoản
  const rowClass = cn(
    "grid grid-cols-12 gap-4 items-center p-3 transition-all duration-300",
    isError
      ? "bg-error/5 hover:bg-error/8"
      : hasPending
      ? "bg-warning/5 hover:bg-warning/8"
      : "bg-success/8 hover:bg-success/10"
  );

  return (
    <div className={rowClass}>
      {/* Cột 1: Avatar + Tên tài khoản */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded-full bg-linear-to-tr from-primary/10 to-secondary/15 flex items-center justify-center font-bold text-base-content text-sm border border-base-content/5 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
          {firstChar}
          <span className={cn(
            "absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-2xs text-white border-2 border-base-100 shadow-xs shrink-0",
            account.platform === 'facebook' ? "bg-facebook" : "bg-instagram"
          )}>
            {account.platform === 'facebook' ? <Icon name="facebook" size={8} /> : <Icon name="instagram" size={8} />}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="font-bold text-sm leading-tight text-base-content/95 truncate">
            {account.platform_user_name}
          </h4>
          <span className="text-3xs font-bold text-base-content/30 uppercase tracking-widest mt-0.5">
            {account.platform}
          </span>
        </div>
      </div>

      {/* Cột 2: Response Rate */}
      <div className="col-span-2 flex items-center gap-1.5 shrink-0">
        <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
        <span className={cn("text-xs font-mono font-bold shrink-0", rateColor)}>
          {account.responseRate}%
        </span>
        <span className="text-2xs font-bold text-base-content/30 uppercase tracking-widest hidden sm:inline shrink-0">
          Phản hồi
        </span>
      </div>

      {/* Cột 3: Last Activity & Trạng thái */}
      <div className="col-span-4 flex items-center gap-3 shrink-0">
        {isError ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="badge badge-error badge-soft font-bold text-3xs sm:text-2xs gap-1 py-1 px-2.5">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Mất kết nối
            </span>
            {account.tokenExpiresAt && (
              <span className="text-2xs font-semibold text-base-content/40 hidden md:inline">
                Hết hạn {formatDistanceToNow(new Date(account.tokenExpiresAt))} trước
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-base-content/50 hidden md:inline">
              {account.lastActiveAt ? formatDistanceToNow(new Date(account.lastActiveAt)) + " trước" : "Không có hoạt động"}
            </span>
            {account.pendingCount > 0 && (
              <span className="bg-warning text-warning-content px-2 py-0.5 rounded-lg text-2xs font-mono font-black shadow-xs shadow-warning/10">
                {account.pendingCount} PENDING
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cột 4: Nút hành động nhanh */}
      <div className="col-span-2 flex items-center justify-end gap-2 shrink-0">
        {isError ? (
          <Link
            href="/dashboard/settings/accounts"
            title="Kết nối lại tài khoản"
            className="w-8 h-8 rounded-full bg-error/10 hover:bg-error hover:text-error-content flex items-center justify-center text-error border border-error/20 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <>
            <Link
              href={`/dashboard/inbox?account=${account.id}`}
              title="Mở Hộp thư"
              className="w-8 h-8 rounded-full bg-base-200/60 hover:bg-primary hover:text-primary-content flex items-center justify-center text-base-content border border-base-content/5 active:scale-95 transition-all shadow-xs shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dashboard/settings/accounts" 
              title="Cài đặt tài khoản"
              className="w-8 h-8 rounded-full bg-base-200/60 hover:bg-base-300 flex items-center justify-center text-base-content/40 hover:text-base-content border border-base-content/5 active:scale-95 transition-all shadow-xs shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
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
  const [sortBy, setSortBy] = React.useState<'platform' | 'status' | 'a-z'>('status');

  if (accounts.length === 0) {
    return (
      <div className="bg-base-100 rounded-2xl border border-dashed border-base-content/5 p-12 text-center shadow-sm">
        <p className="text-base-content/50 font-medium">No accounts found in this workspace.</p>
      </div>
    );
  }

  // Tính tổng số tài khoản có sự cố (error hoặc pendingCount > 0)
  const attentionCount = accounts.filter(acc => acc.status === 'error' || acc.pendingCount > 0).length;

  // Thực hiện sắp xếp danh sách tài khoản
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortBy === 'status') {
      const scoreA = (a.status === 'error' ? 100 : 0) + (a.pendingCount > 0 ? 50 : 0);
      const scoreB = (b.status === 'error' ? 100 : 0) + (b.pendingCount > 0 ? 50 : 0);
      return scoreB - scoreA; // Lỗi & pending lên hàng đầu
    }
    if (sortBy === 'platform') {
      return a.platform.localeCompare(b.platform);
    }
    if (sortBy === 'a-z') {
      return a.platform_user_name.localeCompare(b.platform_user_name);
    }
    return 0;
  });

  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 shadow-sm flex flex-col gap-5 w-full relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Aurora glow effect */}
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      {/* Header của Bento Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-base-content/5 pb-4 gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-extrabold tracking-tight text-base-content uppercase font-brand">
            Account Health Command Center
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {attentionCount > 0 && (
            <span className="badge badge-error badge-soft font-black text-3xs sm:text-2xs px-2.5 py-1 flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3" />
              {attentionCount} Attention Required
            </span>
          )}

          <RangeSelector
            options={[
              { id: "status", label: "Trạng thái" },
              { id: "platform", label: "Nền tảng" },
              { id: "a-z", label: "Tên A-Z" },
            ]}
            value={sortBy}
            onChange={setSortBy}
            menuAlign="right"
            menuMinWidth="min-w-[170px]"
          />
        </div>
      </div>

      {/* Body: Danh sách tài khoản dạng Hàng Ngang với chiều cao giới hạn và scroll */}
      <div className="flex flex-col divide-y divide-base-content/5 overflow-hidden rounded-md max-h-[380px] overflow-y-auto pr-1">
        {sortedAccounts.map(acc => (
          <AccountHealthRow key={acc.id} account={acc} />
        ))}
      </div>
    </div>
  );
}
