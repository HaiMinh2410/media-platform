import React from "react";
import { PortalTooltip } from "@shared/ui/portal-tooltip";

interface SortTooltipProps {
  tip: string;
  children: React.ReactElement;
}

export function SortTooltip({ tip, children }: SortTooltipProps) {
  const [active, setActive] = React.useState(false);
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);

  return (
    <span
      ref={anchorRef}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className="inline-flex items-center shrink-0 cursor-pointer"
    >
      {children}
      <PortalTooltip
        active={active}
        anchorRef={anchorRef}
        position="top"
        align="right"
        className="w-fit rounded-sm p-1.5 px-2.5 text-xs"
      >
        {tip}
      </PortalTooltip>
    </span>
  );
}
