'use client';
 
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { LeadsStats } from './leads/leads-stats';
import { LeadsFilters } from './leads/leads-filters';
import { KanbanColumn } from './leads/kanban-column';
import { LeadsTable } from './leads/leads-table';
import { LEAD_STAGES } from './leads/constants';
import { Lead, LeadStage } from './leads/types';
import { useInboxStore } from '../../inbox/store/inbox.store';
import { getLeadsFromDB, updateLeadStageInDB, deleteLeadInDB } from '../actions/dashboard.actions';

interface LeadsCenterTabProps {
  workspaceId?: string;
}

export function LeadsCenterTab({ workspaceId = "default-workspace" }: LeadsCenterTabProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const { accountGroups } = useInboxStore();
  
  // Quản lý cụm tài khoản hiện tại được lọc
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Đọc giá trị đã lưu từ localStorage sau khi mounted để tránh lỗi Hydration Mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leads_selected_group_id');
      if (saved) {
        setSelectedGroupId(saved);
      }
    }
  }, []);

  const handleGroupChange = (id: string | null) => {
    setSelectedGroupId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('leads_selected_group_id', id);
      } else {
        localStorage.removeItem('leads_selected_group_id');
      }
    }
  };
  
  // 1. Quản lý trạng thái bằng React State
  const [stages, setStages] = useState<LeadStage[]>(LEAD_STAGES);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentSubTab, setCurrentSubTab] = useState<string>('all');

  // Tải danh sách leads thực tế từ DB khi mounted
  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      getLeadsFromDB(workspaceId)
        .then((dbLeads) => {
          setLeads(dbLeads);
        })
        .catch((err) => {
          console.error("Failed to load leads from DB:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [workspaceId]);
  
  // Trạng thái hiển thị các cột đặc biệt và lọc chưa đọc
  const [showLost, setShowLost] = useState(false);
  const [showUnqualified, setShowUnqualified] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  // Trạng thái bộ lọc thông minh
  const [filters, setFilters] = useState({
    source: 'all',
    stage: 'all',
    campaign: 'all',
    form: 'all',
    date: 'all'
  });

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Tự động tắt Toast sau 3 giây
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // 2. Logic Lọc dữ liệu khách hàng
  const selectedGroup = accountGroups.find((g) => g.id === selectedGroupId);

  const filteredLeads = leads.filter((lead) => {
    // Lọc theo sub-tab (trong chế độ xem bảng)
    const matchesSubTab = viewMode === 'table' && currentSubTab !== 'all'
      ? lead.stage === currentSubTab
      : true;

    // Lọc chỉ hiển thị khách hàng tiềm năng chưa đọc
    const matchesUnreadOnly = showUnreadOnly ? lead.unread === true : true;

    // Lọc theo cụm tài khoản được chọn (chỉ giữ lại những leads thuộc tài khoản thành viên trong cụm)
    const matchesCluster = selectedGroup
      ? selectedGroup.members.some((member) => member.id === lead.accountId)
      : true;

    // Lọc theo dropdown Trạng thái
    const matchesStageFilter = filters.stage !== 'all'
      ? lead.stage === filters.stage
      : true;

    // Lọc theo dropdown Nguồn
    const matchesSource = filters.source !== 'all'
      ? lead.source === filters.source
      : true;

    // Lọc theo dropdown Chiến dịch (giả lập)
    const matchesCampaign = filters.campaign !== 'all'
      ? (filters.campaign === 'Chiến dịch Hè 2026' ? lead.id !== '3' : lead.id === '3')
      : true;

    // Lọc theo dropdown Mẫu (giả lập)
    const matchesForm = filters.form !== 'all'
      ? (filters.form === 'Đăng ký nhận báo giá' ? lead.id === '1' : lead.id !== '1')
      : true;

    // Lọc theo ngày (giả lập)
    const matchesDate = filters.date !== 'all'
      ? true // Mock data đều hiển thị trong hôm nay
      : true;

    return matchesSubTab && matchesUnreadOnly && matchesCluster && matchesStageFilter && matchesSource && matchesCampaign && matchesForm && matchesDate;
  });

  // 3. Cơ chế thêm giai đoạn tùy chỉnh (test1, test2...)
  const handleAddStage = (name?: string) => {
    const stageName = typeof name === 'string' 
      ? name 
      : prompt("Nhập tên giai đoạn tùy chỉnh mới:")?.trim();

    if (!stageName) return;

    // Tránh trùng tên hoặc id
    const stageId = `custom_${stageName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Thêm icon mặc định đẹp
    const icons = ['⚙️', '🎯', '🔥', '💎', '💡'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const newStage: LeadStage = {
      id: stageId,
      label: stageName,
      count: 0,
      icon: randomIcon,
      color: 'accent'
    };

    setStages([...stages, newStage]);
    
    setToast({
      show: true,
      message: `Đã thêm giai đoạn tùy chỉnh "${stageName}" thành công!`,
      type: 'success'
    });
  };

  // 4. Cơ chế di chuyển & Cập nhật giai đoạn
  const handleChangeStage = async (leadId: string, newStageId: string) => {
    // Cập nhật local state trước để UI phản hồi lập tức (Optimistic Update)
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, stage: newStageId } : lead
      )
    );

    const stageLabel = stages.find(s => s.id === newStageId)?.label || newStageId;
    const leadName = leads.find(l => l.id === leadId)?.name || 'Khách hàng';

    try {
      await updateLeadStageInDB(leadId, newStageId);
      
      setToast({
        show: true,
        message: `Đã chuyển ${leadName} sang giai đoạn "${stageLabel}".`,
        type: 'info'
      });
    } catch (err) {
      console.error("Failed to update lead stage in DB:", err);
      setToast({
        show: true,
        message: `Lỗi kết nối DB khi cập nhật giai đoạn!`,
        type: 'info'
      });
    }
  };

  // Cơ chế xóa khách hàng tiềm năng
  const handleDeleteLead = async (leadId: string) => {
    const leadName = leads.find(l => l.id === leadId)?.name || 'Khách hàng';
    
    // Cập nhật local state trước
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    setSelectedLeadIds(prev => prev.filter(id => id !== leadId));

    try {
      await deleteLeadInDB(leadId);

      setToast({
        show: true,
        message: `Đã xóa khách hàng tiềm năng "${leadName}" thành công!`,
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to delete lead in DB:", err);
      setToast({
        show: true,
        message: `Lỗi kết nối DB khi xóa khách hàng tiềm năng!`,
        type: 'info'
      });
    }
  };

  // 5. Thao tác hàng loạt (Chỉnh sửa hàng loạt)
  const handleBulkEdit = (newStageId: string) => {
    if (selectedLeadIds.length === 0) return;

    setLeads(prevLeads =>
      prevLeads.map(lead =>
        selectedLeadIds.includes(lead.id) ? { ...lead, stage: newStageId } : lead
      )
    );

    const stageLabel = stages.find(s => s.id === newStageId)?.label || newStageId;
    const count = selectedLeadIds.length;

    setSelectedLeadIds([]); // Reset selection
    
    setToast({
      show: true,
      message: `Đã cập nhật hàng loạt ${count} khách hàng sang "${stageLabel}".`,
      type: 'success'
    });
  };

  // Quản lý tích chọn checkbox từng lead
  const handleSelectLead = (leadId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedLeadIds(prev => [...prev, leadId]);
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  // Tích chọn toàn bộ lead trong view hiện tại
  const handleSelectAllLeads = (isChecked: boolean) => {
    if (isChecked) {
      const activeIds = filteredLeads.map(l => l.id);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...activeIds])));
    } else {
      const activeIds = filteredLeads.map(l => l.id);
      setSelectedLeadIds(prev => prev.filter(id => !activeIds.includes(id)));
    }
  };

  // Thay đổi bộ lọc dropdown
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 6. Lưu trữ & Xuất dữ liệu ra CSV thật
  const handleDownload = () => {
    if (filteredLeads.length === 0) {
      alert("Không có dữ liệu khách hàng tiềm năng nào phù hợp để xuất file!");
      return;
    }

    // Tiêu đề cột
    const headers = ['ID', 'Tên khách hàng', 'Ngày thêm', 'Giai đoạn', 'Nguồn', 'Kênh tiếp cận'];
    
    // Nội dung dữ liệu
    const rows = filteredLeads.map(lead => [
      lead.id,
      `"${lead.name.replace(/"/g, '""')}"`, // escape quotes
      lead.date,
      `"${stages.find(s => s.id === lead.stage)?.label || lead.stage}"`,
      `"${lead.source}"`,
      lead.platform === 'messenger' ? 'Messenger' : lead.platform
    ]);

    // Tạo file CSV với BOM để hiển thị tiếng Việt chính xác trong Excel
    const csvContent = '\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `media_platform_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      show: true,
      message: `Đã xuất và tải xuống file dữ liệu khách hàng tiềm năng thành công!`,
      type: 'success'
    });
  };

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
      />
 
      {/* 2. Thanh đo lường hiệu suất (Bento Stats) */}
      <LeadsStats leads={leads} />
      
      {/* 3. Vùng nội dung chính */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <span className="loading loading-ring loading-lg text-primary"></span>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 hide-scrollbar w-full items-start min-h-[500px]">
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
              />
            );
          })}
          
          {/* Cột 4: Thêm giai đoạn tùy chỉnh */}
          <div className="min-w-[300px] max-w-[300px] bg-base-100/40 backdrop-blur-xs border border-base-content/5 rounded-2xl p-4 flex flex-col justify-center items-center h-full min-h-[480px] shadow-xs shrink-0 text-center">
            {/* Hình minh họa các block */}
            <div className="relative w-28 h-28 mb-4 flex items-center justify-center bg-sky-50 dark:bg-sky-950/10 rounded-2xl border border-sky-100 dark:border-sky-900/20">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Khung block 1 */}
                <rect x="12" y="10" width="40" height="12" rx="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="18" cy="16" r="2" fill="#38BDF8" />
                <rect x="24" y="14" width="16" height="4" rx="1" fill="#38BDF8" opacity="0.5" />
                
                {/* Khung block 2 */}
                <rect x="12" y="26" width="40" height="12" rx="4" fill="#0064D2" fillOpacity="0.08" stroke="#0064D2" strokeWidth="1.5" />
                <circle cx="18" cy="32" r="2" fill="#0064D2" />
                <rect x="24" y="30" width="16" height="4" rx="1" fill="#0064D2" opacity="0.5" />
                
                {/* Khung block 3 */}
                <rect x="12" y="42" width="40" height="12" rx="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="18" cy="48" r="2" fill="#38BDF8" />
                <rect x="24" y="46" width="16" height="4" rx="1" fill="#38BDF8" opacity="0.5" />
 
                {/* Trỏ chuột click */}
                <path d="M46 36 L52 48 L48 50 L42 42 L38 46 L38 34 L46 36 Z" fill="#374151" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </div>
            
            <h3 className="text-sm font-bold text-base-content/80 mb-2 font-brand">Thêm giai đoạn tùy chỉnh</h3>
            <p className="text-2xs leading-relaxed max-w-[220px] text-base-content/50 mb-5 font-medium">
              Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.
            </p>
            <button 
              onClick={() => handleAddStage()}
              className="btn btn-sm bg-[#0064D2] hover:bg-[#0052AD] text-white font-semibold rounded-lg shadow-2xs px-4 border-0 cursor-pointer transition-all active:scale-95"
            >
              Thêm giai đoạn tùy chỉnh
            </button>
          </div>
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

      {/* 4. Giao diện Toast thông báo nổi tuyệt đẹp */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[200] animate-slide-in">
          <div className={`alert text-white rounded-xl shadow-md p-3 flex items-center gap-2 border-0 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
