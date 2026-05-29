import React from "react";
import { Kanban, LayoutGrid, Settings2 } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Lead, LeadStage } from "./types";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "./double-calendar-picker";
import { SlidingTabs } from "@shared/ui/sliding-tabs";
import { FilterGroup } from "@shared/ui/filter-group";
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
    activeTextClass: "text-primary font-bold",
  },
  {
    value: "table" as const,
    label: "Chế độ xem bảng",
    icon: LayoutGrid,
    activeBgClass: "bg-primary/10 border border-primary/15 shadow-xs",
    activeTextClass: "text-primary font-bold",
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
    workspaceId,
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hàng 1: Switcher + Nút Ẩn bộ lọc */}
      <div className="flex justify-between items-center w-full">
        {/* Switcher sử dụng SlidingTabs cao cấp */}
        <SlidingTabs
          items={viewModeItems}
          activeValue={viewMode}
          onChange={onViewModeChange}
          size="md"
          layoutId="leadsViewModeIndicator"
          className="bg-base-200/30 shrink-0"
        />
        <div className="flex gap-2">
          <FilterGroup>
            {/* Nút Thêm giai đoạn tùy chỉnh */}
            <button
              onClick={onAddStage}
              className="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80"
            >
              Thêm giai đoạn tùy chỉnh
            </button>

            {/* Nút Chỉnh sửa hàng loạt */}
            {!isBulkEditing && (
              <button
                onClick={onToggleBulkEditing}
                className="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 border-none rounded-sm text-xs text-base-content/80"
              >
                Chỉnh sửa hàng loạt {selectedCount > 0 && `(${selectedCount})`}
              </button>
            )}
          </FilterGroup>
          <FilterGroup>
            <ClusterSelector
              workspaceId={workspaceId}
              selectedGroupId={selectedGroupId}
              onChangeGroup={onChangeGroup}
              triggerClassName={cn(
                "btn btn-soft btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                selectedGroupId &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />

            {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
            <DoubleCalendarPicker
              selectedDate={filters.date}
              onSelectDate={(date) => onFilterChange("date", date)}
              triggerClassName={cn(
                "btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                filters.date !== "all" &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />

            {/* Dropdown Nhãn (Tự động thích ứng màu sắc Aurora UI) */}
            <TagsFilterDropdown
              displayedTags={displayedTags}
              selectedTags={selectedTags}
              tagButtonText={tagButtonText}
              onFilterChange={onFilterChange}
              handleTagClick={handleTagClick}
              parseTag={parseTag}
              triggerClassName={cn(
                "btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 border-none rounded-md text-xs text-base-content/80",
                selectedTags.length > 0 &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />
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
          </FilterGroup>
        </div>
      </div>
    </div>
  );
}
