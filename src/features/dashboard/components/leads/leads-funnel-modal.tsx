import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Check, GripVertical } from "lucide-react";
import { LeadStage } from "./types";
import { cn } from "@shared/lib/utils";

interface LeadsFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: LeadStage[];
  onUpdateStages: (newStages: LeadStage[]) => void;
}

// 4 icon phễu tùy chỉnh tinh tế theo hình ảnh
const TopFunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-base-content/80">
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
  </svg>
);

const MiddleFunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-base-content/80">
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
  </svg>
);

const BottomFunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-base-content/80">
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DoneFunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-base-content/80">
    <line x1="6" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.25" />
    <path d="M4 14l5 5M9 14l-5 5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

export function LeadsFunnelModal({
  isOpen,
  onClose,
  stages,
  onUpdateStages,
}: LeadsFunnelModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input khi mở chế độ tạo mới
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Focus input khi mở chế độ sửa
  useEffect(() => {
    if (editingStageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingStageId]);

  if (!isOpen) return null;

  // Phân loại các stage
  const topStage = stages.find((s) => s.id === "new");
  const bottomStage = stages.find((s) => s.id === "converted");
  const doneStages = stages.filter(
    (s) => s.id === "lost" || s.id === "unqualified"
  );
  
  // Giai đoạn phần giữa là các giai đoạn không phải top, bottom, done
  const middleStages = stages.filter(
    (s) =>
      s.id !== "new" &&
      s.id !== "converted" &&
      s.id !== "lost" &&
      s.id !== "unqualified"
  );

  // Tạo giai đoạn mới ở Phần giữa
  const handleCreateStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    // Tránh trùng tên hoặc id
    const stageId = `custom_${trimmed.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    
    // Thêm icon mặc định
    const icons = ["⚙️", "🎯", "🔥", "💎", "💡"];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const newStage: LeadStage = {
      id: stageId,
      label: trimmed,
      count: 0,
      icon: randomIcon,
      color: "accent",
    };

    // Vị trí chèn giai đoạn mới: nằm trong phần giữa (ngay sau các phần giữa hiện tại, trước phần dưới)
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

  // Xóa giai đoạn tùy chỉnh
  const handleDeleteStage = (id: string) => {
    // Chỉ cho phép xóa các giai đoạn tùy chỉnh (không được xóa "qualified")
    if (id === "qualified") {
      alert("Không thể xóa giai đoạn mặc định 'Đủ tiêu chuẩn'!");
      return;
    }
    const updatedStages = stages.filter((s) => s.id !== id);
    onUpdateStages(updatedStages);
  };

  // Bắt đầu sửa giai đoạn
  const handleStartEdit = (stage: LeadStage) => {
    if (stage.id === "qualified") {
      alert("Không thể đổi tên giai đoạn mặc định 'Đủ tiêu chuẩn'!");
      return;
    }
    setEditingStageId(stage.id);
    setEditingName(stage.label);
  };

  // Lưu sửa giai đoạn
  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingStageId(null);
      return;
    }

    const updatedStages = stages.map((s) =>
      s.id === id ? { ...s, label: trimmed } : s
    );
    onUpdateStages(updatedStages);
    setEditingStageId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-[250] animate-fade-in p-4">
      {/* Thẻ Modal chính */}
      <div className="bg-base-100 dark:bg-base-900 border border-base-content/10 rounded-2xl w-full max-w-[500px] shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Nút đóng góc trên phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/80 hover:bg-base-200/50 p-1.5 rounded-lg transition-all cursor-pointer z-10"
        >
          <X size={16} />
        </button>

        {/* Header Modal */}
        <div className="p-5 pb-3 flex flex-col">
          <h2 className="text-base font-bold text-base-content leading-tight">
            Phễu khách hàng tiềm năng
          </h2>
          <p className="text-2xs text-base-content/50 mt-1 leading-relaxed">
            Tùy chỉnh phễu khách hàng tiềm năng bằng cách tạo, xóa, sắp xếp lại hoặc đổi tên giai đoạn.
          </p>
        </div>

        {/* Body hiển thị danh sách các Phần phễu */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4 font-sans select-none">
          
          {/* 1. PHẦN TRÊN */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-2xs font-bold text-base-content/45 tracking-wider uppercase">
              <TopFunnelIcon />
              Phần trên
            </div>
            {topStage && (
              <div className="pl-6">
                <div className="bg-base-200/30 border border-base-200/60 rounded-xl px-4 py-2 flex items-center text-xs font-semibold text-base-content/85 h-9">
                  {topStage.label}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-base-content/5 my-0.5" />

          {/* 2. PHẦN GIỮA */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-2xs font-bold text-base-content/45 tracking-wider uppercase">
              <MiddleFunnelIcon />
              Phần giữa
            </div>
            <div className="pl-6 flex flex-col gap-2">
              {/* Danh sách các stage phần giữa */}
              {middleStages.map((stage) => {
                const isCustom = stage.id !== "qualified";
                const isEditing = editingStageId === stage.id;

                return (
                  <div
                    key={stage.id}
                    className="group bg-base-200/30 hover:bg-base-200/50 border border-base-200/60 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-semibold text-base-content/85 h-9 transition-all"
                  >
                    <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
                      {/* Icon grip kéo thả (chỉ cho xem tổng quan) */}
                      <GripVertical size={13} className="text-base-content/30 shrink-0" />
                      
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleSaveEdit(stage.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(stage.id);
                            if (e.key === "Escape") setEditingStageId(null);
                          }}
                          className="bg-base-100 border border-base-300 rounded-md px-2 py-0.5 text-xs font-medium text-base-content focus:outline-hidden focus:border-primary/50 w-full h-6"
                        />
                      ) : (
                        <span className="truncate">{stage.label}</span>
                      )}
                    </div>

                    {/* Các nút chỉnh sửa/xóa (chỉ hiển thị khi hover stage tùy chỉnh) */}
                    {isCustom && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(stage)}
                          className="p-1 hover:bg-base-300 rounded text-base-content/65 cursor-pointer"
                          title="Đổi tên"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-1 hover:bg-base-300 rounded text-error/70 hover:text-error cursor-pointer"
                          title="Xóa giai đoạn"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <button
                        onClick={() => handleSaveEdit(stage.id)}
                        className="p-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-md cursor-pointer hover:bg-emerald-100 transition-all shrink-0"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Ô thêm mới giai đoạn */}
              {isAdding ? (
                <div className="flex items-center gap-1.5 w-full bg-base-200/30 border border-base-300/60 rounded-xl px-4 py-2 h-9">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tên giai đoạn mới..."
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateStage();
                      if (e.key === "Escape") setIsAdding(false);
                    }}
                    className="bg-base-100 border border-base-300 rounded-md px-2.5 py-1 text-xs font-medium text-base-content focus:outline-hidden focus:border-primary/50 flex-1 h-6.5"
                  />
                  <button
                    onClick={handleCreateStage}
                    className="p-1 bg-primary text-white dark:bg-primary/20 dark:text-primary-content rounded-md hover:opacity-90 cursor-pointer h-6.5 w-6.5 flex items-center justify-center shrink-0 transition-all"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="p-1 bg-base-300 text-base-content/75 rounded-md hover:bg-base-400 cursor-pointer h-6.5 w-6.5 flex items-center justify-center shrink-0 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-fit flex items-center gap-1.5 px-3.5 py-1.5 bg-base-200/50 hover:bg-base-200 border border-dashed border-base-300 text-base-content/65 rounded-lg text-2xs font-bold cursor-pointer transition-all active:scale-95 mt-1"
                >
                  <Plus size={11} />
                  Tạo giai đoạn
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-base-content/5 my-0.5" />

          {/* 3. PHẦN DƯỚI */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-2xs font-bold text-base-content/45 tracking-wider uppercase">
              <BottomFunnelIcon />
              Phần dưới
            </div>
            {bottomStage && (
              <div className="pl-6">
                <div className="bg-base-200/30 border border-base-200/60 rounded-xl px-4 py-2 flex items-center text-xs font-semibold text-base-content/85 h-9">
                  {bottomStage.label}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-base-content/5 my-0.5" />

          {/* 4. HOÀN TẤT */}
          <div className="flex flex-col gap-2.5 mb-1">
            <div className="flex items-center gap-2 text-2xs font-bold text-base-content/45 tracking-wider uppercase">
              <DoneFunnelIcon />
              Hoàn tất
            </div>
            <div className="pl-6 flex flex-col gap-2">
              {doneStages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-base-200/30 border border-base-200/60 rounded-xl px-4 py-2 flex items-center text-xs font-semibold text-base-content/85 h-9"
                >
                  {stage.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-base-content/5 bg-base-200/20 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-sm bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/80 font-bold rounded-lg px-4 h-8 cursor-pointer shadow-3xs transition-all text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
