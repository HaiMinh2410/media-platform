import * as React from "react";
import { PortalTooltip } from "@shared/ui";

export interface VariableBadgeProps {
  name: string;
  mockValue: string;
  description: string;
  syntax: string;
  example: string;
  onInsert: (value: string) => void;
}

export function VariableBadge({
  name,
  mockValue,
  description,
  syntax,
  example,
  onInsert,
}: VariableBadgeProps) {
  const [isActive, setIsActive] = React.useState(false);
  const badgeRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Nút bấm hiển thị trên Toolbar */}
      <button
        ref={badgeRef}
        type="button"
        onClick={() => onInsert(`{{${name}}}`)}
        onMouseEnter={() => setIsActive(true)}
        onMouseLeave={() => setIsActive(false)}
        className="group btn btn-xs bg-base-200/40 hover:bg-primary/10 border border-base-content/5 hover:border-primary/20 rounded-md text-xs font-mono transition-colors duration-150 gap-1.5 px-2 py-0.5 text-base-content/60 hover:text-primary cursor-pointer font-medium"
      >
        <span className="font-semibold text-primary/60 group-hover:text-primary">
          {name}
        </span>
        <span className="text-base-content/40 font-sans text-xs font-normal">
          ({mockValue})
        </span>
      </button>

      {/* PORTAL TOOLTIP HIỂN THỊ KHI HOVER */}
      <PortalTooltip
        active={isActive}
        anchorRef={badgeRef}
        showArrow
        position="top"
        align="center"
        className="w-72 p-3.5 bg-soft border border-base-content/10 rounded-xl shadow-xl backdrop-blur-md z-50 text-left normal-case font-sans"
      >
        {/* Header Tooltip */}
        <div className="flex items-center justify-between border-b border-base-content/5 pb-1.5 mb-2">
          <span className="text-xs font-bold text-primary font-mono">
            {"{{"}
            {name}
            {"}}"}
          </span>
        </div>

        {/* Body mô tả */}
        <p className="text-sm text-base-content/80 leading-relaxed mb-2">
          {description}
        </p>

        {/* Cú pháp mẫu / Ví dụ */}
        <div className="space-y-1 bg-base-100/50 p-2 rounded-lg border border-base-content/5 font-mono text-xs text-base-content/60">
          <div>
            <span className="text-primary font-semibold font-sans">
              Cú pháp:
            </span>{" "}
            <span className="text-base-content/90">{syntax}</span>
          </div>
          <div className="pt-1 border-t border-base-content/5">
            <span className="text-success font-semibold font-sans">Ví dụ:</span>{" "}
            <span className="text-base-content/90 italic">
              &quot;{example}&quot;
            </span>
          </div>
        </div>
      </PortalTooltip>
    </>
  );
}
