import { useRef } from "react";
import { cn } from "@shared/lib";
import { Compass } from "lucide-react";

type NextActionSectionProps = {
  profile: any;
  actionConfig: any;
};

export function NextActionSection({ profile, actionConfig }: NextActionSectionProps) {
  const headerRef = useRef<HTMLSpanElement>(null);

  return (
    <div className="flex flex-col gap-2 relative">
      <span
        ref={headerRef}
        className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none"
      >
        <Compass size={14} /> Hành động khuyên dùng
      </span>
      {profile && actionConfig ? (
        <div
          className={cn(
            "text-sm px-2.5 py-2 font-semibold rounded-lg flex items-center justify-between",
            actionConfig.styleClass,
          )}
        >
          <span>{actionConfig.label}</span>
          <Compass
            size={11}
            className="shrink-0 animate-bounce"
            fill="currentColor"
          />
        </div>
      ) : (
        <div className="text-xs font-bold text-base-content/60 py-2 text-center select-none">
          Tiếp tục trò chuyện tự nhiên
        </div>
      )}
    </div>
  );
}
