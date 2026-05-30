import React from "react";
import { cn } from "@shared/lib/utils";

export interface SubTabConfig {
  id: string;
  label: string;
  showCount: boolean;
  showChevron: boolean;
}

interface SubTabProps {
  tab: SubTabConfig;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export function SubTab({ tab, count, isActive, onClick }: SubTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-all cursor-pointer font-bold text-sm",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-base-200/60 text-base-content/60",
      )}
    >
      <span>{tab.label}</span>
      {tab.showCount && (
        <span
          className={cn(
            "badge badge-sm",
            isActive
              ? "bg-primary text-primary-content"
              : "bg-base-200",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
