'use client';

import { cn } from "@shared/lib";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { LeadsStats } from "./leads-stats";
import { LeadsFilters } from "./leads-filters";
import { KanbanColumn } from "./kanban-column";
import { LeadsTable } from "./leads-table";
import { LeadsFunnelModal } from "./leads-funnel-modal";
import { LeadsBulkEditSidebar } from "./leads-bulk-edit-sidebar";
import { useLeads } from "../hooks/use-leads";

interface LeadsCenterTabProps {
  workspaceId?: string;
}

export function LeadsCenterTab({
  workspaceId = "default-workspace",
}: LeadsCenterTabProps) {
  const {
    viewMode,
    setViewMode,
    selectedGroupId,
    isFunnelModalOpen,
    setIsFunnelModalOpen,
    isBulkEditing,
    setIsBulkEditing,
    handleGroupChange,
    stages,
    setStages,
    leads,
    loading,
    selectedLeadIds,
    setSelectedLeadIds,
    currentSubTab,
    setCurrentSubTab,
    showLost,
    setShowLost,
    showUnqualified,
    setShowUnqualified,
    showUnreadOnly,
    setShowUnreadOnly,
    filters,
    toast,
    setToast,
    filteredLeads,
    handleAddStage,
    handleChangeStage,
    handleDeleteLead,
    handleBulkEdit,
    handleSelectLead,
    handleSelectAllLeads,
    handleFilterChange,
    handleSelectAllLeadsInStage,
  } = useLeads(workspaceId);

  const DEFAULT_STAGE_IDS = [
    "new",
    "qualified",
    "converted",
    "unqualified",
    "lost",
  ];
  const [draggedColumnId, setDraggedColumnId] = React.useState<string | null>(
    null,
  );

  // Tự động mở/đóng sidebar khi có/không còn leads được chọn
  React.useEffect(() => {
    if (selectedLeadIds.length > 0 && !isBulkEditing) {
      setIsBulkEditing(true);
    } else if (selectedLeadIds.length === 0 && isBulkEditing) {
      setIsBulkEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadIds.length]);

  const handleColumnDragStart = (e: React.DragEvent, stageId: string) => {
    if (DEFAULT_STAGE_IDS.includes(stageId)) {
      e.preventDefault();
      return;
    }
    setDraggedColumnId(stageId);
    e.dataTransfer.setData("text/column-id", stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (e: React.DragEvent, targetStageId: string) => {
    if (
      DEFAULT_STAGE_IDS.includes(targetStageId) ||
      !draggedColumnId ||
      draggedColumnId === targetStageId
    ) {
      return;
    }
    e.preventDefault();
  };

  const handleColumnDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const sourceStageId =
      e.dataTransfer.getData("text/column-id") || draggedColumnId;
    if (
      !sourceStageId ||
      sourceStageId === targetStageId ||
      DEFAULT_STAGE_IDS.includes(targetStageId) ||
      DEFAULT_STAGE_IDS.includes(sourceStageId)
    ) {
      setDraggedColumnId(null);
      return;
    }

    const sourceIndex = stages.findIndex((s) => s.id === sourceStageId);
    const targetIndex = stages.findIndex((s) => s.id === targetStageId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updatedStages = [...stages];
      const [removed] = updatedStages.splice(sourceIndex, 1);
      updatedStages.splice(targetIndex, 0, removed);
      setStages(updatedStages);
    }
    setDraggedColumnId(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
  };

  return (
    <div className="flex flex-col gap-5 h-full text-base-content w-full animate-fade-in relative min-h-0 flex-1">
      {/* Aurora glow effect */}
      <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      {/* 1. Bộ lọc và Chuyển chế độ xem */}
      <LeadsFilters
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setSelectedLeadIds([]); // Reset lựa chọn khi đổi view
        }}
        onAddStage={() => handleAddStage()}
        selectedCount={selectedLeadIds.length}
        onBulkEdit={handleBulkEdit}
        stages={stages}
        leads={leads}
        filters={filters}
        onFilterChange={handleFilterChange}
        showLost={showLost}
        onToggleLost={() => setShowLost(!showLost)}
        showUnqualified={showUnqualified}
        onToggleUnqualified={() => setShowUnqualified(!showUnqualified)}
        showUnreadOnly={showUnreadOnly}
        onToggleUnreadOnly={() => setShowUnreadOnly(!showUnreadOnly)}
        workspaceId={workspaceId}
        selectedGroupId={selectedGroupId}
        onChangeGroup={handleGroupChange}
        isBulkEditing={isBulkEditing}
        onToggleBulkEditing={() => {
          setIsBulkEditing(!isBulkEditing);
          setSelectedLeadIds([]); // Reset khi toggle
        }}
      />

      {/* 2. Thanh đo lường hiệu suất (Bento Stats) */}
      <LeadsStats 
        leads={filteredLeads} 
        allLeads={leads}
        selectedGroupId={selectedGroupId}
        dateFilter={filters.date}
      />

      {/* 3. Vùng nội dung chính */}
      <div className="flex gap-4 w-full items-stretch flex-1 min-h-0">
        <div className="flex-1 min-w-0 h-full flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <span className="loading loading-ring loading-lg text-primary"></span>
            </div>
          ) : viewMode === "kanban" ? (
            <div className="flex gap-2.5 overflow-x-auto w-full items-stretch flex-1 min-h-0 kanban-scrollbar">
              {/* Render các cột Kanban động theo stages */}
              {stages.map((stage) => {
                // Ẩn 2 giai đoạn mặc định đặc biệt nếu người dùng không chọn hiển thị
                if (stage.id === "lost" && !showLost) return null;
                if (stage.id === "unqualified" && !showUnqualified) return null;

                const stageLeads = filteredLeads.filter(
                  (l) => l.stage === stage.id,
                );
                const isDefault = DEFAULT_STAGE_IDS.includes(stage.id);
                return (
                  <div
                    key={stage.id}
                    draggable={!isDefault}
                    onDragStart={(e) => handleColumnDragStart(e, stage.id)}
                    onDragOver={(e) => handleColumnDragOver(e, stage.id)}
                    onDrop={(e) => handleColumnDrop(e, stage.id)}
                    onDragEnd={handleColumnDragEnd}
                    className={cn(
                      "transition-all duration-300 rounded-lg",
                      !isDefault && "cursor-grab active:cursor-grabbing",
                      draggedColumnId === stage.id
                        ? "opacity-35 scale-[0.98]"
                        : "opacity-100",
                      !isDefault &&
                        draggedColumnId &&
                        draggedColumnId !== stage.id &&
                        "hover:border-dashed hover:border-primary/40 hover:scale-[1.01]",
                    )}
                  >
                    <KanbanColumn
                      stage={stage}
                      leads={stageLeads}
                      stages={stages}
                      onChangeStage={handleChangeStage}
                      onDeleteLead={handleDeleteLead}
                      isBulkEditing={isBulkEditing}
                      selectedLeadIds={selectedLeadIds}
                      onSelectLead={handleSelectLead}
                      onSelectAllLeadsInStage={handleSelectAllLeadsInStage}
                      onUpdateStages={setStages}
                      isAllClusters={!selectedGroupId}
                    />
                  </div>
                );
              })}

              {/* Cột Thêm giai đoạn tùy chỉnh */}
              {!isBulkEditing && (
                <KanbanColumn isAddStageColumn onAddStage={handleAddStage} />
              )}
            </div>
          ) : (
            /* Detailed Table View */
            <LeadsTable
              leads={filteredLeads}
              allLeads={leads}
              stages={stages}
              selectedLeadIds={selectedLeadIds}
              onSelectLead={handleSelectLead}
              onSelectAllLeads={handleSelectAllLeads}
              onChangeStage={handleChangeStage}
              currentSubTab={currentSubTab}
              onSubTabChange={(tabId) => {
                setCurrentSubTab(tabId);
                setSelectedLeadIds([]); // Reset selection when subtab changes
              }}
              showUnreadOnly={showUnreadOnly}
              onToggleUnreadOnly={() => setShowUnreadOnly(!showUnreadOnly)}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar Chỉnh sửa hàng loạt */}
      <LeadsBulkEditSidebar
        isOpen={isBulkEditing}
        onClose={() => {
          setIsBulkEditing(false);
          setSelectedLeadIds([]);
        }}
        selectedCount={selectedLeadIds.length}
        stages={stages}
        onBulkEdit={(stageId) => {
          handleBulkEdit(stageId);
          setIsBulkEditing(false);
        }}
        onDeleteSelected={() => {
          // TODO: gọi API xóa hàng loạt khi có backend
          setToast({
            show: true,
            message: `Đã xóa ${selectedLeadIds.length} khách hàng tiềm năng.`,
            type: "success",
          });
          setSelectedLeadIds([]);
          setIsBulkEditing(false);
        }}
      />

      {/* 4. Giao diện Toast thông báo nổi tuyệt đẹp */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-200 animate-slide-in">
          <div
            className={`alert rounded-xl shadow-lg p-3 flex items-center gap-2 border border-base-content/5 text-xs font-bold ${
              toast.type === "success"
                ? "alert-success text-success-content"
                : "alert-info text-info-content"
            }`}
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 5. Popup tùy chỉnh Phễu khách hàng tiềm năng */}
      <LeadsFunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
        stages={stages}
        onUpdateStages={setStages}
      />
    </div>
  );
}
