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
import { cn } from '@shared/lib/utils';
import { getCurrentUserWorkspaceAction } from '@features/settings/actions/workspace.actions';

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
    getCurrentUserWorkspaceAction().then((res: any) => {
      if (res.data) {
        setUserData({
          name: res.data.user.name,
          avatar: res.data.user.avatar
        });
      }
    });
  }, []);
  
  return (
    <div className="flex flex-col gap-6 h-full p-6 xl:p-8 overflow-y-auto bg-base-200/30 text-base-content min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-brand text-base-content">
            Trung tâm khách hàng tiềm năng
          </h1>
          <p className="text-xs text-base-content/60 font-medium mt-1">
            Quản lý, phân loại và theo dõi tiến trình chuyển đổi khách hàng tiềm năng của bạn
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button className="btn btn-sm btn-soft border border-base-content/10 font-semibold text-base-content/80 rounded-lg">
            <Users size={14} />
            Đối tượng
            <ChevronDown size={12} className="opacity-60" />
          </button>
          <button className="btn btn-sm btn-square btn-soft border border-base-content/10 text-base-content/80 rounded-lg">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-sm btn-primary font-bold shadow-sm rounded-lg flex items-center gap-1.5">
            <Plus size={14} />
            Thêm khách hàng tiềm năng
          </button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap justify-between items-center p-3 bg-base-100/40 rounded-xl border border-base-content/10 gap-4">
        <div className="flex gap-1 bg-base-200/50 p-1 rounded-lg border border-base-content/10">
          <button 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
              viewMode === 'kanban' 
                ? "bg-primary text-primary-content shadow-sm" 
                : "text-base-content/60 hover:text-base-content/80"
            )}
            onClick={() => setViewMode('kanban')}
          >
            <Columns size={14} />
            Quy trình (Kanban)
          </button>
          <button 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
              viewMode === 'table' 
                ? "bg-primary text-primary-content shadow-sm" 
                : "text-base-content/60 hover:text-base-content/80"
            )}
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={14} />
            Bảng chi tiết
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn btn-xs btn-soft border border-base-content/10 text-base-content/70 hover:bg-base-200/50">
            <Filter size={12} />
            Ẩn bộ lọc
          </button>
          
          <select className="select select-xs select-bordered bg-base-100/60 border-base-content/10 text-base-content/80 font-medium rounded-lg h-7">
            <option>Chiến dịch</option>
          </select>
          
          <select className="select select-xs select-bordered bg-base-100/60 border-base-content/10 text-base-content/80 font-medium rounded-lg h-7">
            <option>Mẫu</option>
          </select>
          
          <button className="btn btn-xs btn-soft border border-base-content/10 text-base-content/70 hover:bg-base-200/50">
            <Calendar size={12} />
            Chọn ngày
          </button>
          
          <select className="select select-xs select-bordered bg-base-100/60 border-base-content/10 text-base-content/80 font-medium rounded-lg h-7">
            <option>Trạng thái</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10 border-t-2 border-t-info flex flex-col gap-1 relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Tiếp nhận</span>
            <div className="w-7 h-7 rounded-md bg-info/10 flex items-center justify-center border border-info/10">
              <Users size={14} className="text-info" />
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight text-base-content font-mono mt-1">3</span>
          <span className="text-xs text-base-content/60 flex items-center gap-1 mt-1 font-medium">
            <Info size={12} className="opacity-50" /> 3 khách hàng mới cần xử lý
          </span>
        </div>
        
        {/* Stat 2 */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10 border-t-2 border-t-primary flex flex-col gap-1 relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Đã chuyển đổi</span>
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/10">
              <ExternalLink size={14} className="text-primary" />
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight text-base-content font-mono mt-1">0</span>
          <span className="text-xs text-base-content/60 flex items-center gap-1 mt-1 font-medium">
            <Info size={12} className="opacity-50" /> Từ các chiến dịch marketing
          </span>
        </div>

        {/* Stat 3 */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10 border-t-2 border-t-success flex flex-col gap-1 relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Tỷ lệ chuyển đổi</span>
            <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center border border-success/10">
              <RefreshCw size={14} className="text-success" />
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight text-base-content font-mono mt-1">0%</span>
          <span className="text-xs text-base-content/60 flex items-center gap-1 mt-1 font-medium">
            <Info size={12} className="opacity-50" /> Mục tiêu quý này: 15%
          </span>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-5 overflow-x-auto pb-5 flex-1 hide-scrollbar">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = MOCK_LEADS.filter(l => l.stage === stage.id);
            return (
              <div 
                key={stage.id} 
                className="min-w-[310px] max-w-[310px] bg-base-100/20 border border-base-content/10 rounded-xl p-4 flex flex-col gap-3 h-full max-h-[calc(100vh-280px)] overflow-y-auto hide-scrollbar"
              >
                <div className="flex justify-between items-center py-2 px-1 sticky top-0 bg-base-100/0 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-base-content">
                    <span className="text-xs">{stage.icon}</span>
                    <span>{stage.label}</span>
                    <span className="badge badge-sm badge-soft font-mono font-bold ml-1">
                      {stageLeads.length}
                    </span>
                  </div>
                  <button className="btn btn-xs btn-ghost btn-square">
                    <MoreHorizontal size={14} className="opacity-60" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar">
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <div 
                        key={lead.id} 
                        className="bg-base-100 rounded-lg p-3.5 border border-base-content/10 flex flex-col gap-3 cursor-pointer transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/45 group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder shrink-0">
                            <div className="w-9 h-9 rounded-full bg-base-200 text-base-content flex items-center justify-center font-bold text-sm border border-base-content/10">
                              {lead.avatar ? (
                                <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{lead.name.charAt(0)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-base-content truncate group-hover:text-primary transition-colors">
                              {lead.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {lead.platform === 'instagram' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-instagram/10 text-instagram uppercase tracking-wider">Instagram</span>
                              )}
                              {lead.platform === 'messenger' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-messenger/10 text-messenger uppercase tracking-wider">Messenger</span>
                              )}
                              {lead.platform === 'unknown' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-base-300 text-base-content/50 uppercase tracking-wider">Trực tiếp</span>
                              )}
                              <span className="text-[11px] font-semibold text-base-content/40 before:content-['•'] before:mr-1 before:opacity-30">{lead.source}</span>
                            </div>
                          </div>
                          <button className="btn btn-xs btn-ghost btn-square opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <MoreHorizontal size={14} className="text-base-content/60" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-base-content/5 text-[11px] text-base-content/40 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {lead.date}
                          </span>
                          <span className="badge badge-xs badge-soft">ID: {lead.id}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-base-content/15 rounded-lg text-base-content/40 gap-3 bg-base-100/5 min-h-[200px]">
                      <div className="w-12 h-12 rounded-full bg-base-200/50 flex items-center justify-center border border-base-content/5">
                        <Users size={20} className="opacity-40" />
                      </div>
                      <div className="text-xs font-bold text-base-content/60">Không có khách hàng</div>
                      <p className="text-[11px] leading-relaxed max-w-[180px] text-base-content/40">
                        Kéo thả hoặc thêm khách hàng mới vào giai đoạn này.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="min-w-[310px] max-w-[310px] h-[350px]">
            <div className="h-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-base-content/10 rounded-xl text-base-content/40 gap-3 bg-base-100/5 hover:bg-base-100/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-base-200/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus size={18} className="opacity-40 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </div>
              <div className="text-sm font-bold text-base-content/70 group-hover:text-primary transition-colors">Thêm giai đoạn</div>
              <p className="text-xs leading-relaxed max-w-[200px] text-base-content/50">
                Tạo các bước tùy chỉnh để theo dõi hành trình chuyển đổi khách hàng tiềm năng.
              </p>
              <button className="btn btn-sm btn-primary mt-2 font-bold rounded-lg shadow-sm">
                Bắt đầu ngay
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-base-100/40 border border-base-content/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="border-b border-base-content/10 text-base-content/60 font-mono text-xs uppercase tracking-wider">
                  <th className="w-12 text-center">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded" />
                  </th>
                  <th>Ngày thêm</th>
                  <th>Tên khách hàng</th>
                  <th>Giai đoạn</th>
                  <th>Nguồn</th>
                  <th>Chỉ định</th>
                  <th>Kênh</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADS.map((lead) => (
                  <tr key={lead.id} className="hover:bg-base-100/60 transition-colors">
                    <td className="text-center">
                      <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded" />
                    </td>
                    <td className="font-mono text-xs text-base-content/60">{lead.date}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="w-8 h-8 rounded-full bg-base-200 text-base-content flex items-center justify-center font-bold text-xs border border-base-content/10">
                            {lead.avatar ? (
                              <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{lead.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-sm text-base-content">{lead.name}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={cn(
                          "badge badge-sm font-bold uppercase tracking-wider",
                          lead.stage === 'new' ? "badge-info badge-soft" : "badge-success badge-soft"
                        )}
                      >
                        {LEAD_STAGES.find(s => s.id === lead.stage)?.label}
                      </span>
                    </td>
                    <td className="text-sm font-semibold text-base-content/80">{lead.source}</td>
                    <td className="text-xs text-base-content/40 italic">Chưa chỉ định</td>
                    <td>
                      {lead.platform === 'instagram' && (
                        <span className="badge badge-sm font-extrabold bg-instagram/10 text-instagram border-0">Instagram</span>
                      )}
                      {lead.platform === 'messenger' && (
                        <span className="badge badge-sm font-extrabold bg-messenger/10 text-messenger border-0">Messenger</span>
                      )}
                      {lead.platform === 'unknown' && (
                        <span className="badge badge-sm font-extrabold bg-base-300 text-base-content/50 border-0">Trực tiếp</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-xs btn-ghost btn-square">
                        <MoreHorizontal size={14} className="opacity-60" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

