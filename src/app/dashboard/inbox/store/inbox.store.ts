import { create } from 'zustand';
import { AccountGroup } from '@/domain/types/account-group';
import { ConversationWithLastMessage } from '@/domain/types/messaging';

export type ViewMode = 'all' | 'by_account' | 'by_contacts' | 'ai_priority' | 'daily_flow';
export type Platform = 'all' | 'facebook' | 'instagram' | 'tiktok' | 'custom';
export type SegmentFilter = 'all' | 'unread' | 'needs_reply' | 'vip' | 'hot_lead' | 'cold';
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
  setRightPanelVisible: (visible: boolean) => void;

  rightSidebarTab: string;
  setRightSidebarTab: (tab: string) => void;

  middlePanelWidth: number;
  setMiddlePanelWidth: (width: number) => void;

  // Real-time UI refresh triggers
  refreshCounter: number;
  triggerRefresh: () => void;

  // Shared tags state
  availableTags: string[];
  setAvailableTags: (tags: string[]) => void;

  // Multi-thread state
  activeThreads: ConversationWithLastMessage[];
  addActiveThread: (thread: ConversationWithLastMessage) => void;
  removeActiveThread: (threadId: string) => void;
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
  setRightPanelVisible: (visible) => set({ isRightPanelVisible: visible }),

  rightSidebarTab: 'detail',
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

  middlePanelWidth: 360,
  setMiddlePanelWidth: (width) => set({ middlePanelWidth: width }),

  refreshCounter: 0,
  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),

  availableTags: [],
  setAvailableTags: (tags) => set({ availableTags: tags }),

  activeThreads: [],
  addActiveThread: (thread) => set((state) => {
    // Remove if already exists (to move it to front/most recent)
    const filtered = state.activeThreads.filter(t => t.id !== thread.id);
    // Add to front (index 0 is most recent)
    const next = [thread, ...filtered];
    // Keep max 5 tabs
    if (next.length > 5) return { activeThreads: next.slice(0, 5) };
    return { activeThreads: next };
  }),
  removeActiveThread: (threadId) => set((state) => ({
    activeThreads: state.activeThreads.filter(t => t.id !== threadId)
  })),
}));
