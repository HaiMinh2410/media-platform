'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LeadsStats } from './leads/leads-stats';
import { LeadsFilters } from './leads/leads-filters';
import { KanbanColumn } from './leads/kanban-column';
import { LeadsTable } from './leads/leads-table';
import { LeadsFunnelModal } from './leads/leads-funnel-modal';
import { LeadsBulkEditSidebar } from './leads/leads-bulk-edit-sidebar';
import { useLeads } from './leads/hooks/use-leads';

interface LeadsCenterTabProps {
  workspaceId?: string;
}

export function LeadsCenterTab({ workspaceId = "default-workspace" }: LeadsCenterTabProps) {
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

  return (
    <div className="flex flex-col gap-5 h-full text-base-content w-full animate-fade-in relative pb-10">
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
      <LeadsStats leads={leads} />
      
      {/* 3. Vùng nội dung chính */}
      <div className="flex gap-4 w-full items-start">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <span className="loading loading-ring loading-lg text-primary"></span>
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar w-full items-start min-h-[500px]">
              {/* Render các cột Kanban động theo stages */}
              {stages.map((stage) => {
                // Ẩn 2 giai đoạn mặc định đặc biệt nếu người dùng không chọn hiển thị
                if (stage.id === 'lost' && !showLost) return null;
                if (stage.id === 'unqualified' && !showUnqualified) return null;

                const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
                return (
                  <KanbanColumn 
                    key={stage.id} 
                    stage={stage} 
                    leads={stageLeads} 
                    stages={stages}
                    onChangeStage={handleChangeStage}
                    onDeleteLead={handleDeleteLead}
                    isBulkEditing={isBulkEditing}
                    selectedLeadIds={selectedLeadIds}
                    onSelectLead={handleSelectLead}
                    onSelectAllLeadsInStage={handleSelectAllLeadsInStage}
                  />
                );
              })}
              
              {/* Cột 4: Thêm giai đoạn tùy chỉnh */}
              {!isBulkEditing && (
                <div className="min-w-[300px] max-w-[300px] bg-base-100 border border-base-content/5 shadow-xs rounded-2xl p-4 flex flex-col justify-center items-center h-full min-h-[480px] shrink-0 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-98">
                  {/* Hình minh họa các block */}
                  <div className="relative w-28 h-28 mb-4 flex items-center justify-center bg-base-200/50 rounded-2xl border border-base-content/5">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Khung block 1 */}
                      <rect x="12" y="10" width="40" height="12" rx="4" className="fill-primary/10 stroke-primary" strokeWidth="1.5" />
                      <circle cx="18" cy="16" r="2" className="fill-primary" />
                      <rect x="24" y="14" width="16" height="4" rx="1" className="fill-primary/40" />
                      
                      {/* Khung block 2 */}
                      <rect x="12" y="26" width="40" height="12" rx="4" className="fill-secondary/10 stroke-secondary" strokeWidth="1.5" />
                      <circle cx="18" cy="32" r="2" className="fill-secondary" />
                      <rect x="24" y="30" width="16" height="4" rx="1" className="fill-secondary/40" />
                      
                      {/* Khung block 3 */}
                      <rect x="12" y="42" width="40" height="12" rx="4" className="fill-primary/10 stroke-primary" strokeWidth="1.5" />
                      <circle cx="18" cy="48" r="2" className="fill-primary" />
                      <rect x="24" y="46" width="16" height="4" rx="1" className="fill-primary/40" />
      
                      {/* Trỏ chuột click */}
                      <path d="M46 36 L52 48 L48 50 L42 42 L38 46 L38 34 L46 36 Z" className="fill-base-content stroke-base-100" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  </div>
                  
                  <h3 className="text-sm font-bold text-base-content/88 mb-2 font-brand">Thêm giai đoạn tùy chỉnh</h3>
                  <p className="text-2xs leading-relaxed max-w-[220px] text-base-content/50 mb-5 font-medium">
                    Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.
                  </p>
                  <button 
                    onClick={() => handleAddStage()}
                    className="btn btn-sm btn-primary rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 px-4"
                  >
                    Thêm giai đoạn tùy chỉnh
                  </button>
                </div>
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
        onAssigneeChange={(assignee) => {
          setToast({
            show: true,
            message: `Đã chỉ định hàng loạt ${selectedLeadIds.length} khách hàng cho "${assignee}".`,
            type: 'success'
          });
          setSelectedLeadIds([]); // Reset selection
          setIsBulkEditing(false);
        }}
      />

      {/* 4. Giao diện Toast thông báo nổi tuyệt đẹp */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-200 animate-slide-in">
          <div className={`alert rounded-xl shadow-lg p-3 flex items-center gap-2 border border-base-content/5 text-xs font-bold ${
            toast.type === 'success' ? 'alert-success text-success-content' : 'alert-info text-info-content'
          }`}>
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
