'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Columns, 
  Table as TableIcon,
  MoreHorizontal,
  Info,
  Calendar,
  ChevronDown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';

const LEAD_STAGES = [
  { id: 'new', label: 'Tiếp nhận', count: 3, icon: '🔵' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', count: 1, icon: '🟢' },
  { id: 'converted', label: 'Đã chuyển đổi', count: 0, icon: '🟣' },
];

const MOCK_LEADS = [
  { 
    id: '1', 
    name: 'Nguyễn An Thư', 
    avatar: 'https://i.pravatar.cc/150?u=1', 
    stage: 'new', 
    source: 'Tự nhiên', 
    platform: 'instagram',
    date: '2 Tháng 5'
  },
  { 
    id: '2', 
    name: 'Thư An', 
    avatar: 'https://i.pravatar.cc/150?u=2', 
    stage: 'new', 
    source: 'Tự nhiên', 
    platform: 'messenger',
    date: '2 Tháng 5'
  },
  { 
    id: '3', 
    name: 'Sample Lead', 
    avatar: null, 
    stage: 'new', 
    source: 'Trực tiếp', 
    platform: 'unknown',
    date: '2 Tháng 5'
  },
  { 
    id: '4', 
    name: 'Hai Minh', 
    avatar: 'https://i.pravatar.cc/150?u=4', 
    stage: 'qualified', 
    source: 'Tự nhiên', 
    platform: 'instagram',
    date: '2 Tháng 5'
  },
];

export default function LeadsCenter() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState<{ name: string; avatar?: string | null } | null>(null);

  React.useEffect(() => {
    getCurrentUserWorkspaceAction().then(res => {
      if (res.data) {
        setUserData({
          name: res.data.user.name,
          avatar: res.data.user.avatar
        });
      }
    });
  }, []);
  
  return (
    <div className="flex flex-col gap-6 h-full p-8 overflow-y-auto bg-background-primary text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Trung tâm khách hàng tiềm năng</h1>
        </div>
        <div className="flex gap-3 items-center">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.02] border border-white/10 text-foreground-secondary transition-all hover:bg-white/[0.05] hover:border-white/20">
            <Users size={16} />
            Đối tượng
            <ChevronDown size={14} />
          </button>
          <button className="flex items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-foreground-secondary transition-all hover:bg-white/[0.05]">
            <RefreshCw size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-all hover:opacity-90 active:scale-[0.98]">
            <Plus size={16} />
            Thêm khách hàng tiềm năng
          </button>
          
          <div className="flex items-center gap-4 pl-4 border-l border-white/10 ml-2">
            <ThemeSwitcher />
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden shrink-0 border border-white/10">
               {userData?.avatar ? <img src={userData.avatar} alt="" className="w-full h-full object-cover" /> : (userData?.name?.charAt(0) || 'U')}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap justify-between items-center p-3 bg-white/[0.02] rounded-[24px] border border-white/10 backdrop-blur-xl gap-4">
        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
          <button 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              viewMode === 'kanban' ? "bg-white/10 text-white shadow-lg" : "text-foreground-tertiary hover:text-foreground-secondary"
            )}
            onClick={() => setViewMode('kanban')}
          >
            <Columns size={16} />
            Chế độ xem theo quy trình
          </button>
          <button 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
              viewMode === 'table' ? "bg-white/10 text-white shadow-lg" : "text-foreground-tertiary hover:text-foreground-secondary"
            )}
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={16} />
            Chế độ xem bảng
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium bg-white/[0.02] border border-white/10 text-foreground-secondary hover:bg-white/[0.05]">
            <Filter size={14} />
            Ẩn bộ lọc
          </button>
          <select className="bg-white/[0.02] border border-white/10 px-3 py-2 rounded-lg text-foreground-secondary text-[13px] outline-none cursor-pointer hover:border-white/20">
            <option>Chiến dịch</option>
          </select>
          <select className="bg-white/[0.02] border border-white/10 px-3 py-2 rounded-lg text-foreground-secondary text-[13px] outline-none cursor-pointer hover:border-white/20">
            <option>Mẫu</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium bg-white/[0.02] border border-white/10 text-foreground-secondary hover:bg-white/[0.05]">
            <Calendar size={14} />
            Chọn ngày
          </button>
          <select className="bg-white/[0.02] border border-white/10 px-3 py-2 rounded-lg text-foreground-secondary text-[13px] outline-none cursor-pointer hover:border-white/20">
            <option>Trạng thái</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
          <span className="text-[13px] text-foreground-tertiary flex items-center gap-2">
            Số khách hàng tiềm năng ở giai đoạn tiếp nhận: 3 <Info size={12} />
          </span>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
          <span className="text-[13px] text-foreground-tertiary flex items-center gap-2">
            Số khách hàng tiềm năng đã chuyển đổi: -- <Info size={12} />
          </span>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
          <span className="text-[13px] text-foreground-tertiary flex items-center gap-2">
            Tỷ lệ chuyển đổi: -- <Info size={12} />
          </span>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-5 overflow-x-auto pb-5 flex-1 scrollbar-hide">
          {LEAD_STAGES.map((stage) => (
            <div key={stage.id} className="min-w-[300px] max-w-[300px] flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 px-1 sticky top-0 bg-background-primary z-10">
                <div className="flex items-center gap-2 text-[15px] font-semibold">
                  {stage.label} <Info size={14} className="opacity-50" />
                  <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-foreground-tertiary">
                    {MOCK_LEADS.filter(l => l.stage === stage.id).length}
                  </span>
                </div>
                <MoreHorizontal size={16} className="opacity-50 cursor-pointer" />
              </div>

              <div className="flex flex-col gap-3">
                {MOCK_LEADS.filter(l => l.stage === stage.id).length > 0 ? (
                  MOCK_LEADS.filter(l => l.stage === stage.id).map((lead) => (
                    <div key={lead.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-violet-500/50 hover:shadow-xl hover:shadow-black/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                          {lead.avatar ? <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" /> : lead.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{lead.name}</div>
                          <div className="text-xs text-foreground-tertiary flex items-center gap-1">
                            {lead.platform === 'instagram' && <img src="/icons/instagram.png" className="w-4 h-4" alt="" />}
                            {lead.platform === 'messenger' && <img src="/icons/messenger.png" className="w-4 h-4" alt="" />}
                            {lead.source}
                          </div>
                        </div>
                        <MoreHorizontal size={16} className="opacity-30" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-white/10 rounded-[24px] text-foreground-tertiary gap-4 bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center">
                      <RefreshCw size={32} className="opacity-20" />
                    </div>
                    <div className="text-sm font-semibold text-foreground-secondary">Không có khách hàng tiềm năng {stage.label} nào</div>
                    <div className="text-xs leading-relaxed max-w-[200px]">Chuyển khách hàng tiềm năng sang giai đoạn này nếu họ đã thỏa thuận hoặc giao dịch với bạn.</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="min-w-[300px] max-w-[300px]">
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-white/5 rounded-[24px] text-foreground-tertiary gap-4 bg-white/[0.005] hover:bg-white/[0.02] transition-all cursor-pointer group">
               <Plus size={32} className="opacity-20 group-hover:opacity-40 transition-opacity" />
               <div className="text-sm font-semibold text-foreground-secondary">Thêm giai đoạn tùy chỉnh</div>
               <p className="text-xs leading-relaxed">Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.</p>
               <button className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-all hover:opacity-90 active:scale-[0.98]">
                 Thêm giai đoạn tùy chỉnh
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5"><input type="checkbox" className="rounded bg-white/10 border-white/20" /></th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Ngày thêm <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Tên <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Giai đoạn <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Nguồn <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Chỉ định cho <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground-secondary">Kênh <ChevronDown size={12} /></div>
                </th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">Trạng thái</th>
                <th className="text-left p-4 text-[13px] font-semibold text-foreground-tertiary border-bottom border-white/5">Lời nhắc</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADS.map((lead) => (
                <tr key={lead.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-all">
                  <td className="p-4"><input type="checkbox" className="rounded bg-white/10 border-white/20" /></td>
                  <td className="p-4 text-sm">{lead.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                       <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden text-[10px]">
                        {lead.avatar ? <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" /> : lead.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{lead.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span 
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[12px] font-bold",
                        lead.stage === 'new' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {LEAD_STAGES.find(s => s.id === lead.stage)?.label}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{lead.source}</td>
                  <td className="p-4 text-sm text-foreground-tertiary italic">Chưa chỉ định</td>
                  <td className="p-4 text-sm capitalize">{lead.platform}</td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
