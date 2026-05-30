import { RangeSelector } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { ArrowDown, ArrowUpDown, ChevronDown, MoreHorizontal, ArrowUp } from "lucide-react";
import { Lead, LeadStage } from "./types";

// Components & Hooks
import { SubTab } from "./components/sub-tab";
import { LeadRow } from "./components/lead-row";
import { SortTooltip } from "./components/sort-tooltip";
import { useLeadsTable, SortField } from "./hooks/use-leads-table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadsTableProps {
  leads: Lead[];
  allLeads: Lead[]; // Tất cả leads (chưa lọc) để tính toán count cho các sub-tabs
  stages: LeadStage[];
  selectedLeadIds: string[];
  onSelectLead: (leadId: string, isChecked: boolean) => void;
  onSelectAllLeads: (isChecked: boolean) => void;
  onChangeStage: (leadId: string, newStageId: string) => void;
  currentSubTab: string;
  onSubTabChange: (tabId: string) => void;
  showUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
}

const FIELD_MAP: Record<string, SortField> = {
  "Tên": "name",
  "Giai đoạn": "stage",
  "Nguồn": "source",
  "Nhãn": "tags"
};

// Hàm phụ trợ tính count
function getSubTabCount(tabId: string, allLeads: Lead[], showUnreadOnly: boolean): number {
  const baseLeads = showUnreadOnly ? allLeads.filter((l) => l.unread === true) : allLeads;
  if (tabId === "all") return baseLeads.length;
  return baseLeads.filter((l) => l.stage === tabId).length;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadsTable({
  leads,
  allLeads,
  stages,
  selectedLeadIds,
  onSelectLead,
  onSelectAllLeads,
  onChangeStage,
  currentSubTab,
  onSubTabChange,
  showUnreadOnly,
  onToggleUnreadOnly,
}: LeadsTableProps) {
  const isAllSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l.id));

  // Gọi custom hook để quản lý toàn bộ business logic
  const {
    sortedLeads,
    sortField,
    sortOrder,
    handleSort,
    showLostSubTab,
    showUnqualifiedSubTab,
    handleToggleLost,
    handleToggleUnqualified,
    subTabs,
  } = useLeadsTable({
    leads,
    allLeads,
    stages,
    currentSubTab,
    onSubTabChange,
  });

  const renderSortIcon = (field: SortField) => {
    const isCurrent = sortField === field;
    const tip = !isCurrent || sortOrder === "none"
      ? "Chưa sắp xếp"
      : sortOrder === "asc"
      ? "Đã sắp xếp theo tăng dần"
      : "Đã sắp xếp theo giảm dần";

    return (
      <SortTooltip tip={tip}>
        {!isCurrent || sortOrder === "none" ? (
          <ArrowUpDown size={14} strokeWidth={3} className="shrink-0 opacity-40 hover:opacity-85 transition-opacity" />
        ) : sortOrder === "asc" ? (
          <ArrowUp size={14} strokeWidth={3} className="text-primary shrink-0 transition-all duration-200 animate-fade-in" />
        ) : (
          <ArrowDown size={14} strokeWidth={3} className="text-primary shrink-0 transition-all duration-200 animate-fade-in" />
        )}
      </SortTooltip>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full bg-base-100 p-4 border border-base-content/5 rounded-lg shadow-sm">
      {/* ── 1. Sub-tab Filter Bar ── */}
      <div className="flex items-center justify-between border-b border-base-content/8 pb-2.5 w-full relative">
        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto flex-1 scrollbar-none mr-4">
          {subTabs.map((tab, idx) => (
            <React.Fragment key={tab.id}>
              <SubTab
                tab={tab}
                count={getSubTabCount(tab.id, allLeads, showUnreadOnly)}
                isActive={tab.id === "all" ? (currentSubTab === "all" && !showUnreadOnly) : currentSubTab === tab.id}
                onClick={() => {
                  if (tab.id === "all" && showUnreadOnly) {
                    onToggleUnreadOnly();
                  }
                  onSubTabChange(tab.id);
                }}
              />
              {/* Nút lọc Chưa đọc xuất hiện sau tab "Tất cả" (idx === 0) */}
              {idx === 0 && (
                <button
                  onClick={onToggleUnreadOnly}
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-all cursor-pointer font-bold text-sm shrink-0",
                    showUnreadOnly
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-base-200/60 text-base-content/60"
                  )}
                >
                  <span>Chưa đọc</span>
                </button>
              )}
              {/* Chevron nằm ngoài và ở giữa các subtab */}
              {tab.showChevron && (
                <ChevronDown size={14} strokeWidth={3} className="opacity-60 font-bold shrink-0 -rotate-90 mx-1" />
              )}
              {/* Divider*/}
              {idx === 0 && (
                <div className="h-4 w-px bg-base-content/15 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Nút tùy chọn bọc trong RangeSelector */}
        <RangeSelector
          menuAlign="right"
          menuMinWidth="w-60"
          dropdownClassName="rounded-lg"
          customTrigger={
            <button className="btn btn-ghost btn-sm rounded-md text-base-content">
              <MoreHorizontal size={14} />
            </button>
          }
        >
          <div className="flex flex-col gap-0.5 w-full">
            <label className="flex items-center gap-2 py-2 px-3 hover:bg-base-200/50 rounded-md cursor-pointer text-sm text-base-content">
              <input
                type="checkbox"
                checked={showUnqualifiedSubTab}
                onChange={(e) => handleToggleUnqualified(e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary rounded-sm shrink-0"
              />
              <span>Không đủ tiêu chuẩn</span>
            </label>
            <label className="flex items-center gap-2 py-2 px-3 hover:bg-base-200/50 rounded-md cursor-pointer text-sm text-base-content">
              <input
                type="checkbox"
                checked={showLostSubTab}
                onChange={(e) => handleToggleLost(e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary rounded-sm shrink-0"
              />
              <span>Bị mất đi</span>
            </label>
          </div>
        </RangeSelector>
      </div>

      {/* ── 2. Data Table ── */}
      <div className="overflow-x-auto grow w-full">
        <table className="table table-zebra w-full text-left">
          <thead>
            <tr className="text-base-content/40 text-sm font-semibold border-b border-base-content/8">
              {/* Checkbox hàng loạt */}
              <th className="w-10 pl-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAllLeads(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary rounded-sm cursor-pointer"
                />
              </th>

              {/* Ngày thêm — cột sort active */}
              <th 
                onClick={() => handleSort("date")}
                className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors rounded select-none"
              >
                <div className="flex items-center gap-2">
                  <span>Ngày thêm</span>
                  {renderSortIcon("date")}
                </div>
              </th>

              {/* Cột có sort bình thường */}
              {(["Tên", "Giai đoạn", "Nguồn", "Nhãn"] as const).map((col) => (
                <th 
                  key={col} 
                  onClick={() => handleSort(FIELD_MAP[col])}
                  className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors rounded select-none"
                >
                  <div className="flex items-center gap-2">
                    <span>{col}</span>
                    {renderSortIcon(FIELD_MAP[col])}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-base-content/5">
            {sortedLeads.length > 0 ? (
              sortedLeads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  stages={stages}
                  isSelected={selectedLeadIds.includes(lead.id)}
                  onSelectLead={onSelectLead}
                  onChangeStage={onChangeStage}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-base-content/40 font-medium text-sm"
                >
                  Không tìm thấy khách hàng tiềm năng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

