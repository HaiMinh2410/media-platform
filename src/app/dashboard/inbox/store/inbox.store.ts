import { create } from 'zustand';

export type ViewMode = 'all' | 'by_account' | 'by_contacts' | 'ai_priority';
export type Platform = 'all' | 'facebook' | 'instagram' | 'tiktok' | 'custom';
export type SegmentFilter = 'all' | 'hot_lead' | 'cold' | 'needs_reply';

interface InboxState {
  currentScope: string;
  viewMode: ViewMode;
  platform: Platform;
  segmentFilter: SegmentFilter;
  
  setScope: (scope: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setPlatform: (platform: Platform) => void;
  setSegmentFilter: (filter: SegmentFilter) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  currentScope: 'all',
  viewMode: 'all',
  platform: 'all',
  segmentFilter: 'all',
  
  setScope: (scope) => set({ currentScope: scope }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPlatform: (platform) => set({ platform }),
  setSegmentFilter: (filter) => set({ segmentFilter: filter }),
}));
