import { AISummary } from "@features/dashboard/actions/dashboard.actions";

// ==========================================
// PROPS INTERFACES
// ==========================================
export interface AISummaryCardProps {
  workspaceId: string;
  initialData?: AISummary;
}

export interface TrendBadgeProps {
  trend: string;
  trendDirection: "up" | "down" | "stable";
  className?: string;
}

export interface StatMiniCardProps {
  label: string;
  value: string;
  subLabel: string;
  glowColor: "success" | "info" | "warning" | "error";
  trend?: string;
  trendDirection?: "up" | "down" | "stable";
}

// ==========================================
// STATIC MAPS — Tailwind compile-safe
// ==========================================
export const trendStyles = {
  up: "text-success",
  down: "text-error",
  stable: "text-base-content/50",
} as const;

export const trendArrows = {
  up: "↑",
  down: "↓",
  stable: "→",
} as const;

// Speed badge: static map để Tailwind compile đúng class
export const speedBadgeStyles = {
  excellent: "badge badge-soft badge-success text-2xs font-bold",
  good: "badge badge-soft badge-info text-2xs font-bold",
  stable: "badge badge-soft badge-warning text-2xs font-bold",
  slow: "badge badge-soft badge-error text-2xs font-bold",
} as const;

export const glowColorMap = {
  success: "bg-success/10",
  info: "bg-info/10",
  warning: "bg-warning/10",
  error: "bg-error/10",
} as const;

export type SpeedRating = keyof typeof speedBadgeStyles;

// ==========================================
// HELPERS
// ==========================================
export function getSpeedRating(value: string): {
  rating: SpeedRating;
  label: string;
} {
  const val = parseFloat(value);
  if (val < 1.5) return { rating: "excellent", label: "Excellent" };
  if (val <= 3) return { rating: "good", label: "Good" };
  if (val <= 5) return { rating: "stable", label: "Stable" };
  return { rating: "slow", label: "Slow" };
}
