import React, { useRef, useState } from "react";
import { cn } from "@shared/lib";
import { PortalTooltip } from "@shared/ui";

type FanPersonalitySectionProps = {
  profile: any;
  fanConfig: any;
};

export function FanPersonalitySection({
  profile,
  fanConfig,
}: FanPersonalitySectionProps) {
  const confidenceRef = useRef<HTMLSpanElement>(null);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 relative">
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/60 hover:text-base-content/70 transition-colors select-none">
          Kiểu tính cách:
        </span>
        {profile && fanConfig && (
          <span className={cn("text-sm font-bold", fanConfig.styleClass)}>
            {fanConfig.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          ref={confidenceRef}
          onMouseEnter={() => setShowConfidenceTooltip(true)}
          onMouseLeave={() => setShowConfidenceTooltip(false)}
          className="text-sm text-base-content/60 cursor-help hover:text-base-content/70 transition-colors select-none"
        >
          Mức độ tin cậy:
        </span>
        {profile && profile.fanTypeConfidence > 0 && (
          <span
            className={cn(
              "text-sm font-bold",
              profile.fanTypeConfidence < 0.5
                ? "text-error"
                : profile.fanTypeConfidence >= 0.8
                  ? "text-success"
                  : "text-info",
            )}
          >
            {Math.round(profile.fanTypeConfidence * 100)}%
          </span>
        )}
      </div>

      {profile && fanConfig ? (
        <p className="text-xs border border-base-content/5 bg-base-200 p-2 text-pretty rounded-md text-base-content/80 leading-relaxed mt-0.5">
          <strong className="text-base-content/60 not-italic font-bold">
            Đặc trưng:
          </strong>{" "}
          {fanConfig.description}
        </p>
      ) : (
        <div className="text-xs font-bold text-base-content/60 py-2 text-center select-none">
          Đang thu thập và phân tích dữ liệu...
        </div>
      )}

      {showConfidenceTooltip && (
        <PortalTooltip
          active={showConfidenceTooltip}
          anchorRef={confidenceRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Mức độ tin cậy (Confidence Score):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Độ tin cậy của AI khi phân tích và xếp loại Fan vào Kiểu tính cách
              hiện tại. Chỉ số này càng cao chứng tỏ độ khớp kịch bản và phân
              loại càng chuẩn xác.
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}
