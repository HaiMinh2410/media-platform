'use client';

import React, { useState, useEffect } from 'react';
import styles from './leads.module.css';
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
import clsx from 'clsx';

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
  
  return (
    <div className={styles.leadsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Trung tâm khách hàng tiềm năng</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btn}>
            <Users size={16} />
            Đối tượng
            <ChevronDown size={14} />
          </button>
          <button className={styles.btn}>
            <RefreshCw size={16} />
          </button>
          <button className={clsx(styles.btn, styles.btnPrimary)}>
            <Plus size={16} />
            Thêm khách hàng tiềm năng
          </button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className={styles.viewControls}>
        <div className={styles.viewSwitcher}>
          <button 
            className={clsx(styles.viewBtn, viewMode === 'kanban' && styles.viewBtnActive)}
            onClick={() => setViewMode('kanban')}
          >
            <Columns size={16} />
            Chế độ xem theo quy trình
          </button>
          <button 
            className={clsx(styles.viewBtn, viewMode === 'table' && styles.viewBtnActive)}
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={16} />
            Chế độ xem bảng
          </button>
        </div>

        <div className={styles.filtersSection}>
          <button className={styles.btn}>
            <Filter size={14} />
            Ẩn bộ lọc
          </button>
          <select className={styles.filterSelect}>
            <option>Chiến dịch</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Mẫu</option>
          </select>
          <button className={styles.btn}>
            <Calendar size={14} />
            Chọn ngày
          </button>
          <select className={styles.filterSelect}>
            <option>Trạng thái</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Số khách hàng tiềm năng ở giai đoạn tiếp nhận: 3 <Info size={12} /></span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Số khách hàng tiềm năng đã chuyển đổi: -- <Info size={12} /></span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tỷ lệ chuyển đổi: -- <Info size={12} /></span>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <div className={styles.kanbanBoard}>
          {LEAD_STAGES.map((stage) => (
            <div key={stage.id} className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle}>
                  {stage.label} <Info size={14} />
                  <span className={styles.countBadge}>{MOCK_LEADS.filter(l => l.stage === stage.id).length}</span>
                </div>
                <MoreHorizontal size={16} style={{ opacity: 0.5 }} />
              </div>

              {MOCK_LEADS.filter(l => l.stage === stage.id).length > 0 ? (
                MOCK_LEADS.filter(l => l.stage === stage.id).map((lead) => (
                  <div key={lead.id} className={styles.leadCard}>
                    <div className={styles.leadInfo}>
                      <div className={styles.avatar}>
                        {lead.avatar ? <img src={lead.avatar} alt={lead.name} /> : lead.name.charAt(0)}
                      </div>
                      <div className={styles.leadDetails}>
                        <div className={styles.leadName}>{lead.name}</div>
                        <div className={styles.leadSource}>
                          {lead.platform === 'instagram' && <img src="/icons/instagram.png" className={styles.platformIcon} alt="" />}
                          {lead.platform === 'messenger' && <img src="/icons/messenger.png" className={styles.platformIcon} alt="" />}
                          {lead.source}
                        </div>
                      </div>
                      <MoreHorizontal size={16} style={{ opacity: 0.5 }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyColumn}>
                  <div className={styles.emptyIcon}>
                    <RefreshCw size={32} opacity={0.2} />
                  </div>
                  <div className={styles.emptyTitle}>Không có khách hàng tiềm năng Đã chuyển đổi nào</div>
                  <div className={styles.emptyDesc}>Chuyển khách hàng tiềm năng sang giai đoạn này nếu họ đã thỏa thuận hoặc giao dịch với bạn.</div>
                </div>
              )}
            </div>
          ))}
          
          <div className={styles.kanbanColumn}>
            <div className={styles.emptyColumn} style={{ background: 'rgba(255, 255, 255, 0.01)', cursor: 'pointer' }}>
               <Plus size={32} opacity={0.2} />
               <div className={styles.emptyTitle}>Thêm giai đoạn tùy chỉnh</div>
               <p className={styles.emptyDesc}>Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.</p>
               <button className={clsx(styles.btn, styles.btnPrimary)} style={{ marginTop: '12px' }}>
                 Thêm giai đoạn tùy chỉnh
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Ngày thêm <ChevronDown size={12} /></th>
                <th>Tên <ChevronDown size={12} /></th>
                <th>Giai đoạn <ChevronDown size={12} /></th>
                <th>Nguồn <ChevronDown size={12} /></th>
                <th>Chỉ định cho <ChevronDown size={12} /></th>
                <th>Kênh <ChevronDown size={12} /></th>
                <th>Trạng thái</th>
                <th>Lời nhắc</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADS.map((lead) => (
                <tr key={lead.id}>
                  <td><input type="checkbox" /></td>
                  <td>{lead.date}</td>
                  <td>
                    <div className={styles.leadInfo}>
                       <div className={styles.avatar} style={{ width: 24, height: 24, fontSize: 10 }}>
                        {lead.avatar ? <img src={lead.avatar} alt={lead.name} /> : lead.name.charAt(0)}
                      </div>
                      {lead.name}
                    </div>
                  </td>
                  <td>
                    <span className={clsx(styles.statusBadge, lead.stage === 'new' ? styles.badgeNew : styles.badgeQualified)}>
                      {LEAD_STAGES.find(s => s.id === lead.stage)?.label}
                    </span>
                  </td>
                  <td>{lead.source}</td>
                  <td>Chưa chỉ định</td>
                  <td>{lead.platform.charAt(0).toUpperCase() + lead.platform.slice(1)}</td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
