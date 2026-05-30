"use client";

import { AISummaryCardProps, speedBadgeStyles, getSpeedRating } from "./ai-summary-card.types";
import { useAISummary } from "./use-ai-summary";
import {
  AISummaryCardSkeleton,
  StatMiniCard,
  TrendBadge,
} from "./ai-summary-card.components";

export function AISummaryCard({ workspaceId, initialData }: AISummaryCardProps) {
  const { data, loading, isDrafting } = useAISummary({ workspaceId, initialData });

  if (loading && !data) {
    return <AISummaryCardSkeleton />;
  }

  const speed = data?.avgResponseTime.value
    ? getSpeedRating(data.avgResponseTime.value)
    : null;

  return (
    <div className="card bg-base-100 border border-base-content/5 shadow-sm h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="card-body p-5 flex flex-col gap-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold tracking-tight text-base-content uppercase font-brand">
            AI Activity Summary
          </h3>
        </div>

        {/* Main Content Grid: 3/5 + 2/5 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 grow">
          {/* Cột trái (3/5): Hiệu suất AI — 2 stat đồng nhất */}
          <div className="md:col-span-3 bg-base-200/50 rounded-lg p-4 border border-base-content/5 flex flex-col justify-between relative overflow-hidden">
            {/* Stat 1: Tin nhắn xử lý */}
            <div className="flex items-end flex-1 justify-between mb-3 relative z-10">
              <div className="flex flex-col grow justify-center relative z-10">
                <span className="tracking-wide text-base-content/40 mb-1">
                  Tin nhắn xử lý
                </span>
                <span className="text-3xl font-bold tracking-tight text-base-content font-mono">
                  {data?.messagesProcessed.value || "0"}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-base-content/50">
                    Tin nhắn đã xử lý
                  </span>
                  {data?.messagesProcessed.trend &&
                    data.messagesProcessed.trendDirection && (
                      <TrendBadge
                        trend={data.messagesProcessed.trend}
                        trendDirection={data.messagesProcessed.trendDirection}
                      />
                    )}
                </div>
              </div>

              <span className="text-xs text-primary font-bold font-mono">
                Core Engine
              </span>
            </div>

            <div className="border-t border-base-content/5 my-3 shrink-0" />

            {/* Stat 2: Phản hồi TB */}
            <div className="flex items-end flex-1 justify-between relative z-10">
              <div className="flex flex-col grow">
                <span className="tracking-wide text-base-content/40 mb-1">
                  Phản hồi TB
                </span>
                <span className="text-3xl font-bold tracking-tight text-base-content font-mono">
                  {data?.avgResponseTime.value || "0s"}
                </span>
                <span className="text-xs text-base-content/50 mt-1">
                  Thời gian phản hồi trung bình
                </span>
              </div>
              {speed && (
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={speedBadgeStyles[speed.rating]}>
                    {speed.label}
                  </span>
                  <span className="text-2xs text-base-content/30 font-medium font-mono">
                    Target &lt;1.5s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (2/5): 2 thẻ chồng — dùng StatMiniCard */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <StatMiniCard
              label="Hài lòng"
              value={data?.satisfaction.value || "0%"}
              subLabel="Khách phản hồi"
              glowColor="success"
              trend={data?.satisfaction.trend}
              trendDirection={data?.satisfaction.trendDirection}
            />
            <StatMiniCard
              label="Tiết kiệm"
              value={data?.timeSaved.value || "0.0h"}
              subLabel="Thời gian vận hành"
              glowColor="info"
              trend={data?.timeSaved.trend}
              trendDirection={data?.timeSaved.trendDirection}
            />
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="mt-auto pt-3 border-t border-base-content/5 flex items-center justify-between gap-4">
          {isDrafting ? (
            <>
              <div className="flex items-center gap-2">
                {/* Ping dot indicator */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-2xs text-base-content/60 font-semibold italic animate-pulse">
                  AI đang soạn draft...
                </span>
              </div>
              {/* Shimmer progress bar */}
              <div className="flex-1 max-w-36 h-1 bg-base-content/5 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-primary/30 to-transparent"
                  style={{ backgroundSize: "200% 100%" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success/80 shrink-0" />
                <span className="text-sm text-base-content/40 tracking-wide">
                  Standby
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
