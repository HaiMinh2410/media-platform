import React from "react";
import { X, ChevronDown } from "lucide-react";
import { LeadStage } from "./types";

interface LeadsBulkEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  stages: LeadStage[];
  onBulkEdit: (stageId: string) => void;
  onAssigneeChange: (assignee: string) => void;
}

export function LeadsBulkEditSidebar({
  isOpen,
  onClose,
  selectedCount,
  stages,
  onBulkEdit,
  onAssigneeChange,
}: LeadsBulkEditSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 h-screen w-[300px] bg-base-100 dark:bg-base-900 border-l border-base-200 dark:border-base-800 shadow-2xl flex flex-col gap-5 p-6 animate-slide-left select-none">
      {/* Header Sidebar */}
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-bold text-base-content leading-tight pr-4 font-brand">
          Đã chọn {selectedCount} khách hàng tiềm năng
        </h3>
        <button
          onClick={onClose}
          className="text-base-content/40 hover:text-base-content/75 p-1 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-base-content/50 font-medium">
        Cập nhật người chịu trách nhiệm và giai đoạn cho mọi khách hàng tiềm năng đã chọn.
      </p>

      <div className="h-px bg-base-content/5" />

      {/* Chuyển đến Giai đoạn */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold text-base-content/45 uppercase tracking-wider">
          Chuyển đến
        </span>
        <div className="relative">
          <select
            className="w-full text-xs bg-base-200/55 hover:bg-base-200 border border-base-300 dark:border-base-850 rounded-lg px-3 py-2 text-base-content font-semibold focus:outline-hidden cursor-pointer h-9 appearance-none pr-8"
            value=""
            onChange={(e) => {
              const stageId = e.target.value;
              if (stageId && selectedCount > 0) {
                onBulkEdit(stageId);
              } else if (selectedCount === 0) {
                alert(
                  "Vui lòng chọn ít nhất 1 khách hàng tiềm năng để thực hiện chuyển giai đoạn!"
                );
              }
            }}
          >
            <option value="" disabled>
              Chọn giai đoạn
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.icon} {stage.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/40">
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Chỉ định người chịu trách nhiệm */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold text-base-content/45 uppercase tracking-wider">
          Chi định cho
        </span>
        <div className="relative">
          <select
            className="w-full text-xs bg-base-200/55 hover:bg-base-200 border border-base-300 dark:border-base-850 rounded-lg px-3 py-2 text-base-content font-semibold focus:outline-hidden cursor-pointer h-9 appearance-none pr-8"
            value=""
            onChange={(e) => {
              const assignee = e.target.value;
              if (assignee && selectedCount > 0) {
                onAssigneeChange(assignee);
              } else if (selectedCount === 0) {
                alert(
                  "Vui lòng chọn ít nhất 1 khách hàng tiềm năng để thực hiện gán người chịu trách nhiệm!"
                );
              }
            }}
          >
            <option value="" disabled>
              Thay đổi người chịu trách nhiệm
            </option>
            <option value="Hải Minh">Hải Minh</option>
            <option value="Thư An">Thư An</option>
            <option value="Minh Dev">Minh Dev</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/40">
            <ChevronDown size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
