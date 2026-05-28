import { LeadStage, Lead } from './types';

export const LEAD_STAGES: LeadStage[] = [
  { id: 'new', label: 'Tiếp nhận', count: 3, icon: '🔵', color: 'info' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', count: 0, icon: '🟢', color: 'success' },
  { id: 'converted', label: 'Đã chuyển đổi', count: 0, icon: '🟣', color: 'primary' },
];

export const MOCK_LEADS: Lead[] = [
  { 
    id: '1', 
    name: 'Hải Minh', 
    avatar: 'https://i.pravatar.cc/150?u=4', 
    stage: 'new', 
    source: 'Tự nhiên', 
    platform: 'messenger',
    date: '11:35'
  },
  { 
    id: '2', 
    name: 'Thư An', 
    avatar: 'https://i.pravatar.cc/150?u=2', 
    stage: 'new', 
    source: 'Tự nhiên', 
    platform: 'messenger',
    date: '11:35'
  },
  { 
    id: '3', 
    name: 'Minh Dev', 
    avatar: 'https://i.pravatar.cc/150?u=5', 
    stage: 'new', 
    source: 'Tự nhiên', 
    platform: 'messenger',
    date: '11:35'
  },
];
