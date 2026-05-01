import { create } from 'zustand';
import { AccountGroup } from '@/domain/types/account-group';


export type ViewMode = 'all' | 'by_account' | 'by_contacts' | 'ai_priority' | 'daily_flow';
export type Platform = 'all' | 'facebook' | 'instagram' | 'tiktok' | 'custom';
export type SegmentFilter = 'all' | 'hot_lead' | 'cold' | 'needs_reply';
export type ToneMode = 'professional' | 'sales' | 'warm' | 'flirty';

interface InboxState {
  currentScope: string;
  viewMode: ViewMode;
  platform: Platform;
  segmentFilter: SegmentFilter;
  
  // Composer state
  selectedTone: ToneMode;
  replyAsId: string | null;
  replyOnChannel: string | null;
  
  selectedGroupId: string | null;
  setGroupId: (id: string | null) => void;
  
  accountGroups: AccountGroup[];
  setAccountGroups: (groups: AccountGroup[]) => void;
  
  setScope: (scope: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setPlatform: (platform: Platform) => void;
  setSegmentFilter: (filter: SegmentFilter) => void;
  
  setTone: (tone: ToneMode) => void;
  setReplyAsId: (id: string | null) => void;
  setReplyOnChannel: (channel: string | null) => void;

  isRightPanelVisible: boolean;
  toggleRightPanel: () => void;

  middlePanelWidth: number;
  setMiddlePanelWidth: (width: number) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  currentScope: 'all',
  viewMode: 'all',
  platform: 'all',
  segmentFilter: 'all',
  selectedGroupId: null,
  accountGroups: [],

  
  selectedTone: 'professional',
  replyAsId: null,
  replyOnChannel: null,
  
  setScope: (scope) => set({ currentScope: scope }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPlatform: (platform) => set({ platform }),
  setSegmentFilter: (filter) => set({ segmentFilter: filter }),
  setGroupId: (id) => set({ selectedGroupId: id }),
  setAccountGroups: (groups) => set({ accountGroups: groups }),

  
  setTone: (tone) => set({ selectedTone: tone }),
  setReplyAsId: (id) => set({ replyAsId: id }),
  setReplyOnChannel: (channel) => set({ replyOnChannel: channel }),

  isRightPanelVisible: true,
  toggleRightPanel: () => set((state) => ({ isRightPanelVisible: !state.isRightPanelVisible })),

  middlePanelWidth: 360,
  setMiddlePanelWidth: (width) => set({ middlePanelWidth: width }),
}));
