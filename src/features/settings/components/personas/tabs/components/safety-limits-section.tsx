import * as React from "react";
import { cn } from "@shared/lib";
import { PortalTooltip } from "@shared/ui";
import { HelpCircle, ShieldCheck } from "lucide-react";

interface SafetyLimitsSectionProps {
  persona: {
    settings?: {
      delay_min?: number;
      delay_max?: number;
      link_rate_limit?: number;
      blacklist_keywords?: string[];
    };
  };
  onChange: (updates: any) => void;
  disabled: boolean;
}

export function SafetyLimitsSection({
  persona,
  onChange,
  disabled,
}: SafetyLimitsSectionProps) {
  const [isDelayHelpActive, setIsDelayHelpActive] = React.useState(false);
  const delayHelpRef = React.useRef<HTMLDivElement>(null);

  const [isLinkLimitHelpActive, setIsLinkLimitHelpActive] =
    React.useState(false);
  const linkLimitHelpRef = React.useRef<HTMLDivElement>(null);

  const updateSafetySettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  return (
    <div
      className={cn(
        "pt-6 space-y-5 transition-all duration-300",
        disabled && "opacity-50 pointer-events-none select-none",
      )}
    >
      <h3 className="font-bold text-base-content flex items-center gap-2">
        <ShieldCheck size={16} className="text-base-content/80" />
        Tham số An toàn & Giới hạn
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/80">
              Delay Tối thiểu (giây)
            </label>
            <div
              ref={delayHelpRef}
              onMouseEnter={() => setIsDelayHelpActive(true)}
              onMouseLeave={() => setIsDelayHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isDelayHelpActive}
              anchorRef={delayHelpRef}
              showArrow
              position="top"
              align="right"
              className="w-80 text-xs font-normal leading-relaxed p-3"
            >
              <div className="space-y-1 text-left">
                <p className="font-semibold text-base-content">
                  Trì hoãn gửi tin (Delay):
                </p>
                <p className="text-base-content/70">
                  Khoảng thời gian ngẫu nhiên (giây) AI sẽ trì hoãn trước khi
                  trả lời. Giúp mô phỏng hành vi tự nhiên của con người và
                  chống bị Instagram gắn cờ spam.
                </p>
              </div>
            </PortalTooltip>
          </div>
          <input
            disabled={disabled}
            type="number"
            value={persona.settings?.delay_min ?? 15}
            onChange={(e) =>
              updateSafetySettings("delay_min", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-base-content/80 flex h-[20px] items-center">
            Delay Tối đa (giây)
          </label>
          <input
            disabled={disabled}
            type="number"
            value={persona.settings?.delay_max ?? 120}
            onChange={(e) =>
              updateSafetySettings("delay_max", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/80">
              Giới hạn gửi Link (mỗi hội thoại)
            </label>
            <div
              ref={linkLimitHelpRef}
              onMouseEnter={() => setIsLinkLimitHelpActive(true)}
              onMouseLeave={() => setIsLinkLimitHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isLinkLimitHelpActive}
              anchorRef={linkLimitHelpRef}
              showArrow
              position="top"
              align="left"
              className="w-80 text-xs font-normal leading-relaxed p-3"
            >
              <div className="space-y-1 text-left">
                <p className="font-semibold text-base-content">
                  Tần suất gửi link:
                </p>
                <p className="text-base-content/70">
                  Số lần AI được gửi link chốt sale (VIP link) tối đa. Để phòng
                  chống gửi link liên tiếp, hệ thống áp dụng khoảng cách tối
                  thiểu 7 ngày giữa 2 lần gửi.
                </p>
              </div>
            </PortalTooltip>
          </div>
          <input
            disabled={disabled}
            type="number"
            value={persona.settings?.link_rate_limit ?? 3}
            onChange={(e) =>
              updateSafetySettings(
                "link_rate_limit",
                parseInt(e.target.value) || 0,
              )
            }
            className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
          />
        </div>
      </div>
    </div>
  );
}
