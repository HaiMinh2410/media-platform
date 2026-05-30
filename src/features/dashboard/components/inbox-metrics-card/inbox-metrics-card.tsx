"use client";

import { RangeSelector, FilterGroup, Icon } from "@shared/ui";
import { cn } from "@shared/lib";

import {
  UsersRound,
  Flame,
  CloudSun,
  Snowflake,
  Bot,
  User,
} from "lucide-react";
import { ErrorBoundary, SectionError } from "../error-boundary";
import { InboxMetricsCardProps } from "./inbox-metrics-card.types";
import { useInboxMetrics } from "./use-inbox-metrics";
import { LeadProgressRow } from "./lead-progress-row";

// SVG Sparkline nhẹ, thay thế recharts cho hiệu suất tốt hơn
function SparklineSvg({ data }: { data: { value: number }[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 56;
  const pad = 3;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${pad},${h - pad} ` + points + ` ${w - pad},${h - pad}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spark-grad)" />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxMetricsCard({
  workspaceId,
  accounts,
  initialData,
}: InboxMetricsCardProps) {
  const {
    period,
    setPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedAccountId,
    setSelectedAccountId,
    metrics,
    totalLeads,
    totalMessages,
    sparklineData,
    aiHandledPct,
    humanNeededPct,
    aiInsightText,
    isPending,
    mounted,
  } = useInboxMetrics({ workspaceId, accounts, initialData });

  return (
    <div className="card bg-base-100 border border-base-content/5 shadow-sm h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group/card relative overflow-hidden">
      <div className="card-body p-6 flex flex-col gap-6">

        {/* TẦNG 1: Header */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-base-content/5 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-base-content uppercase font-brand">
              Inbox Metrics — Phễu Hội Thoại
            </h2>
            {isPending && (
              <span className="loading loading-spinner loading-xs text-primary" />
            )}
          </div>

          {/* Filter Group */}
          <FilterGroup className="h-9 rounded-lg bg-transparent p-0">
            <RangeSelector
              options={[
                {
                  id: "all",
                  label: "Tất cả tài khoản",
                  icon: <UsersRound className="w-3.5 h-3.5 text-base-content/60" />,
                },
                ...accounts.map((account) => ({
                  id: account.id,
                  label: account.platform_user_name,
                  icon:
                    account.platform === "facebook" ? (
                      <Icon name="facebook" className="w-3.5 h-3.5 text-facebook" />
                    ) : (
                      <Icon name="instagram" className="w-3.5 h-3.5 text-instagram" />
                    ),
                })),
              ]}
              value={selectedAccountId || "all"}
              onChange={(val) =>
                setSelectedAccountId(val === "all" ? undefined : val)
              }
              menuAlign="right"
              menuMinWidth="w-52"
              triggerClassName="btn btn-ghost btn-sm bg-transparent hover:shadow-none hover:bg-base-100/60 border-none rounded-md text-xs text-base-content/80"
            />
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
              triggerClassName="btn btn-ghost btn-sm bg-transparent hover:shadow-none hover:bg-base-100/60 border-none rounded-md text-xs text-base-content/80"
            />
          </FilterGroup>
        </div>

        {/* Custom Date Range Picker */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center justify-end bg-base-200/50 p-2 rounded-xl border border-base-content/5 -mt-2">
            <label className="input input-sm bg-base-100 border border-base-content/10 rounded-lg h-8 flex items-center gap-0 px-0 focus-within:border-primary! transition-all">
              <span className="px-2 text-xs font-bold text-base-content/40 uppercase font-mono select-none shrink-0">
                Từ
              </span>
              <div className="w-px h-4 bg-base-content/10 shrink-0" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-mono text-xs font-semibold text-base-content h-full px-2 focus:outline-hidden w-28"
              />
              <div className="w-px h-4 bg-base-content/10 shrink-0" />
              <span className="px-2 text-xs font-bold text-base-content/40 uppercase font-mono select-none shrink-0">
                Đến
              </span>
              <div className="w-px h-4 bg-base-content/10 shrink-0" />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-mono text-xs font-semibold text-base-content h-full px-2 focus:outline-hidden w-28"
              />
            </label>
          </div>
        )}

        {/* NỘI DUNG CHÍNH */}
        <ErrorBoundary fallback={<SectionError title="Dữ liệu Phễu Hội Thoại" />}>
          <div
            className={cn(
              "flex flex-col gap-6 grow transition-opacity duration-300",
              isPending && "opacity-50 pointer-events-none select-none",
            )}
          >
            {/* TẦNG 2: 2 Cột — Tổng hội thoại + Phân bố Lead */}
            <div className="flex flex-col md:flex-row md:items-stretch gap-2.5 grow">

              {/* Cột Trái (~30%): Tổng Hội Thoại — stat bento */}
              <div className="md:w-2/6 flex flex-col justify-between bg-base-200/50 border border-base-content/5 rounded-xl p-5 relative overflow-hidden group/funnel">

                <div className="flex flex-col gap-1 relative z-10">
                  <span className="text-base text-base-content/40">
                    Tổng hội thoại
                  </span>
                  <div className="text-5xl font-extrabold tracking-tighter text-primary font-mono mt-1.5 transition-transform duration-300 group-hover/funnel:translate-x-1">
                    {totalMessages.toLocaleString()}
                  </div>
                </div>

                {/* Sparkline SVG nhẹ */}
                <div className="w-full h-14 mt-4 opacity-40 group-hover/card:opacity-60 transition-opacity duration-300 relative z-10">
                  <SparklineSvg data={sparklineData} />
                </div>
              </div>

              {/* Cột Phải (~70%): Phân bố Lead theo AI Tag */}
              <div className="md:w-4/6 flex flex-col justify-between bg-base-200/50 border border-base-content/5 rounded-xl p-5">
                <span className="text-sm font-semibold text-base-content/80 mb-4 block">
                  Phân bố Lead theo AI Tag
                </span>

                <div className="flex flex-col gap-4 grow justify-center">
                  <LeadProgressRow
                    icon={<Flame className="w-3.5 h-3.5 stroke-2" />}
                    label="Hot lead"
                    count={metrics?.leadDistribution?.hot || 0}
                    percent={
                      totalLeads > 0
                        ? Math.round(((metrics?.leadDistribution?.hot || 0) / totalLeads) * 100)
                        : 0
                    }
                    variant="hot"
                    mounted={mounted}
                  />
                  <LeadProgressRow
                    icon={<CloudSun className="w-3.5 h-3.5 stroke-2" />}
                    label="Warm lead"
                    count={metrics?.leadDistribution?.warm || 0}
                    percent={
                      totalLeads > 0
                        ? Math.round(((metrics?.leadDistribution?.warm || 0) / totalLeads) * 100)
                        : 0
                    }
                    variant="warm"
                    mounted={mounted}
                  />
                  <LeadProgressRow
                    icon={<Snowflake className="w-3.5 h-3.5 stroke-2" />}
                    label="Cold lead"
                    count={metrics?.leadDistribution?.cold || 0}
                    percent={
                      totalLeads > 0
                        ? Math.round(((metrics?.leadDistribution?.cold || 0) / totalLeads) * 100)
                        : 0
                    }
                    variant="cold"
                    mounted={mounted}
                  />
                </div>
              </div>
            </div>

            {/* TẦNG 3: Hiệu Suất Xử Lý AI vs Con Người */}
            <div className="flex flex-col gap-3">
              <span className="text-base font-semibold text-base-content/40 tracking-wide">
                Hiệu Suất Xử Lý AI vs Con Người
              </span>

              {/* Stacked progress bar — CSS transition thuần, không dùng framer-motion */}
              <div className="w-full h-4 bg-base-300/80 border border-base-content/5 shadow-inner rounded-full overflow-hidden flex relative">
                {/* Phần AI */}
                <div
                  className="h-full bg-info/90 hover:bg-info transition-all duration-700 ease-in-out"
                  style={{ width: mounted ? `${aiHandledPct}%` : "0%" }}
                />
                {/* Vạch ngăn cách */}
                {mounted && aiHandledPct > 0 && humanNeededPct > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-base-100 z-10"
                    style={{ left: `${aiHandledPct}%`, transform: "translateX(-50%)" }}
                  />
                )}
                {/* Phần Con người */}
                <div
                  className="h-full bg-warning/90 hover:bg-warning transition-all duration-700 ease-in-out"
                  style={{ width: mounted ? `${humanNeededPct}%` : "0%" }}
                />
              </div>

              {/* Chú thích số liệu */}
              <div className="flex justify-between items-center pb-4 border-b border-base-content/5">
                {/* AI Tự Động */}
                <div className="flex items-center gap-2 text-info">
                  <Bot className="w-4 h-4 stroke-2 shrink-0" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold font-mono">
                      {(metrics?.aiHandled || 0).toLocaleString()}
                    </span>
                    <span className="text-sm opacity-70 font-bold font-mono">
                      ({aiHandledPct}%)
                    </span>
                  </div>
                </div>

                {/* Nhân Viên Trực */}
                <div className="flex items-center gap-2 text-warning justify-end">
                  <div className="flex items-baseline gap-1 text-right">
                    <span className="text-xl font-extrabold font-mono">
                      {(metrics?.humanNeeded || 0).toLocaleString()}
                    </span>
                    <span className="text-sm opacity-70 font-bold font-mono">
                      ({humanNeededPct}%)
                    </span>
                  </div>
                  <User className="w-4 h-4 stroke-2 shrink-0" />
                </div>
              </div>

              {/* AI Insight text */}
              <div className="flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-primary shrink-0 animate-pulse mt-0.5" />
                <p className="text-sm text-base-content/70 leading-relaxed">
                  {aiInsightText}
                </p>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
