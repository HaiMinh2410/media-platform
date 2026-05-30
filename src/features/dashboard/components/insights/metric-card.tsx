import React, { useRef, useState } from "react";
import { Info } from "lucide-react";
import { PortalTooltip } from "@shared/ui/portal-tooltip";

export interface MetricCardProps {
  label: string;
  value: string | number;
  tooltipText: string;
}

export function MetricCard({ label, value, tooltipText }: MetricCardProps) {
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-1.5 p-4 flex-1 min-w-[150px]">
      <div className="flex items-center gap-1.5 text-base-content/60 text-sm font-semibold select-none">
        <span className="">{label}</span>
        <div
          ref={anchorRef}
          onMouseEnter={() => setIsTooltipActive(true)}
          onMouseLeave={() => setIsTooltipActive(false)}
          className="cursor-pointer shrink-0"
        >
          <Info size={12} className="opacity-60" />
        </div>
      </div>
      <div className="text-3xl font-bold text-base-content tracking-tight mt-0.5 tabular-nums">
        {value}
      </div>

      <PortalTooltip
        active={isTooltipActive}
        anchorRef={anchorRef}
        showArrow
        position="top"
        align="left"
        offsetY={6}
        className="w-62 text-pretty text-sm rounded-md"
      >
        {tooltipText}
      </PortalTooltip>
    </div>
  );
}
