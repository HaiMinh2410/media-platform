import React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@shared/lib/utils";

interface MoreOptionsDropdownProps {
  isMoreOpen: boolean;
  setIsMoreOpen: (open: boolean) => void;
  moreContainerRef: React.RefObject<HTMLDivElement | null>;
  showUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  showLost: boolean;
  onToggleLost: () => void;
  showUnqualified: boolean;
  onToggleUnqualified: () => void;
}

export function MoreOptionsDropdown({
  isMoreOpen,
  setIsMoreOpen,
  moreContainerRef,
  showUnreadOnly,
  onToggleUnreadOnly,
  showLost,
  onToggleLost,
  showUnqualified,
  onToggleUnqualified,
}: MoreOptionsDropdownProps) {
  return (
    <div 
      ref={moreContainerRef}
      className={cn(
        "dropdown dropdown-bottom dropdown-end shrink-0",
        isMoreOpen && "dropdown-open"
      )}
    >
      <button
        onClick={() => setIsMoreOpen(!isMoreOpen)}
        className="w-8 h-8 bg-base-100 hover:bg-base-200 border border-base-content/10 text-base-content/70 rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 duration-200"
      >
        <MoreHorizontal size={14} />
      </button>

      {isMoreOpen && (
        <div
          className="dropdown-content p-2 shadow-xl bg-base-100 rounded-xl w-72 z-110 border border-base-content/5 mt-1.5 flex flex-col gap-1 animate-fade-in"
        >
          <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={onToggleUnreadOnly}
              className="checkbox checkbox-xs checkbox-primary rounded-sm border-base-content/20 shrink-0"
            />
            <span className="text-2xs font-semibold text-base-content/85 leading-none">
              Chỉ hiển thị khách hàng tiềm năng chưa đọc
            </span>
          </label>

          <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLost}
              onChange={onToggleLost}
              className="checkbox checkbox-xs checkbox-primary rounded-sm border-base-content/20 shrink-0"
            />
            <span className="text-2xs font-semibold text-base-content/85 leading-none">
              Hiển thị khách hàng tiềm năng Bị mất đi
            </span>
          </label>

          <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnqualified}
              onChange={onToggleUnqualified}
              className="checkbox checkbox-xs checkbox-primary rounded-sm border-base-content/20 shrink-0"
            />
            <span className="text-2xs font-semibold text-base-content/85 leading-none">
              Hiển thị khách hàng tiềm năng Không đủ tiêu chuẩn
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
