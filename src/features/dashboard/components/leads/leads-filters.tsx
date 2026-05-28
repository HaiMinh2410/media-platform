import React from "react";
import {
  Kanban,
  LayoutGrid,
  SlidersHorizontal,
  Calendar,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import { LeadStage } from "./types";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";

interface LeadsFiltersProps {
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;
  onAddStage: () => void;
  selectedCount: number;
  onBulkEdit: (stageId: string) => void;
  stages: LeadStage[];
  filters: {
    source: string;
    stage: string;
    campaign: string;
    form: string;
    date: string;
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

              {/* Dropdown Chọn ngày */}
              <div className="dropdown dropdown-bottom w-full block">
                <div
                  tabIndex={0}
                  role="button"
                  className={cn(
                    "w-full px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-full text-xs font-semibold transition-all h-8 flex items-center justify-between cursor-pointer shadow-3xs",
                    filters.date !== "all" &&
                      "border-[#0064d2] text-[#0064d2] bg-blue-50/50 font-bold",
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar size={13} className="opacity-70 shrink-0" />
                    <span className="truncate">
                      {filters.date === "all" ? "Chọn ngày" : filters.date}
                    </span>
                  </div>
                  <ChevronDown size={12} className="opacity-60 shrink-0" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-1.5 shadow-md bg-base-100 rounded-xl w-48 z-100 border border-base-200 dark:border-base-800 mt-1"
                >
                  <li>
                    <button
                      onClick={() => onFilterChange("date", "all")}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      Tất cả thời gian
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onFilterChange("date", "Hôm nay")}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      Hôm nay
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onFilterChange("date", "Hôm qua")}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      Hôm qua
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onFilterChange("date", "7 ngày qua")}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      7 ngày qua
                    </button>
                  </li>
                </ul>
              </div>

              {/* Dropdown Trạng thái / Giai đoạn */}
              <div className="dropdown dropdown-bottom w-full block">
                <div
                  tabIndex={0}
                  role="button"
                  className={cn(
                    "w-full px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-full text-xs font-semibold transition-all h-8 flex items-center justify-between cursor-pointer shadow-3xs",
                    filters.stage !== "all" &&
                      "border-[#0064d2] text-[#0064d2] bg-blue-50/50 font-bold",
                  )}
                >
                  <span className="truncate mr-1 text-left">
                    Trạng thái:{" "}
                    {filters.stage === "all"
                      ? "Tất cả"
                      : stages.find((s) => s.id === filters.stage)?.label ||
                        filters.stage}
                  </span>
                  <ChevronDown size={12} className="opacity-60 shrink-0" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-1.5 shadow-md bg-base-100 rounded-xl w-48 z-[100] border border-base-200 dark:border-base-800 mt-1"
                >
                  <li>
                    <button
                      onClick={() => onFilterChange("stage", "all")}
                      className="text-xs py-1.5 font-bold text-sky-600 cursor-pointer"
                    >
                      Tất cả trạng thái
                    </button>
                  </li>
                  {stages.map((stage) => (
                    <li key={stage.id}>
                      <button
                        onClick={() => onFilterChange("stage", stage.id)}
                        className="text-xs py-1.5 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{stage.icon}</span>
                        {stage.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dropdown Nhãn */}
              <div className="w-full px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-full text-xs font-semibold transition-all h-8 flex items-center justify-between cursor-pointer shadow-3xs">
                <span>Nhãn</span>
                <ChevronDown size={12} className="opacity-60 shrink-0" />
              </div>
            </div>

            {/* Nút Ba chấm (chỉ hiển thị ở Kanban view như trong hình) */}
            {viewMode === "kanban" && (
              <div className="dropdown dropdown-bottom dropdown-end shrink-0">
                <button
                  tabIndex={0}
                  role="button"
                  className="w-8 h-8 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/70 rounded-lg flex items-center justify-center transition-all shadow-3xs cursor-pointer"
                >
                  <MoreHorizontal size={14} />
                </button>

                <div
                  tabIndex={0}
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
