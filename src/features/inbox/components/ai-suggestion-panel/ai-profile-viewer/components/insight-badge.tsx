import React, { useRef, useState } from "react";
import { PortalTooltip } from "@shared/ui";

type InsightBadgeProps = {
  insight: string;
};

export function InsightBadge({ insight }: InsightBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        className="badge badge-secondary badge-soft text-sm font-medium leading-relaxed animate-fade-in cursor-help select-none"
      >
        • {insight}
      </span>
      {active && (
        <PortalTooltip
          active={active}
          anchorRef={ref}
          position="top"
          align="center"
          showArrow
          className="w-64 text-xs font-normal"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="font-bold text-secondary text-sm">
              Nhận định sâu (Insight):
            </span>
            <p className="text-xs text-base-content/85 leading-normal">
              Thông tin thực tế ("{insight}") được AI tự động phân tích và trích
              xuất từ lịch sử trò chuyện nhằm cá nhân hóa câu trả lời.
            </p>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}
