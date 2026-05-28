import React from "react";
import {
  Kanban,
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Lead, LeadStage } from "./types";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "./double-calendar-picker";
import { useInboxStore } from "@features/inbox/store/inbox.store";

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

export function LeadsFilters({
  viewMode,
  onViewModeChange,
  onAddStage,
  selectedCount,
  onBulkEdit,
  stages,
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
  const [showFilters, setShowFilters] = React.useState(true);
  const { availableTags } = useInboxStore();

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  // Chỉ hiển thị nhãn được gán cho ít nhất 1 khách hàng tiềm năng
  const displayedTags = availableTags.filter((tagStr) => {
    const { name } = parseTag(tagStr);
    return leads.some((lead) =>
      lead.tags?.some((t) => t.split("::")[0] === name)
    );
  });

  const selectedTags = filters.tag && filters.tag !== "all"
    ? filters.tag.split(",")
    : [];

  const handleTagClick = (name: string) => {
    if (!filters.tag || filters.tag === "all") {
      onFilterChange("tag", name);
    } else {
      const tagsArr = filters.tag.split(",");
      if (tagsArr.includes(name)) {
        const nextTags = tagsArr.filter((t) => t !== name);
        onFilterChange("tag", nextTags.length > 0 ? nextTags.join(",") : "all");
      } else {
        onFilterChange("tag", [...tagsArr, name].join(","));
      }
    }
  };

  const tagButtonText = selectedTags.length === 0
    ? "Nhãn"
    : selectedTags.length === 1
    ? `Nhãn: ${selectedTags[0]}`
    : `Đã chọn ${selectedTags.length} lựa chọn`;

  // State & Ref quản lý dropdown Ba chấm (Tránh việc chiếm dụng hitbox DOM khi chưa click)
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        moreContainerRef.current &&
        !moreContainerRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMoreOpen]);


  return (
    <div className="flex flex-col gap-3.5 w-full bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-3xs">
      {/* Hàng 1: Switcher + Nút Ẩn bộ lọc */}
      <div className="flex justify-between items-center w-full">
        {/* Switcher */}
        <div className="flex gap-1.5 bg-base-200/30 p-1 rounded-xl border border-base-content/5">
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer h-7",
              viewMode === "kanban"
                ? "bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e]/40 dark:text-[#0ea5e9] border border-[#bae6fd]/50 shadow-3xs"
                : "text-base-content/60 hover:text-base-content/80 hover:bg-base-200/50",
            )}
            onClick={() => onViewModeChange("kanban")}
          >
            <Kanban size={13} className="shrink-0" />
            Chế độ xem theo quy trình
          </button>
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer h-7",
              viewMode === "table"
                ? "bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e]/40 dark:text-[#0ea5e9] border border-[#bae6fd]/50 shadow-3xs"
                : "text-base-content/60 hover:text-base-content/80 hover:bg-base-200/50",
            )}
            onClick={() => onViewModeChange("table")}
          >
            <LayoutGrid size={13} className="shrink-0" />
            Chế độ xem bảng
          </button>
        </div>

        {/* Nhóm nút Xuất dữ liệu & Ẩn bộ lọc */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "btn btn-sm bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 text-xs font-semibold px-3 h-8 rounded-lg shadow-3xs flex items-center gap-1.5 cursor-pointer transition-all",
              !showFilters && "bg-base-200/80 text-base-content",
            )}
          >
            <SlidersHorizontal
              size={13}
              className="transition-transform duration-300"
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
              className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg truncate text-xs font-semibold transition-all h-8 flex items-center shadow-3xs cursor-pointer"
            >
              Thêm giai đoạn tùy chỉnh
            </button>

            {/* Nút Chỉnh sửa hàng loạt */}
            {!isBulkEditing && (
              <button
                onClick={onToggleBulkEditing}
                className="px-3 py-1 bg-base-100 truncate hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center shadow-3xs cursor-pointer select-none"
              >
                Chỉnh sửa hàng loạt {selectedCount > 0 && `(${selectedCount})`}
              </button>
            )}
          </div>

          {/* Thanh ngăn dọc */}
          <div className="h-4 w-px bg-base-300 mx-0.5" />

          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "grid gap-2.5 flex-1",
                viewMode === "kanban" ? "grid-cols-4" : "grid-cols-3",
              )}
            >
              {/* Bộ lọc theo Cụm tài khoản */}
              {viewMode === "kanban" && (
                <ClusterSelector
                  workspaceId={workspaceId}
                  selectedGroupId={selectedGroupId}
                  onChangeGroup={onChangeGroup}
                  triggerClassName="w-full flex items-center justify-between gap-2 px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-full text-xs font-semibold transition-all h-8 cursor-pointer shadow-3xs"
                />
              )}

              {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
              <DoubleCalendarPicker
                selectedDate={filters.date}
                onSelectDate={(date) => onFilterChange("date", date)}
              />

              {/* Dropdown Nhãn (Tự động thích ứng màu sắc Aurora UI) */}
              <div className="dropdown dropdown-bottom w-full block">
                <div
                  tabIndex={0}
                  role="button"
                  className={cn(
                    "w-full px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-content/10 text-base-content/85 rounded-full text-xs font-semibold transition-all h-8 flex items-center justify-between cursor-pointer shadow-3xs hover:-translate-y-0.5 duration-200 active:scale-98 select-none",
                    selectedTags.length > 0 &&
                      "border-primary text-primary bg-primary/5 font-bold shadow-3xs shadow-primary/5",
                  )}
                >
                  <span className="truncate mr-1 text-left">
                    {tagButtonText}
                  </span>
                  <ChevronDown size={12} className="opacity-60 shrink-0" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-1.5 shadow-2xl bg-base-100 rounded-xl w-52 z-[100] border border-base-content/5 mt-1 animate-fade-in max-h-60 overflow-y-auto"
                >
                  <li>
                    <button
                      onClick={() => onFilterChange("tag", "all")}
                      className={cn(
                        "text-xs py-1.5 font-bold cursor-pointer transition-colors duration-150 flex items-center gap-2",
                        selectedTags.length === 0 ? "text-primary bg-primary/5" : "text-base-content/70 hover:bg-base-200"
                      )}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border border-base-content/30" />
                      Tất cả nhãn
                    </button>
                  </li>
                  {displayedTags.map((tagStr) => {
                    const { name, color } = parseTag(tagStr);
                    const isSelected = selectedTags.includes(name);
                    return (
                      <li key={name}>
                        <button
                          onClick={() => handleTagClick(name)}
                          className={cn(
                            "text-xs py-1.5 cursor-pointer transition-colors duration-150 flex items-center gap-2",
                            isSelected ? "text-primary bg-primary/5 font-bold" : "text-base-content/70 hover:bg-base-200"
                          )}
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-base-content/5" 
                            style={{ backgroundColor: color }} 
                          />
                          <span className="truncate">{name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Nút Ba chấm (chỉ hiển thị ở Kanban view như trong hình) */}
            {viewMode === "kanban" && (
              <div 
                ref={moreContainerRef}
                className={cn(
                  "dropdown dropdown-bottom dropdown-end shrink-0",
                  isMoreOpen && "dropdown-open"
                )}
              >
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="w-8 h-8 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/70 rounded-lg flex items-center justify-center transition-all shadow-3xs cursor-pointer"
                >
                  <MoreHorizontal size={14} />
                </button>

                {isMoreOpen && (
                  <div
                    className="dropdown-content p-2 shadow-md bg-base-100 rounded-xl w-72 z-[110] border border-base-200 dark:border-base-800 mt-1.5 flex flex-col gap-1"
                  >
                    <label className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-base-200 dark:hover:bg-base-800 rounded-lg cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showUnreadOnly}
                        onChange={onToggleUnreadOnly}
                        className="checkbox checkbox-xs checkbox-primary rounded-sm border-base-300 shrink-0"
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
                        className="checkbox checkbox-xs checkbox-primary rounded-sm border-base-300 shrink-0"
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
                        className="checkbox checkbox-xs checkbox-primary rounded-sm border-sm border-base-300 shrink-0"
                      />
                      <span className="text-2xs font-semibold text-base-content/85 leading-none">
                        Hiển thị khách hàng tiềm năng Không đủ tiêu chuẩn
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
