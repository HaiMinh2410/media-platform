"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  InboxMetrics,
  getInboxMetrics,
} from "@features/dashboard/actions/dashboard.actions";
import { AccountHealthData } from "@features/settings";
import { cn } from "@shared/lib/utils";
import { RangeSelector } from "@shared/ui/range-selector";

interface InboxMetricsCardProps {
  workspaceId: string;
  accounts: AccountHealthData[];
  initialData?: InboxMetrics;
}

export function InboxMetricsCard({
  workspaceId,
  accounts,
  initialData,
}: InboxMetricsCardProps) {
  const [period, setPeriod] = useState<"24h" | "7d" | "14d" | "30d" | "custom">("24h");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const [metrics, setMetrics] = useState<InboxMetrics | null>(
    initialData || null,
  );
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const fetchMetrics = () => {
    // Skip first fetch if initialData is present and no filters changed from default
    if (
      initialData &&
      !selectedAccountId &&
      period === "24h" &&
      metrics === initialData
    )
      return;

    startTransition(async () => {
      const data = await getInboxMetrics(
        workspaceId,
        selectedAccountId,
        period,
        customStartDate ? new Date(customStartDate) : undefined,
        customEndDate ? new Date(customEndDate) : undefined,
      );
      setMetrics(data);
    });
  };

  useEffect(() => {
    fetchMetrics();
  }, [workspaceId, selectedAccountId, period, customStartDate, customEndDate]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const totalLeads =
    (metrics?.leadDistribution?.hot || 0) +
    (metrics?.leadDistribution?.warm || 0) +
    (metrics?.leadDistribution?.cold || 0);

  return (
    <div className="bg-base-100 rounded-2xl border border-base-content/5 p-6 flex flex-col gap-6 shadow-xs h-full transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-content/5 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2 text-base-content">
            <span className="text-lg">📥</span> Inbox Metrics — Phễu Hội Thoại
            {isPending && (
              <span className="loading loading-spinner loading-xs text-primary"></span>
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown Chọn Tài Khoản */}
          <RangeSelector
            options={[
              {
                id: "all",
                label: "Tất cả tài khoản",
                icon: <span className="text-xs">🌐</span>,
              },
              ...accounts.map((account) => ({
                id: account.id,
                label: account.platform_user_name,
                icon: (
                  <span className="text-xs">
                    {account.platform === "facebook" ? "👤" : "📸"}
                  </span>
                ),
              })),
            ]}
            value={selectedAccountId || "all"}
            onChange={(val) =>
              setSelectedAccountId(val === "all" ? undefined : val)
            }
            menuAlign="right"
            menuMinWidth="w-52"
          />

          {/* Bộ lọc thời gian */}
          <RangeSelector
            options={[
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 ngày" },
              { id: "14d", label: "14 ngày" },
              { id: "30d", label: "30 ngày" },
              { id: "custom", label: "Tùy chỉnh" },
            ]}
            value={period}
            onChange={setPeriod}
            menuAlign="right"
          />
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-3 bg-base-200/40 p-3 rounded-xl border border-base-content/5 -mt-2">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-base-content/50 uppercase font-mono">Từ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="input input-xs input-bordered rounded-lg bg-base-100 font-mono text-[11px] font-semibold text-base-content border-base-content/10 focus:border-primary!"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-base-content/50 uppercase font-mono">Đến:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="input input-xs input-bordered rounded-lg bg-base-100 font-mono text-[11px] font-semibold text-base-content border-base-content/10 focus:border-primary!"
            />
          </div>
        </div>
      )}

      {/* Hàng 1 - Tổng quan nhanh (Quick Stats Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card: Tổng hội thoại */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4.5 flex items-center justify-between shadow-xs transition-all hover:bg-primary/8 hover:scale-[1.01]">
            <span className="text-sm font-semibold text-primary/70">
              Tổng hội thoại
            </span>
          <div className="size-10 flex items-center justify-center text-primary shadow-xs">
            <span className="text-3xl font-black text-primary font-mono leading-none">
              {(metrics?.totalMessages || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card: AI xử lý */}
        <div className="bg-info/5 border border-info/10 rounded-xl p-4.5 flex items-center justify-between shadow-xs transition-all hover:bg-info/8 hover:scale-[1.01]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-info/70">
              AI tự động xử lý
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-info font-mono leading-none">
                {(metrics?.aiHandled || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-info/60 font-mono">
                ({metrics?.aiHandledPct || 0}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info shadow-xs">
            <span className="text-lg">🤖</span>
          </div>
        </div>

        {/* Card: Cần người */}
        <div className="bg-warning/5 border border-warning/10 rounded-xl p-4.5 flex items-center justify-between shadow-xs transition-all hover:bg-warning/8 hover:scale-[1.01]">
          <div className="flex flex-col gap-1">
            <span className="text-2xs font-bold text-warning/70 uppercase tracking-wider">
              Nhân viên hỗ trợ
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-warning font-mono leading-none">
                {(metrics?.humanNeeded || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-warning/60 font-mono">
                ({metrics?.humanNeededPct || 0}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning shadow-xs">
            <span className="text-lg">👤</span>
          </div>
        </div>
      </div>

      {/* Hàng 2 - Khối biểu đồ song song (Metrics Twin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grow">
        {/* Bên trái: Biểu đồ hiệu suất AI vs Con người */}
        <div className="bg-base-200/50 border border-base-content/5 rounded-xl p-5 flex flex-col gap-4.5 justify-between min-h-[220px]">
          <div className="text-2xs font-bold text-base-content/40 uppercase tracking-wider">
            Hiệu suất AI vs Con người
          </div>

          <div className="flex flex-col gap-5 justify-center grow">
            {/* AI Progress */}
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between items-baseline px-0.5">
                <span className="text-sm text-info px-1.5 py-0.5 rounded font-bold">
                  Ai xử lý
                </span>
                <div className="flex items-baseline text-xs text-info font-bold font-mono gap-1">
                  <span>{(metrics?.aiHandled || 0).toLocaleString()}</span>
                  <span>({metrics?.aiHandledPct || 0}%)</span>
                </div>
              </div>
              <div className="w-full h-3 bg-base-300 border border-base-content/10 shadow-inner rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-info transition-all duration-1000 ease-out shadow-xs"
                  style={{
                    width: mounted ? `${metrics?.aiHandledPct || 0}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Human Progress */}
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between items-baseline px-0.5">
                <span className="text-sm text-warning px-1.5 py-0.5 rounded font-bold">
                  Cần người
                </span>
                <div className="flex items-baseline text-xs text-warning font-bold font-mono gap-1">
                  <span>{(metrics?.humanNeeded || 0).toLocaleString()}</span>
                  <span>({metrics?.humanNeededPct || 0}%)</span>
                </div>
              </div>
              <div className="w-full h-3 bg-base-300 border border-base-content/10 shadow-inner rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-warning transition-all duration-1000 ease-out shadow-xs"
                  style={{
                    width: mounted ? `${metrics?.humanNeededPct || 0}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="text-2xs text-base-content/40 font-semibold italic border-t border-base-content/5 pt-3">
            * AI tự động giải quyết hiệu quả {metrics?.aiHandledPct || 0}% hội
            thoại.
          </div>
        </div>

        {/* Bên phải: Phân bổ Lead theo AI Tag */}
        <div className="bg-base-200/50 border border-base-content/5 rounded-xl p-5 flex flex-col gap-4.5 justify-between min-h-[220px]">
          <div className="text-2xs font-bold text-base-content/40 uppercase tracking-wider">
            Phân bổ Lead theo AI Tag
          </div>

          <div className="grid grid-cols-1 gap-3 grow justify-center">
            {/* Hot Lead */}
            <LeadPillCard
              emoji="🔥"
              label="Hot Lead"
              count={metrics?.leadDistribution?.hot || 0}
              percent={
                totalLeads > 0
                  ? Math.round(
                      ((metrics?.leadDistribution?.hot || 0) / totalLeads) *
                        100,
                    )
                  : 0
              }
              colorClass="bg-error"
              badgeColor="text-error bg-error/10 border-error/15"
              mounted={mounted}
            />

            {/* Warm Lead */}
            <LeadPillCard
              emoji="🌡️"
              label="Warm Lead"
              count={metrics?.leadDistribution?.warm || 0}
              percent={
                totalLeads > 0
                  ? Math.round(
                      ((metrics?.leadDistribution?.warm || 0) / totalLeads) *
                        100,
                    )
                  : 0
              }
              colorClass="bg-warning"
              badgeColor="text-warning bg-warning/10 border-warning/15"
              mounted={mounted}
            />

            {/* Cold Lead */}
            <LeadPillCard
              emoji="❄️"
              label="Cold Lead"
              count={metrics?.leadDistribution?.cold || 0}
              percent={
                totalLeads > 0
                  ? Math.round(
                      ((metrics?.leadDistribution?.cold || 0) / totalLeads) *
                        100,
                    )
                  : 0
              }
              colorClass="bg-info"
              badgeColor="text-info bg-info/10 border-info/15"
              mounted={mounted}
            />
          </div>

          <div className="text-2xs text-base-content/40 font-semibold border-t border-base-content/5 pt-3 flex justify-between">
            <span>Tổng Lead phân loại:</span>
            <span className="font-bold text-base-content font-mono">
              {totalLeads.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadPillCard({
  emoji,
  label,
  count,
  percent,
  colorClass,
  badgeColor,
  mounted,
}: {
  emoji: string;
  label: string;
  count: number;
  percent: number;
  colorClass: string;
  badgeColor: string;
  mounted: boolean;
}) {
  return (
    <div className="bg-base-100/50 border border-base-content/5 rounded-xl p-3 flex flex-col gap-2 shadow-xs transition-all hover:bg-base-100 hover:shadow-sm">
      <div className="flex justify-between items-center">
        <div
          className={cn(
            "px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1",
            badgeColor,
          )}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-black text-base-content font-mono">
            {count.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-base-content/40 font-mono">
            ({percent}%)
          </span>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="w-full h-1.5 bg-base-300 border border-base-content/5 shadow-inner rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colorClass,
          )}
          style={{ width: mounted ? `${percent}%` : "0%" }}
        />
      </div>
    </div>
  );
}
