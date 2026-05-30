import { InboxMetrics } from "@features/dashboard/actions/dashboard.actions";
import { AccountHealthData } from "@features/settings";

export interface InboxMetricsCardProps {
  workspaceId: string;
  accounts: AccountHealthData[];
  initialData?: InboxMetrics;
}

export interface LeadProgressRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  percent: number;
  variant: "hot" | "warm" | "cold";
  mounted: boolean;
}

// ==========================================
// STATIC CLASS MAP & STYLE DEFINITION FOR LEADS
// ==========================================
export const leadStyles = {
  hot: {
    badge: "text-error font-bold gap-1.5",
    progressClass: "progress-error",
    iconColor: "text-error",
  },
  warm: {
    badge: "text-warning font-bold gap-1.5",
    progressClass: "progress-warning",
    iconColor: "text-warning",
  },
  cold: {
    badge: "text-info font-bold gap-1.5",
    progressClass: "progress-info",
    iconColor: "text-info",
  },
} as const;
