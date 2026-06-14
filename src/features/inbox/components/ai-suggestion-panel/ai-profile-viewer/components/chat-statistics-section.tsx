import React, { useRef, useState } from "react";
import { PortalTooltip } from "@shared/ui";
import { Calendar, MessageCircle } from "lucide-react";

type ChatStatisticsSectionProps = {
  profile: any;
};

export function ChatStatisticsSection({ profile }: ChatStatisticsSectionProps) {
  if (!profile) return null;
  const calendarRef = useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Định dạng ngày: DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "--/--";
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return "--/--";
    }
  };

  return (
    <div className="text-base-content/50 space-y-1.5 select-none">
      <span
        ref={calendarRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
      >
        <Calendar size={14} /> Đã tương tác:{" "}
        <strong className="text-base-content/70">
          {profile.dayCount} ngày
        </strong>
      </span>
      <span className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none">
        <MessageCircle size={14} /> Tổng tin nhắn:{" "}
        <strong className="text-base-content/70">
          {profile.messageCount} tin
        </strong>
      </span>

      {showTooltip && profile.firstInteractedAt && (
        <PortalTooltip
          active={showTooltip}
          anchorRef={calendarRef}
          position="top"
          align="center"
          showArrow
          className="w-56"
        >
          <div className="text-xs text-base-content leading-normal font-medium text-center">
            Đã tương tác từ ngày {formatDate(profile.firstInteractedAt)}
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}
