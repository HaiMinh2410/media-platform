"use client";

import React from "react";
import { cn } from "@shared/lib";
import { LeadProgressRowProps, leadStyles } from "./inbox-metrics-card.types";

export function LeadProgressRow({
  icon,
  label,
  count,
  percent,
  variant,
  mounted,
}: LeadProgressRowProps) {
  const styles = leadStyles[variant];
  return (
    <div className="flex items-center gap-4 w-full group/row">
      {/* Icon + Tên Tag */}
      <div className="w-28 shrink-0">
        <div
          className={cn(
            "text-sm font-semibold flex items-center gap-1.5 transition-all duration-300",
            styles.badge,
          )}
        >
          <span
            className={cn(
              "shrink-0 flex items-center justify-center transition-transform duration-300 group-hover/row:scale-110",
              styles.iconColor,
            )}
          >
            {icon}
          </span>
          <span>{label}</span>
        </div>
      </div>

      {/* Thanh Tiến Trình — daisyUI progress component */}
      <div className="grow">
        <progress
          className={cn("progress w-full h-2", styles.progressClass)}
          value={mounted ? percent : 0}
          max={100}
          style={{ transition: "value 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </div>

      {/* Số lượng & % (Căn thẳng hàng bên phải) */}
      <div className="w-20 shrink-0 flex items-baseline justify-end font-bold text-base-content font-mono gap-1">
        <span className="text-sm group-hover/row:text-primary transition-colors duration-200">
          {count.toLocaleString()}
        </span>
        <span className="text-base-content/40 text-xs font-normal">
          ({percent}%)
        </span>
      </div>
    </div>
  );
}
