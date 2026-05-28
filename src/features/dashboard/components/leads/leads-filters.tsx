import React from "react";
import { Kanban, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Lead, LeadStage } from "./types";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "./double-calendar-picker";
import { SlidingTabs } from "@shared/ui/sliding-tabs";
import { useLeadsFilters } from "./hooks/use-leads-filters";
import { TagsFilterDropdown } from "./components/tags-filter-dropdown";
import { MoreOptionsDropdown } from "./components/more-options-dropdown";

interface LeadsFiltersProps {
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;
  onAddStage: () => void;
  selectedCount: number;
  onBulkEdit: (stageId: string) => void;
  stages: LeadStage[];
  leads: Lead[];
  filters: {
    source: string;
    stage: string;
    campaign: string;
    form: string;
    date: string;
    tag?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  showLost: boolean;
  onToggleLost: () => void;
  showUnqualified: boolean;
  onToggleUnqualified: () => void;
  showUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  workspaceId: string;
  selectedGroupId: string | null;
  onChangeGroup: (groupId: string | null) => void;
  isBulkEditing?: boolean;
  onToggleBulkEditing?: () => void;
}

const viewModeItems = [
  {
    value: "kanban" as const,
    label: "Chế độ xem theo quy trình",
    icon: Kanban,
    activeBgClass: "bg-primary/10 border border-primary/15 shadow-xs",
    activeTextClass: "text-primary font-bold"
  },
  {
    value: "table" as const,
    label: "Chế độ xem bảng",
    icon: LayoutGrid,
    activeBgClass: "bg-primary/10 border border-primary/15 shadow-xs",
    activeTextClass: "text-primary font-bold"
  },
];

export function LeadsFilters({
  viewMode,
  onViewModeChange,
  onAddStage,
  selectedCount,
  leads,
  filters,
  onFilterChange,
  showLost,
  onToggleLost,
  showUnqualified,
  onToggleUnqualified,
  showUnreadOnly,
  onToggleUnreadOnly,
  workspaceId,
  selectedGroupId,
  onChangeGroup,
  isBulkEditing = false,
  onToggleBulkEditing = () => {},
}: LeadsFiltersProps) {
  const {
    showFilters,
    setShowFilters,
    isMoreOpen,
    setIsMoreOpen,
    moreContainerRef,
    parseTag,
    displayedTags,
    selectedTags,
    handleTagClick,
    tagButtonText,
  } = useLeadsFilters({
    leads,
    filters,
    onFilterChange,
  });

  return (
    <div className="flex flex-col gap-4 w-full bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-sm">
      {/* Hàng 1: Switcher + Nút Ẩn bộ lọc */}
      <div className="flex justify-between items-center w-full">
        {/* Switcher sử dụng SlidingTabs cao cấp */}
        <SlidingTabs
          items={viewModeItems}
          activeValue={viewMode}
          onChange={onViewModeChange}
          size="sm"
          layoutId="leadsViewModeIndicator"
          className="bg-base-200/30 shrink-0"
        />

        {/* Nhóm nút Ẩn bộ lọc với hiệu ứng xoay icon và active micro-interaction */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "btn btn-sm btn-outline border-base-content/10 text-base-content/75 hover:bg-base-200 hover:text-base-content hover:border-base-content/15 text-xs font-semibold px-3 h-8 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all select-none duration-300 active:scale-95",
              !showFilters && "bg-base-200 text-base-content border-base-content/15",
            )}
          >
            <SlidersHorizontal
              size={13}
              className={cn(
                "transition-transform duration-300 shrink-0",
                !showFilters && "rotate-180"
              )}
            />
            {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </button>
        </div>
      </div>

      {/* Hàng 2: Các nút chức năng & Lọc dropdown */}
      {showFilters && (
        <div className="flex gap-2.5 items-center w-full transition-all duration-300 origin-top animate-fade-in">
          <div className="flex items-center gap-2.5">
            {/* Nút Thêm giai đoạn tùy chỉnh */}
            <button
              onClick={onAddStage}
              className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-content/10 text-base-content/75 rounded-lg truncate text-xs font-semibold transition-all duration-200 h-8 flex items-center shadow-xs cursor-pointer active:scale-95"
            >
              Thêm giai đoạn tùy chỉnh
            </button>

            {/* Nút Chỉnh sửa hàng loạt */}
            {!isBulkEditing && (
              <button
                onClick={onToggleBulkEditing}
                className="px-3 py-1 bg-base-100 truncate hover:bg-base-200 border border-base-content/10 text-base-content/75 rounded-lg text-xs font-semibold transition-all duration-200 h-8 flex items-center shadow-xs cursor-pointer select-none active:scale-95"
              >
                Chỉnh sửa hàng loạt {selectedCount > 0 && `(${selectedCount})`}
              </button>
            )}
          </div>

          {/* Thanh ngăn dọc mượt mà */}
          <div className="h-4 w-px bg-base-content/10 mx-0.5" />

          <div className="flex items-center gap-3.5 flex-1">
            <div
              className={cn(
                "grid gap-2.5 flex-1",
                viewMode === "kanban" ? "grid-cols-4" : "grid-cols-3",
              )}
            >
              <ClusterSelector
                workspaceId={workspaceId}
                selectedGroupId={selectedGroupId}
                onChangeGroup={onChangeGroup}
                triggerClassName="w-full flex items-center justify-between gap-2 px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-content/10 text-base-content/75 rounded-full text-xs font-semibold transition-all h-8 cursor-pointer shadow-xs duration-200 active:scale-95"
              />

              {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
              <DoubleCalendarPicker
                selectedDate={filters.date}
                onSelectDate={(date) => onFilterChange("date", date)}
              />

              {/* Dropdown Nhãn (Tự động thích ứng màu sắc Aurora UI) */}
              <TagsFilterDropdown
                displayedTags={displayedTags}
                selectedTags={selectedTags}
                tagButtonText={tagButtonText}
                onFilterChange={onFilterChange}
                handleTagClick={handleTagClick}
                parseTag={parseTag}
              />
            </div>

            {/* Nút Ba chấm (chỉ hiển thị ở Kanban view) */}
            {viewMode === "kanban" && (
              <MoreOptionsDropdown
                isMoreOpen={isMoreOpen}
                setIsMoreOpen={setIsMoreOpen}
                moreContainerRef={moreContainerRef}
                showUnreadOnly={showUnreadOnly}
                onToggleUnreadOnly={onToggleUnreadOnly}
                showLost={showLost}
                onToggleLost={onToggleLost}
                showUnqualified={showUnqualified}
                onToggleUnqualified={onToggleUnqualified}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
