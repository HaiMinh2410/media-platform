import { RangeSelector } from "@shared/ui";

import React from "react";
import { MoreHorizontal } from "lucide-react";

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
    <RangeSelector
      ref={moreContainerRef}
      isOpen={isMoreOpen}
      onOpenChange={setIsMoreOpen}
      menuAlign="right"
      menuMinWidth="w-72"
      dropdownClassName="rounded-lg"
      customTrigger={
        <button className="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 border-none rounded-md text-xs font-semibold px-4.5 text-base-content/80">
          <MoreHorizontal size={14} />
        </button>
      }
    >
      <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showUnreadOnly}
          onChange={onToggleUnreadOnly}
          className="checkbox checkbox-sm checkbox-primary border-base-content/20 shrink-0"
        />
        <span className="text-sm text-base-content/85 leading-5">
          Chỉ hiển thị khách hàng tiềm năng chưa đọc
        </span>
      </label>

      <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showLost}
          onChange={onToggleLost}
          className="checkbox checkbox-sm checkbox-primary border-base-content/20 shrink-0"
        />
        <span className="text-sm text-base-content/85 leading-5">
          Hiển thị khách hàng tiềm năng Bị mất đi
        </span>
      </label>

      <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showUnqualified}
          onChange={onToggleUnqualified}
          className="checkbox checkbox-sm checkbox-primary border-base-content/20 shrink-0"
        />
        <span className="text-sm text-base-content/85 leading-5">
          Hiển thị khách hàng tiềm năng Không đủ tiêu chuẩn
        </span>
      </label>
    </RangeSelector>
  );
}

