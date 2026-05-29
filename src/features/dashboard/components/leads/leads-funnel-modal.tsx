import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Check, GripVertical } from "lucide-react";
import { LeadStage } from "./types";
import { cn } from "@shared/lib/utils";
import { ConfirmDialog } from "@shared/ui/confirm-dialog";
import {
  TopFunnelIcon,
  MiddleFunnelIcon,
  BottomFunnelIcon,
  DoneFunnelIcon,
} from "@shared/ui/icon";

interface LeadsFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: LeadStage[];
  onUpdateStages: (newStages: LeadStage[]) => void;
}

// ─── Reusable Stage Row ───────────────────────────────────────────────────────

interface StageRowProps {
  stage: LeadStage;
  isEditing: boolean;
  editingName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onStartEdit: (stage: LeadStage) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onDeleteRequest: (stage: LeadStage) => void;
}

function StageRow({
  stage,
  isEditing,
  editingName,
  editInputRef,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onDeleteRequest,
}: StageRowProps) {
  const isCustom = stage.id !== "qualified";

  return (
    <div
      className={cn(
        "group border-b border-base-content/10 px-4 py-2 flex items-center justify-between text-xs font-semibold text-base-content/85 h-9 transition-all",
        !isEditing && "hover:bg-soft/80 hover:rounded-xl"
      )}
    >
      <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
        <GripVertical size={13} className="text-base-content/30 shrink-0" />

        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onBlur={() => onSaveEdit(stage.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(stage.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            className="input input-xs bg-base-100 border-base-300 focus:border-primary/50 text-base-content w-full h-6 text-xs font-medium"
          />
        ) : (
          <span className="truncate">{stage.label}</span>
        )}
      </div>

      {/* Nút chỉnh sửa / xóa — chỉ hiện khi hover, stage tùy chỉnh, không đang edit */}
      {isCustom && !isEditing && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={() => onStartEdit(stage)}
            className="btn btn-ghost btn-xs p-1 text-base-content/60"
            title="Đổi tên"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDeleteRequest(stage)}
            className="btn btn-ghost btn-xs p-1 text-error/70 hover:text-error"
            title="Xóa giai đoạn"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Nút lưu khi đang edit */}
      {isEditing && (
        <button
          onClick={() => onSaveEdit(stage.id)}
          className="btn btn-success btn-xs p-1 shrink-0"
          title="Lưu"
        >
          <Check size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadsFunnelModal({
  isOpen,
  onClose,
  stages,
  onUpdateStages,
}: LeadsFunnelModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDeleteStage, setPendingDeleteStage] = useState<LeadStage | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  useEffect(() => {
    if (editingStageId && editInputRef.current) editInputRef.current.focus();
  }, [editingStageId]);

  // Mở/đóng dialog native thông qua daisyUI modal
  useEffect(() => {
    const dialog = document.getElementById("leads-funnel-modal") as HTMLDialogElement | null;
    if (!dialog) return;
    if (isOpen) dialog.showModal();
    else dialog.close();
  }, [isOpen]);

  // ─── Phân loại stages ──────────────────────────────────────────────────────

  const FIXED_IDS = new Set(["new", "converted", "lost", "unqualified"]);
  const topStage = stages.find((s) => s.id === "new");
  const bottomStage = stages.find((s) => s.id === "converted");
  const doneStages = stages.filter((s) => s.id === "lost" || s.id === "unqualified");
  const middleStages = stages.filter((s) => !FIXED_IDS.has(s.id));

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) {
      setNameError(true);
      inputRef.current?.focus();
      return;
    }

    const stageId = `custom_${trimmed.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    const icons = ["⚙️", "🎯", "🔥", "💎", "💡"];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const newStage: LeadStage = {
      id: stageId,
      label: trimmed,
      count: 0,
      icon: randomIcon,
      color: "accent",
    };

    const convertedIndex = stages.findIndex((s) => s.id === "converted");
    const updatedStages = [...stages];
    if (convertedIndex !== -1) {
      updatedStages.splice(convertedIndex, 0, newStage);
    } else {
      updatedStages.push(newStage);
    }

    onUpdateStages(updatedStages);
    setNewStageName("");
    setIsAdding(false);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteStage) return;
    onUpdateStages(stages.filter((s) => s.id !== pendingDeleteStage.id));
    setPendingDeleteStage(null);
  };

  const handleDeleteRequest = (stage: LeadStage) => {
    setPendingDeleteStage(stage);
    const dialog = document.getElementById("confirm-delete-stage") as HTMLDialogElement | null;
    dialog?.showModal();
  };

  const handleStartEdit = (stage: LeadStage) => {
    setEditingStageId(stage.id);
    setEditingName(stage.label);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingStageId(null);
      return;
    }
    onUpdateStages(stages.map((s) => (s.id === id ? { ...s, label: trimmed } : s)));
    setEditingStageId(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* DaisyUI Modal — sử dụng thẻ <dialog> tiêu chuẩn */}
      <dialog
        id="leads-funnel-modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
      >
        <div className="modal-box bg-base-100 border border-base-content/10 rounded-xl w-full max-w-lg p-0 flex flex-col max-h-[85vh] overflow-hidden">

          {/* Nút đóng góc trên phải */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs absolute top-4 right-4 text-base-content/40 hover:text-base-content/80 p-1.5 z-10"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="p-5 pb-3 flex flex-col">
            <h2 className="text-lg font-semibold text-base-content leading-tight">
              Phễu khách hàng tiềm năng
            </h2>
            <p className="text-xs text-base-content/50 mt-1.5">
              Tùy chỉnh phễu khách hàng tiềm năng bằng cách tạo, xóa, sắp xếp lại hoặc đổi tên giai đoạn.
            </p>
          </div>

          {/* Body — danh sách phân vùng phễu */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 font-sans select-none">

            {/* 1. PHẦN TRÊN */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel icon={<TopFunnelIcon />} label="Phần trên" />
              {topStage && (
                <ReadOnlyStageRow label={topStage.label} />
              )}
            </div>


            {/* 2. PHẦN GIỮA */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel icon={<MiddleFunnelIcon />} label="Phần giữa" />
              <div className="flex flex-col gap-2">
                {middleStages.map((stage) => (
                  <StageRow
                    key={stage.id}
                    stage={stage}
                    isEditing={editingStageId === stage.id}
                    editingName={editingName}
                    editInputRef={editInputRef}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingStageId(null)}
                    onEditingNameChange={setEditingName}
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))}

                {/* Ô thêm mới giai đoạn */}
                {isAdding ? (
                  <div className="flex flex-col gap-1">
                    <div className={cn(
                      "flex items-center gap-1.5 w-full border rounded-xl px-4 py-2 h-10 transition-colors",
                      nameError ? "border-error/60" : "border-base-content/10"
                    )}>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Nhập giai đoạn mới..."
                        value={newStageName}
                        onChange={(e) => {
                          setNewStageName(e.target.value);
                          if (nameError) setNameError(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateStage();
                          if (e.key === "Escape") {
                            setIsAdding(false);
                            setNameError(false);
                            setNewStageName("");
                          }
                        }}
                        className="input input-sm shadow-none focus:outline-none text-base-content text-sm flex-1 h-8 border-none"
                      />
                      <button
                        onClick={handleCreateStage}
                        className="btn btn-primary btn-xs h-6 w-6 p-0 min-h-0 flex items-center justify-center shrink-0"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNameError(false);
                          setNewStageName("");
                        }}
                        className="btn btn-ghost btn-xs h-6 w-6 p-0 min-h-0 flex items-center justify-center shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {nameError && (
                      <p className="text-2xs text-error font-medium px-1">
                        Không được để trống tên giai đoạn.
                      </p>
                    )}
                  </div>

                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="btn btn-soft hover:bg-soft/60 w-fit btn-sm rounde-md"
                  >
                    <Plus size={11} />
                    Tạo giai đoạn
                  </button>
                )}
              </div>
            </div>


            {/* 3. PHẦN DƯỚI */}
            <div className="flex flex-col gap-2.5">
              <SectionLabel icon={<BottomFunnelIcon />} label="Phần dưới" />
              {bottomStage && (
                <ReadOnlyStageRow label={bottomStage.label} />
              )}
            </div>


            {/* 4. HOÀN TẤT */}
            <div className="flex flex-col gap-2.5 mb-1">
              <SectionLabel icon={<DoneFunnelIcon />} label="Hoàn tất" />
              <div className="flex flex-col gap-2">
                {doneStages.map((stage) => (
                  <ReadOnlyStageRow key={stage.id} label={stage.label} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop click để đóng */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </dialog>

      {/* ConfirmDialog xóa stage — dùng shared component */}
      <ConfirmDialog
        id="confirm-delete-stage"
        title="Xóa giai đoạn"
        description={
          pendingDeleteStage
            ? `Bạn có chắc muốn xóa giai đoạn "${pendingDeleteStage.label}"? Thao tác này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-error"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-base-content/45 ">
      {icon}
      {label}
    </div>
  );
}

function ReadOnlyStageRow({ label }: { label: string }) {
  return (
    <div className="border-b border-base-content/20 mx-2 p-2 flex items-center text-xs font-semibold text-base-content/85 h-9">
      {label}
    </div>
  );
}
