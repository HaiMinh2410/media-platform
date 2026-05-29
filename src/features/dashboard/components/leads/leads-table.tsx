import React from "react";
import { ArrowDown, ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Lead, LeadStage } from "./types";
import { cn } from "@shared/lib/utils";
import { Icon, MessengerIcon } from "@shared/ui/icon";

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
}

// ─── Static Maps ──────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  messenger: "Messenger",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

// Badge icon hiển thị đè lên avatar — static map để Tailwind compile đúng class
const PLATFORM_BADGE: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  messenger: {
    icon: <MessengerIcon />,
    colorClass: "text-messenger",
  },
  instagram: {
    icon: <Icon name="instagram-filled" size={10} />,
    colorClass: "text-instagram",
  },
  facebook: {
    icon: <Icon name="facebook" size={10} />,
    colorClass: "text-facebook",
  },
  tiktok: {
    icon: <Icon name="tiktok" size={10} />,
    colorClass: "text-tiktok dark:text-base-content",
  },
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: "badge-success badge-soft",
  inactive: "badge-error badge-soft",
  pending: "badge-warning badge-soft",
};

// ─── Sub-tab config (static để Tailwind compile đúng) ─────────────────────────

interface SubTabConfig {
  id: string;
  label: string;
  showCount: boolean;
  showChevron: boolean;
}

const SUB_TABS: SubTabConfig[] = [
  { id: "all", label: "Tất cả", showCount: true, showChevron: false },
  { id: "new", label: "Tiếp nhận", showCount: true, showChevron: true },
  { id: "qualified", label: "Đủ tiêu chuẩn", showCount: true, showChevron: true },
  { id: "converted", label: "Đã chuyển đổi", showCount: true, showChevron: false },
];

function getSubTabCount(tab: SubTabConfig, allLeads: Lead[], totalCount: number): number {
  if (tab.id === "all") return totalCount;
  return allLeads.filter((l) => l.stage === tab.id).length;
}

// ─── Sub-tab Component ────────────────────────────────────────────────────────

interface SubTabProps {
  tab: SubTabConfig;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function SubTab({ tab, count, isActive, onClick }: SubTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer font-bold text-xs",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-base-200/60 text-base-content/60",
      )}
    >
      <span>{tab.label}</span>
      {tab.showCount && (
        <span
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold font-mono",
            isActive
              ? "bg-primary text-primary-content"
              : "bg-base-200",
          )}
        >
          {count}
        </span>
      )}
      {tab.showChevron && (
        <ChevronDown size={11} className="opacity-50 shrink-0 -rotate-90" />
      )}
    </button>
  );
}

// ─── LeadRow Component ────────────────────────────────────────────────────────

interface LeadRowProps {
  lead: Lead;
  stages: LeadStage[];
  isSelected: boolean;
  onSelectLead: (leadId: string, isChecked: boolean) => void;
  onChangeStage: (leadId: string, newStageId: string) => void;
}

function LeadRow({ lead, stages, isSelected, onSelectLead, onChangeStage }: LeadRowProps) {
  const currentStageLabel = stages.find((s) => s.id === lead.stage)?.label ?? lead.stage;

  return (
    <tr className="hover:bg-base-200/20 transition-colors text-xs text-base-content/85">
      {/* Checkbox */}
      <td className="pl-3 py-2.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectLead(lead.id, e.target.checked)}
          className="checkbox checkbox-xs checkbox-primary rounded-sm cursor-pointer"
        />
      </td>

      {/* Ngày thêm */}
      <td className="py-2.5 px-3 font-medium text-base-content/55 tabular-nums">
        {lead.date}
      </td>

      {/* Tên & Avatar với badge platform */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar daisyUI */}
          <div className="avatar avatar-placeholder relative shrink-0">
            <div className="w-8 rounded-full bg-base-300 text-base-content/70 border border-base-content/5">
              {lead.avatar ? (
                <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{lead.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Platform badge — hiển thị đầy đủ theo platform */}
            {PLATFORM_BADGE[lead.platform] && (
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 bg-base-100 rounded-full p-0.5 shadow-sm border border-base-content/5 flex items-center justify-center",
                  PLATFORM_BADGE[lead.platform].colorClass,
                )}
              >
                {PLATFORM_BADGE[lead.platform].icon}
              </div>
            )}
          </div>

          <span className="font-semibold text-base-content hover:text-primary cursor-pointer transition-colors">
            {lead.name}
          </span>
        </div>
      </td>

      {/* Dropdown Giai đoạn */}
      <td className="py-2.5 px-3">
        <details className="dropdown dropdown-bottom">
          <summary className="flex items-center gap-1.5 px-2.5 py-1 bg-base-200 hover:bg-base-300 text-base-content/80 rounded-lg font-semibold cursor-pointer border border-base-content/5 w-fit text-2xs list-none select-none transition-colors">
            <span>{currentStageLabel}</span>
            <ChevronDown size={11} className="opacity-50 shrink-0" />
          </summary>
          <ul className="dropdown-content menu p-1.5 shadow-lg bg-base-100 rounded-xl w-44 z-50 border border-base-content/10 mt-1">
            <li className="menu-title text-3xs font-bold uppercase text-base-content/40 tracking-widest">
              Chuyển sang:
            </li>
            {stages.map((stage) => (
              <li key={stage.id}>
                <button
                  onClick={() => onChangeStage(lead.id, stage.id)}
                  className="text-xs py-1.5 cursor-pointer"
                >
                  {stage.icon} {stage.label}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </td>

      {/* Badge Nguồn */}
      <td className="py-2.5 px-3">
        <span className="badge badge-ghost badge-sm font-semibold text-base-content/70">
          {lead.source}
        </span>
      </td>

      {/* Dropdown Chỉ định cho */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-base-200 hover:bg-base-300 text-base-content/60 rounded-lg font-semibold cursor-pointer border border-base-content/5 w-fit text-2xs transition-colors">
          <span>Chưa chỉ định</span>
          <ChevronDown size={11} className="opacity-50 shrink-0" />
        </div>
      </td>

      {/* Kênh */}
      <td className="py-2.5 px-3 text-base-content/60 font-medium">
        {PLATFORM_LABEL[lead.platform] ?? lead.platform}
      </td>

      {/* Trạng thái */}
      <td className="py-2.5 px-3">
        <span
          className={cn(
            "badge badge-xs font-semibold",
            STATUS_BADGE_CLASS["active"],
          )}
        >
          Hoạt động
        </span>
      </td>

      {/* Lời nhắc */}
      <td className="py-2.5 px-3 pr-3 text-base-content/35 italic text-xs">
        Không có
      </td>
    </tr>
  );
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
}: LeadsTableProps) {
  const totalCount = allLeads.length;
  const isAllSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l.id));

  return (
    <div className="flex flex-col gap-4 w-full bg-base-100 p-4 border border-base-content/5 rounded-lg shadow-sm">
      {/* ── 1. Sub-tab Filter Bar ── */}
      <div className="flex items-center justify-between border-b border-base-content/8 pb-2.5 overflow-x-auto w-full">
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {SUB_TABS.map((tab, idx) => (
            <React.Fragment key={tab.id}>
              <SubTab
                tab={tab}
                count={getSubTabCount(tab, allLeads, totalCount)}
                isActive={currentSubTab === tab.id}
                onClick={() => onSubTabChange(tab.id)}
              />
              {/* Divider sau tab "Tất cả" */}
              {idx === 0 && (
                <div className="h-4 w-px bg-base-content/15 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Nút tùy chọn góc phải */}
        <button className="btn btn-ghost btn-sm btn-square text-base-content/40 shrink-0">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* ── 2. Data Table ── */}
      <div className="overflow-x-auto w-full">
        <table className="table table-zebra w-full text-left">
          <thead>
            <tr className="text-base-content/40 text-3xs font-bold uppercase tracking-widest font-mono border-b border-base-content/8">
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
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors rounded">
                <div className="flex items-center gap-1">
                  <span>Ngày thêm</span>
                  <ArrowDown size={12} className="text-primary shrink-0" />
                </div>
              </th>

              {/* Cột có sort bình thường */}
              {(["Tên", "Giai đoạn", "Nguồn", "Chỉ định cho", "Kênh", "Trạng thái"] as const).map((col) => (
                <th key={col} className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors rounded">
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown size={11} className="opacity-40 shrink-0" />
                  </div>
                </th>
              ))}

              {/* Cột không sort */}
              <th className="py-3 px-3 pr-3">
                <span>Lời nhắc</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-base-content/5">
            {leads.length > 0 ? (
              leads.map((lead) => (
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
                  colSpan={9}
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
