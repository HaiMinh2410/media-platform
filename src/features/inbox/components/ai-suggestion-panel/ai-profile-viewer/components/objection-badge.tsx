import React, { useRef, useState } from "react";
import { cn } from "@shared/lib";
import { PortalTooltip } from "@shared/ui";
import { OBJECTION_DETAILS, OBJECTION_REGEXES } from "./objection-constants";

type ObjectionBadgeProps = {
  objection: string;
  onJumpToMessage?: (id: string) => void;
  messages: any[];
  messageCount: number;
};

export function ObjectionBadge({
  objection,
  onJumpToMessage,
  messages,
  messageCount,
}: ObjectionBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  const detail = OBJECTION_DETAILS[objection] || {
    label: objection,
    reason:
      "Rào cản / phản đối của khách hàng được phát hiện trong quá trình tương tác.",
  };

  // So khớp tất cả regex trên danh sách tin nhắn của khách hàng (sắp xếp từ cũ nhất đến mới nhất)
  const regex = OBJECTION_REGEXES[objection];
  const matchingMessages =
    regex && messages && messages.length > 0
      ? messages
          .filter((m) => m.senderType === "user")
          .filter((m) => regex.test(m.content))
          .reverse() // Đảo từ cũ nhất đến mới nhất theo trình tự thời gian
      : [];

  const hasMatches = matchingMessages.length > 0;
  const currentMatch = hasMatches ? matchingMessages[matchIndex] : null;

  const handleBadgeClick = () => {
    if (hasMatches && onJumpToMessage && currentMatch) {
      onJumpToMessage(currentMatch.id);
      // Chuyển sang tin nhắn khớp tiếp theo cho lượt nhấp tiếp theo
      setMatchIndex((prev) => (prev + 1) % matchingMessages.length);
    }
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onClick={handleBadgeClick}
        className={cn(
          "badge badge-error badge-soft text-sm font-medium leading-relaxed animate-fade-in select-none",
          hasMatches ? "cursor-pointer hover:bg-error/20" : "cursor-help",
        )}
      >
        ✗ {detail.label}{" "}
        {matchingMessages.length > 1 && `(${matchingMessages.length})`}
      </span>
      {active && (
        <PortalTooltip
          active={active}
          anchorRef={ref}
          position="top"
          align="center"
          showArrow
          className="w-80 text-xs font-normal"
        >
          <div className="flex flex-col gap-1.5 text-base-content max-w-full">
            <p className="text-xs text-base-content/85 leading-normal">
              <strong>{detail.label}</strong>: {detail.reason}
            </p>

            <div className="mt-1 border-t border-base-content/5 pt-1.5 flex flex-col gap-1.5">
              {hasMatches ? (
                <>
                  <div className="flex justify-between items-center text-xs text-base-content/50 select-none">
                    <span>
                      Nhận diện tức thì ({matchingMessages.length} tin):
                    </span>
                    {matchingMessages.length > 1 && (
                      <span className="text-primary normal-case font-semibold">
                        Lượt nhấp tiếp theo: #{matchIndex + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {matchingMessages.map((msg) => {
                      return <div key={msg.id} className="italic">"{msg.content}"</div>;
                    })}
                  </div>
                  {matchingMessages.length > 1 && (
                    <p className="text-sm text-base-content/40 italic mt-0.5 text-center select-none">
                      * Nhấp liên tục vào Badge màu đỏ để tự động chuyển tiếp
                      qua các tin nhắn.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <span className="text-sm text-base-content/50 uppercase font-bold tracking-wide select-none">
                    Phân tích sâu AI/LLM:
                  </span>
                  <div className="text-[11px] text-base-content/70">
                    AI phân tích và tóm tắt dựa trên {messageCount} tin nhắn.
                  </div>
                </>
              )}
            </div>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}
