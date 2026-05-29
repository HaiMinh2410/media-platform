"use client";

import React, { useState } from "react";
import { X, Trash2, Check } from "lucide-react";
import { LeadStage } from "./types";
import { RangeSelector } from "@shared/ui/range-selector";
import { ConfirmDialog } from "@shared/ui/confirm-dialog";

interface LeadsBulkEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  stages: LeadStage[];
  onBulkEdit: (stageId: string) => void;
  onDeleteSelected?: () => void;
}

const BULK_DELETE_DIALOG_ID = "bulk-delete-leads-confirm";

export function LeadsBulkEditSidebar({
  isOpen,
  onClose,
  selectedCount,
  stages,
  onBulkEdit,
  onDeleteSelected,
}: LeadsBulkEditSidebarProps) {
  const [selectedStage, setSelectedStage] = useState<string>("");

  if (!isOpen) return null;

  // ── Phân nhóm stages theo phễu (đồng bộ với leads-funnel-modal) ──────────
  const topStage    = stages.find((s) => s.id === "new");
  const bottomStage = stages.find((s) => s.id === "converted");
  const doneStages  = stages.filter((s) => s.id === "lost" || s.id === "unqualified");
  const middleStages = stages.filter(
    (s) => s.id !== "new" && s.id !== "converted" && s.id !== "lost" && s.id !== "unqualified"
  );

  const selectedStageIcon  = stages.find((s) => s.id === selectedStage)?.icon;

  const handleStageChange = (stageId: string) => {
    setSelectedStage(stageId);
    onBulkEdit(stageId);
  };


  const StageItem = ({ stage }: { stage: LeadStage }) => {
    const isActive = selectedStage === stage.id;
    return (
      <button
        onClick={() => handleStageChange(stage.id)}
        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
          isActive
            ? "text-foreground bg-foreground/10"
            : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
        }`}
      >
        {stage.icon && (
          <span className="text-sm leading-none shrink-0">{stage.icon}</span>
        )}
        <span className="flex-1 text-left">{stage.label}</span>
        {isActive && (
          <Check size={12} className="shrink-0 text-foreground" />
        )}
      </button>
    );
  };

  const Divider = () => <div className="h-px bg-foreground/10 my-1 -mx-1" />;

  const handleDeleteConfirmed = () => {
    onDeleteSelected?.();
    onClose();
  };

  const openDeleteDialog = () => {
    (
      document.getElementById(BULK_DELETE_DIALOG_ID) as HTMLDialogElement
    )?.showModal();
  };

  const noSelection = selectedCount === 0;

  return (
    <div className="fixed right-0 top-0 bottom-0 h-screen w-[320px] bg-base-100 border-l border-base-200 dark:border-base-800 shadow-2xl flex flex-col gap-5 p-6 animate-slide-left select-none">
      <div>
        {/* Header Sidebar */}
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base-content pr-4">
            Đã chọn {selectedCount} khách hàng tiềm năng
          </h3>
          <button
            onClick={onClose}
            className="text-base-content/40 hover:text-base-content/75 p-1 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm font-light text-base-content/50 mt-3">
          Cập nhật người chịu trách nhiệm và giai đoạn cho mọi khách hàng tiềm
          năng đã chọn.
        </p>
      </div>

      <div className="h-px bg-base-content/10" />

      {/* Chuyển đến Giai đoạn */}
      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-base-content/60">Chuyển đến</span>
        <div className={noSelection ? "opacity-40 pointer-events-none" : ""}>
          <RangeSelector
            value={selectedStage}
            size="sm"
            menuAlign="left"
            menuMinWidth="min-w-full"
            triggerClassName="w-full h-9"
            dropdownClassName="w-full"
            hideIcon={!selectedStageIcon}
            defaultIcon={selectedStageIcon ? <span className="text-sm leading-none">{selectedStageIcon}</span> : undefined}
            onChange={handleStageChange}
            options={stages.map((s) => ({
              id: s.id,
              label: s.label,
              icon: s.icon ? () => <span className="text-sm leading-none">{s.icon}</span> : undefined,
            }))}
          >

            {topStage && <StageItem stage={topStage} />}

            <Divider />

            {middleStages.map((stage) => <StageItem key={stage.id} stage={stage} />)}
            {bottomStage && <StageItem stage={bottomStage} />}

            <Divider />

            {doneStages.map((stage) => <StageItem key={stage.id} stage={stage} />)}
          </RangeSelector>
        </div>
      </div>

      <div className="h-px bg-base-content/10" />

      {/* Xóa leads đã chọn */}
      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-base-content/60">Xóa leads</span>
        <button
          onClick={openDeleteDialog}
          disabled={noSelection}
          className="w-full btn btn-soft btn-error h-9 btn-sm rounded-md"
        >
          <Trash2 size={13} />
          Xóa {selectedCount > 0 ? `${selectedCount} ` : ""}khách hàng đã chọn
        </button>
      </div>

      <ConfirmDialog
        id={BULK_DELETE_DIALOG_ID}
        title="Xóa khách hàng tiềm năng?"
        description={`Bạn sắp xóa vĩnh viễn ${selectedCount} khách hàng tiềm năng đã chọn. Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteConfirmed}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
      />
    </div>
  );
}
