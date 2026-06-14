import React, { useRef, useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";
import { PortalTooltip } from "@shared/ui";
import { InsightBadge } from "./insight-badge";
import { ObjectionBadge } from "./objection-badge";

type InsightsAndObjectionsSectionProps = {
  profile: any;
  showInsights: boolean;
  setShowInsights: (show: boolean) => void;
  onJumpToMessage?: (id: string) => void;
  messages: any[];
};

export function InsightsAndObjectionsSection({
  profile,
  showInsights,
  setShowInsights,
  onJumpToMessage,
  messages,
}: InsightsAndObjectionsSectionProps) {
  if (
    !profile ||
    (profile.keyInsights.length === 0 && profile.objectionsSeen.length === 0)
  )
    return null;
  const totalItems = profile.keyInsights.length + profile.objectionsSeen.length;

  const headerRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        ref={headerRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowInsights(!showInsights)}
        className="font-semibold text-sm text-base-content/70 hover:text-base-content transition-colors select-none flex items-center justify-between w-full"
      >
        <span className="tracking-wider flex items-center gap-1.5">
          <Info size={14} /> Nhận định sâu ({totalItems})
        </span>
        {showInsights ? <ChevronUp size={14} /> : <ChevronDown size={12} />}
      </button>

      {showInsights && (
        <div className="flex flex-col gap-3 mt-2 animate-fade-in">
          {profile.keyInsights.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-secondary">
                Insight thu thập được:
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.keyInsights.map((insight: string, idx: number) => (
                  <InsightBadge key={idx} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {profile.objectionsSeen.length > 0 && (
            <div className="flex flex-col gap-2 mt-1 border-t border-base-content/5 pt-2">
              <span className="text-sm text-error">
                Từ chối / Rào cản đã gặp:
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.objectionsSeen.map(
                  (objection: string, idx: number) => (
                    <ObjectionBadge
                      key={idx}
                      objection={objection}
                      onJumpToMessage={onJumpToMessage}
                      messages={messages}
                      messageCount={profile.messageCount}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showTooltip && (
        <PortalTooltip
          active={showTooltip}
          anchorRef={headerRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Nhận định sâu & Rào cản:
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Các chi tiết đắt giá thu thập được về sở thích/thông tin cá nhân
              (Insight) cùng với các phản đối mua hàng của khách đã ghi nhận
              (Rào cản).
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}
