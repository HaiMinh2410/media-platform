"use client";

import { cn } from "@shared/lib";
import {
  TrendBadgeProps,
  StatMiniCardProps,
  trendStyles,
  trendArrows,
  glowColorMap,
  speedBadgeStyles,
} from "./ai-summary-card.types";

// ==========================================
// TrendBadge
// ==========================================
export function TrendBadge({ trend, trendDirection, className }: TrendBadgeProps) {
  return (
    <span
      className={cn(
        "text-2xs font-bold flex items-center gap-0.5",
        trendStyles[trendDirection],
        className,
      )}
    >
      {trendArrows[trendDirection]}
      {trend}
    </span>
  );
}

// ==========================================
// StatMiniCard
// ==========================================
export function StatMiniCard({
  label,
  value,
  subLabel,
  glowColor,
  trend,
  trendDirection,
}: StatMiniCardProps) {
  return (
    <div className="bg-base-200/50 rounded-lg p-3.5 border border-base-content/5 flex flex-col justify-between grow relative overflow-hidden">
      <div
        className={cn(
          "absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl pointer-events-none",
          glowColorMap[glowColor],
        )}
      />
      <span className="tracking-wide text-base-content/40">
        {label}
      </span>
      <div className="mt-2">
        <div className="text-2xl font-bold tracking-tight text-base-content font-mono leading-none">
          {value}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-base-content/50 font-medium">
            {subLabel}
          </span>
          {trend && trendDirection && (
            <TrendBadge trend={trend} trendDirection={trendDirection} />
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// AISummaryCardSkeleton
// ==========================================
export function AISummaryCardSkeleton() {
  return (
    <div className="card bg-base-100 border border-base-content/5 shadow-sm h-full">
      <div className="card-body p-5 flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton w-36 h-4 rounded" />
          <div className="skeleton w-12 h-4 rounded" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 grow">
          {/* Cột trái lớn */}
          <div className="md:col-span-3 bg-base-200/50 rounded-xl p-4 border border-base-content/5 flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="flex justify-between items-center">
                <div className="skeleton w-16 h-3 rounded" />
                <div className="skeleton w-20 h-4 rounded" />
              </div>
              <div className="skeleton w-28 h-10 rounded" />
              <div className="skeleton w-32 h-3 rounded" />
            </div>
            <div className="border-t border-base-content/5 my-3 shrink-0" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="skeleton w-16 h-3 rounded" />
                <div className="skeleton w-14 h-6 rounded" />
              </div>
              <div className="skeleton w-16 h-6 rounded-full" />
            </div>
          </div>

          {/* Cột phải: 2 thẻ nhỏ */}
          <div className="md:col-span-2 flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-base-200/50 rounded-xl p-3.5 border border-base-content/5 flex flex-col justify-between grow"
              >
                <div className="skeleton w-14 h-2.5 rounded mb-2" />
                <div className="flex flex-col gap-1.5">
                  <div className="skeleton w-16 h-6 rounded" />
                  <div className="skeleton w-20 h-2.5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Status Skeleton */}
        <div className="mt-auto pt-3 border-t border-base-content/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="skeleton w-2 h-2 rounded-full" />
            <div className="skeleton w-24 h-3 rounded" />
          </div>
          <div className="skeleton w-36 h-1.5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
