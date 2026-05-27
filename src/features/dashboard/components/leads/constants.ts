import { LeadStage, Lead } from './types';

export const LEAD_STAGES: LeadStage[] = [
  { id: 'new', label: 'Tiếp nhận', count: 3, icon: '🔵', color: 'info' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', count: 1, icon: '🟢', color: 'success' },
  { id: 'converted', label: 'Đã chuyển đổi', count: 0, icon: '🟣', color: 'primary' },
];

export const MOCK_LEADS: Lead[] = [
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
