import React, { useRef, useState } from "react";
import { cn } from "@shared/lib";
import { PortalTooltip } from "@shared/ui";
import { Smile, TrendingUp, TrendingDown, Heart } from "lucide-react";

type EmotionAndFlirtSectionProps = {
  profile: any;
};

export function EmotionAndFlirtSection({ profile }: EmotionAndFlirtSectionProps) {
  if (!profile) return null;
  const isEmotionIncreasing = profile.emotionTrend === "increasing";
  const isEmotionDecreasing = profile.emotionTrend === "decreasing";

  const emotionRef = useRef<HTMLSpanElement>(null);
  const flirtRef = useRef<HTMLSpanElement>(null);
  const [showEmotionTooltip, setShowEmotionTooltip] = useState(false);
  const [showFlirtTooltip, setShowFlirtTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Emotion Score */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span
            ref={emotionRef}
            onMouseEnter={() => setShowEmotionTooltip(true)}
            onMouseLeave={() => setShowEmotionTooltip(false)}
            className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
          >
            <Smile size={14} /> Độ thiện cảm (Emotion)
            {isEmotionIncreasing && (
              <TrendingUp size={14} className="text-success animate-pulse" />
            )}
            {isEmotionDecreasing && (
              <TrendingDown size={14} className="text-error animate-pulse" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-2 bg-base-content/10 rounded-full overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                profile.emotionScore < 0.5
                  ? "bg-warning"
                  : profile.emotionScore >= 0.8
                    ? "bg-success"
                    : "bg-info",
              )}
              style={{ width: `${profile.emotionScore * 100}%` }}
            />
          </div>
          <span
            className={cn(
              "text-sm font-bold shrink-0 min-w-[36px] text-right",
              profile.emotionScore < 0.5
                ? "text-warning"
                : profile.emotionScore >= 0.8
                  ? "text-success"
                  : "text-info",
            )}
          >
            {Math.round(profile.emotionScore * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-base-content/60 select-none pr-12">
          <span>Lạnh nhạt</span>
          <span>Nồng nhiệt</span>
        </div>
      </div>

      {/* Flirt Level */}
      <div className="flex justify-between items-center pt-1">
        <span
          ref={flirtRef}
          onMouseEnter={() => setShowFlirtTooltip(true)}
          onMouseLeave={() => setShowFlirtTooltip(false)}
          className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
        >
          <Heart size={14} /> Độ quấn quýt (Thính)
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((val) => (
            <Heart
              key={val}
              size={16}
              className={cn(
                "transition-all duration-300",
                val <= profile.flirtLevel
                  ? "fill-secondary text-secondary scale-110"
                  : "text-base-content/20 opacity-40",
              )}
            />
          ))}
        </div>
      </div>

      {showEmotionTooltip && (
        <PortalTooltip
          active={showEmotionTooltip}
          anchorRef={emotionRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Độ thiện cảm (Emotion):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Đánh giá cảm xúc hiện tại của Fan dựa trên tin nhắn gần nhất. Mức
              độ thiện cảm cao sẽ giúp đẩy nhanh tiến trình thăng hạng Giai đoạn
              (Stage).
            </p>
          </div>
        </PortalTooltip>
      )}

      {showFlirtTooltip && (
        <PortalTooltip
          active={showFlirtTooltip}
          anchorRef={flirtRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Độ quấn quýt (Flirt Level):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Mức độ thân mật/thả thính cho phép AI Agent sử dụng khi sinh phản
              hồi. Các mức dao động từ Level 0 (không thả thính, nghiêm túc) đến
              Level 3 (quấn quýt mạnh).
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}
