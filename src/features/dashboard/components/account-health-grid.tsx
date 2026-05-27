"use client";

import React from "react";
import { AccountHealthData } from "@features/settings";
import {
  Settings,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Link2,
  MessageSquare,
  MessageCircle,
  Zap,
} from "lucide-react";
import { Icon } from "@shared/ui/icon";
import { cn } from "@shared/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RangeSelector } from "@shared/ui/range-selector";
import { ErrorBoundary, SectionError } from "./error-boundary";

// ==========================================
// 1. STATS STRIP COMPONENT (Left Panel - 4/12)
// ==========================================

interface StatItemProps {
  label: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  variant?: "primary" | "default";
  icon?: React.ReactNode;
  labelPosition?: "top-right" | "bottom-left";
}

const parseTrend = (trendStr: string) => {
  if (!trendStr) return { value: "", label: "" };

  if (trendStr.startsWith("↑") || trendStr.startsWith("↓")) {
    const parts = trendStr.split(" ");
    if (parts.length >= 2) {
      const value = `${parts[0]} ${parts[1]}`;
      const label = parts.slice(2).join(" ");
      return { value, label };
    }
  }

  const firstSpaceIndex = trendStr.indexOf(" ");
  if (firstSpaceIndex !== -1) {
    const value = trendStr.substring(0, firstSpaceIndex);
    const label = trendStr.substring(firstSpaceIndex + 1);
    return { value, label };
  }

  return { value: trendStr, label: "" };
};

function StatItem({
  label,
  value,
  trend,
  isPositive,
  variant = "default",
  labelPosition = "bottom-left",
}: StatItemProps) {
  const hasTrend = !!trend;
  const { value: trendVal, label: trendLabel } = parseTrend(trend || "");

  if (variant === "primary") {
    return (
      <div
        className="p-5 bg-linear-to-br from-[#064e3b] via-[#022c22] to-[#01251b] border-b border-emerald-500/20 flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-emerald-950/20 group hover:border-emerald-500/40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Glow hiệu ứng mờ bên trong card */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none transition-all duration-500 group-hover:scale-125" />

        <div className="flex justify-end mb-4 w-full text-xs font-black tracking-widest text-emerald-500/60 uppercase font-mono mt-1">
          {label}
        </div>

        <div className="block text-6xl font-mono tracking-tight text-emerald-300 group-hover:translate-x-1 transition-transform duration-300">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    );
  }

  // default variant
  return (
    <div className="p-5 bg-base-200/40 border-b border-base-content/5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:bg-base-200/70 hover:border-base-content/10 group">
      {/* Lưới ô vuông mờ cho các card phụ */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 5%, black 100%)",
          maskImage: "linear-gradient(to right, transparent 5%, black 100%)",
        }}
      />
      <div className="flex justify-end text-right">
        {labelPosition === "top-right" ? (
          <span className="text-xs mb-4 font-bold tracking-widest text-base-content/30 uppercase font-mono mt-1">
            {label}
          </span>
        ) : (
          hasTrend && (
            <div className="flex flex-col items-end text-right shrink-0">
              <span
                className={`text-sm font-black transition-all duration-300 ${
                  isPositive
                    ? "text-success/90 group-hover:text-success"
                    : "text-error/90 group-hover:text-error"
                }`}
              >
                {trendVal}
              </span>
              {trendLabel && (
                <span className="text-2xs font-bold text-base-content/30 uppercase tracking-wider mt-0.5 font-mono">
                  {trendLabel}
                </span>
              )}
            </div>
          )
        )}
      </div>

      {/* Số lớn và nhãn ở dưới */}
      <div className="flex flex-col">
        <span className="text-5xl font-mono font-normal tracking-tight text-base-content group-hover:translate-x-1 transition-transform duration-300">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {labelPosition !== "top-right" && (
          <span className="text-xs font-bold tracking-widest text-base-content/30 uppercase font-mono mt-1.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatsPanelProps {
  stats: {
    connected: { value: number; trend: string; isPositive: boolean };
    messages: { value: number; trend: string; isPositive: boolean };
    conversations: { value: number; trend: string; isPositive: boolean };
    webhooks: { value: number; trend: string; isPositive: boolean };
  };
}

function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="w-full h-full flex flex-col gap-5 relative overflow-hidden">
      
      {/* Body: Danh sách các chỉ số xếp dọc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 border border-base-content/5 rounded-xl overflow-hidden flex-1">
        <StatItem
          label="Connected Accounts"
          value={stats.connected.value}
          variant="primary"
          icon={<Link2 size={20} />}
        />
        <StatItem
          label="Conversations"
          value={stats.conversations.value}
          trend={stats.conversations.trend}
          isPositive={stats.conversations.isPositive}
          icon={<MessageCircle size={18} />}
          labelPosition="top-right"
        />
        <StatItem
          label="Total Messages"
          value={stats.messages.value}
          trend={stats.messages.trend}
          isPositive={stats.messages.isPositive}
          icon={<MessageSquare size={18} />}
        />
        <StatItem
          label="Webhook Events"
          value={stats.webhooks.value}
          trend={stats.webhooks.trend}
          isPositive={stats.webhooks.isPositive}
          icon={<Zap size={18} />}
        />
      </div>
    </div>
  );
}

// ==========================================
// 2. ACCOUNT HEALTH LIST (Right Panel - 8/12)
// ==========================================

interface AccountHealthRowProps {
  account: AccountHealthData;
}

function AccountHealthRow({ account }: AccountHealthRowProps) {
  const isError = account.status === "error";
  const hasPending = account.pendingCount > 0;
  const firstChar = account.platform_user_name?.charAt(0).toUpperCase() || "A";

  const rateColor =
    account.responseRate >= 80
      ? "text-success"
      : account.responseRate >= 50
        ? "text-warning"
        : "text-error";
  const dotColor =
    account.responseRate >= 80
      ? "bg-success"
      : account.responseRate >= 50
        ? "bg-warning"
        : "bg-error";

  const rowClass = cn(
    "grid grid-cols-12 gap-2 items-center p-3 transition-all duration-300",
    isError
      ? "bg-error/5 hover:bg-error/8"
      : hasPending
        ? "bg-warning/5 hover:bg-warning/8"
        : "bg-success/8 hover:bg-success/10",
  );

  return (
    <div className={rowClass}>
      {/* Cột 1: Avatar + Tên tài khoản */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded-full bg-linear-to-tr from-primary/10 to-secondary/15 flex items-center justify-center font-bold text-base-content text-sm border border-base-content/5 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
          {firstChar}
          <span
            className={cn(
              "absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-2xs text-white border-2 border-base-100 shadow-xs shrink-0",
              account.platform === "facebook" ? "bg-facebook" : "bg-instagram",
            )}
          >
            {account.platform === "facebook" ? (
              <Icon name="facebook" size={8} />
            ) : (
              <Icon name="instagram" size={8} />
            )}
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
        <span className={cn("text-sm font-bold shrink-0", rateColor)}>
          {account.responseRate}%
        </span>
        <span className="text-xs font-semibold text-base-content/30 hidden sm:inline shrink-0">
          Phản hồi
        </span>
      </div>

      {/* Cột 3: Last Activity & Trạng thái */}
      <div className="col-span-3 flex items-center justify-center gap-3 shrink-0">
        {isError ? (
          <div className="flex items-center gap-3">
            <span className="badge badge-error badge-soft font-bold text-3xs sm:text-2xs gap-1 py-1 px-2.5">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Mất kết nối
            </span>
            {account.tokenExpiresAt && (
              <span className="text-2xs font-semibold text-base-content/40 hidden md:inline">
                Hết hạn {formatDistanceToNow(new Date(account.tokenExpiresAt))}{" "}
                trước
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-base-content/50 hidden md:inline">
              {account.lastActiveAt
                ? formatDistanceToNow(new Date(account.lastActiveAt)) + " trước"
                : "Không có hoạt động"}
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
      <div className="col-span-1 flex items-center justify-end gap-2 shrink-0">
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
          </>
        )}
      </div>
    </div>
  );
}

interface AccountHealthListProps {
  accounts: AccountHealthData[];
}

function AccountHealthList({ accounts }: AccountHealthListProps) {
  const [sortBy, setSortBy] = React.useState<"platform" | "status" | "a-z">(
    "status",
  );

  if (accounts.length === 0) {
    return (
      <div className="bg-base-100 rounded-2xl border border-dashed border-base-content/5 p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
        <p className="text-base-content/50 font-medium">
          No accounts found in this workspace.
        </p>
      </div>
    );
  }

  const attentionCount = accounts.filter(
    (acc) => acc.status === "error" || acc.pendingCount > 0,
  ).length;

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortBy === "status") {
      const scoreA =
        (a.status === "error" ? 100 : 0) + (a.pendingCount > 0 ? 50 : 0);
      const scoreB =
        (b.status === "error" ? 100 : 0) + (b.pendingCount > 0 ? 50 : 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      if (a.platform === "instagram" && b.platform !== "instagram") return -1;
      if (b.platform === "instagram" && a.platform !== "instagram") return 1;
      return 0;
    }
    if (sortBy === "platform") {
      if (a.platform === "instagram" && b.platform !== "instagram") return -1;
      if (b.platform === "instagram" && a.platform !== "instagram") return 1;
      return a.platform.localeCompare(b.platform);
    }
    if (sortBy === "a-z") {
      return a.platform_user_name.localeCompare(b.platform_user_name);
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-5 w-full h-full relative overflow-hidden">
      {/* Aurora glow effect */}
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      {/* Header Bento Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-base-content/5 pb-4 gap-4 lg:h-[56px] shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-base-content uppercase font-brand">
            Account Health Command Center
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {attentionCount > 0 && (
            <span className="text-xs text-error/80 px-2.5 py-1 flex items-center gap-1 shrink-0">
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

      {/* Body: Danh sách tài khoản dạng Hàng Ngang với scroll */}
      <div className="flex flex-col border border-base-content/5 divide-y divide-base-content/5 overflow-hidden rounded-md overflow-y-auto pr-1 flex-1 min-h-0 max-h-[400px] lg:max-h-none">
        {sortedAccounts.map((acc) => (
          <AccountHealthRow key={acc.id} account={acc} />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN EXPORTED COMPONENT (Combined Grid)
// ==========================================

interface AccountHealthGridProps {
  accounts: AccountHealthData[];
  stats: {
    connected: { value: number; trend: string; isPositive: boolean };
    messages: { value: number; trend: string; isPositive: boolean };
    conversations: { value: number; trend: string; isPositive: boolean };
    webhooks: { value: number; trend: string; isPositive: boolean };
  };
}

export function AccountHealthGrid({ accounts, stats }: AccountHealthGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-base-content/5 items-stretch w-full gap-6 lg:gap-0 relative">
      {/* Stats Panel (Left 4 columns) */}
      <div className="lg:col-span-4 lg:pr-5 flex flex-col h-full">
        <ErrorBoundary name="Stats Strip">
          <StatsPanel stats={stats} />
        </ErrorBoundary>
      </div>

      {/* Account Health Command Center (Right 8 columns) */}
      <div className="lg:col-span-8 lg:pl-5 flex flex-col h-full relative min-h-[350px] lg:min-h-0">
        <ErrorBoundary
          fallback={<SectionError title="Account Health Command Center" />}
        >
          <div className="lg:absolute lg:inset-0 lg:pl-5 flex flex-col h-full w-full">
            <AccountHealthList accounts={accounts} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
