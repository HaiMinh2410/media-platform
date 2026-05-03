'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { ContactEditModal } from './modals/contact-edit-modal';
import { ManageTagsModal } from './modals/manage-tags-modal';
import { useInboxStore } from '../store/inbox.store';
import { cn } from '@/lib/utils';
import { 
  Search, X, User, Calendar, MessageSquare, Loader2, 
  MoreHorizontal, ChevronRight, Camera, Info, Plus, Trash2, ChevronDown,
  Phone, Mail, Cake, Home, RefreshCw, Check
} from 'lucide-react';
import { MessageWithSender } from '@/domain/types/messaging';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
];

type TabType = 'detail' | 'ai' | 'search';

const leadStages = [
  { id: 'new', label: 'Tiếp nhận', description: 'Khách hàng tiềm năng mới hoặc mới đây đã tương tác với Trang của bạn.', badge: 'blue' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', description: 'Khách hàng tiềm năng thực sự quan tâm đến sản phẩm hoặc dịch vụ của bạn.', badge: 'green' },
  { id: 'converted', label: 'Đã chuyển đổi', description: 'Khách hàng tiềm năng đã thỏa thuận hoặc giao dịch với doanh nghiệp của bạn.', badge: 'purple' },
  { id: 'lost', label: 'Bị mất đi', description: 'Khách hàng tiềm năng không quan tâm nhưng có thể đáng để thu hút lại trong tương lai.', badge: 'gray' },
  { id: 'unqualified', label: 'Không đủ tiêu chuẩn', description: 'Khách hàng tiềm năng không phù hợp với doanh nghiệp của bạn.', badge: 'red' },
];

type RightSidebarProps = {
  workspaceId: string;
  conversationId: string;
  customerName?: string;
  customerAvatar?: string;
  platform: string;
  tags: string[];
  priority: string | null;
  sentiment: string | null;
  suggestions: any[];
  loadingSuggestions: boolean;
  onUseSuggestion: (text: string) => void;
  onDismissSuggestion: (id: string) => void;
  onUpdateTags: (tags: string[]) => void;
  onUpdatePriority: (priority: string) => void;
  onUpdateSentiment: (sentiment: string) => void;
  onJumpToMessage?: (id: string) => void;
  contactInfo?: {
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  customerUsername?: string;
  customerLink?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function RightSidebar({
  workspaceId,
  conversationId,
  customerName,
  customerAvatar,
  platform,
  tags,
  priority,
  sentiment,
  suggestions,
  loadingSuggestions,
  onUseSuggestion,
  onDismissSuggestion,
  onUpdateTags,
  onUpdatePriority,
  onUpdateSentiment,
  onJumpToMessage,
  contactInfo,
  isCollapsed,
  onToggleCollapse,
  customerUsername,
  customerLink,
}: RightSidebarProps) {
  const activeTab = useInboxStore((state) => state.rightSidebarTab) as TabType;
  const setActiveTab = useInboxStore((state) => state.setRightSidebarTab);
  const { activeThreads, removeActiveThread, addActiveThread } = useInboxStore();
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params?.id as string | undefined;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageWithSender[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderFilter, setSenderFilter] = useState<'user' | 'agent' | ''>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | ''>('');
  const [newTag, setNewTag] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(PRESET_COLORS[0]);
  const [isTagColorPickerOpen, setIsTagColorPickerOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [workspaceTags, setWorkspaceTags] = useState<string[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const getInitialStatus = (p: string | null) => {
    if (!p) return 'none';
    // Chỉ trả về p nếu nó nằm trong danh sách leadStages.id, nếu không thì trả về 'none'
    if (leadStages.some(s => s.id === p)) return p;
    return 'none';
  };

  const [leadStatus, setLeadStatus] = useState(getInitialStatus(priority));
  const [isLead, setIsLead] = useState(priority !== null && leadStages.some(s => s.id === priority));

  useEffect(() => {
    setIsLead(priority !== null && leadStages.some(s => s.id === priority));
    setLeadStatus(getInitialStatus(priority));
  }, [priority]);
  const [isLeadStatusOpen, setIsLeadStatusOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const availableTags = useInboxStore(state => state.availableTags);
  const [isMounted, setIsMounted] = useState(false);

  const fetchWorkspaceTags = async () => {
    try {
      const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.data) setWorkspaceTags(json.data);
    } catch (err) {
      console.error('Failed to fetch workspace tags:', err);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchWorkspaceTags();
  }, [workspaceId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync current conversation to activeThreads in store
  useEffect(() => {
    if (conversationId && (customerName || customerAvatar)) {
      addActiveThread({
        id: conversationId,
        sender_name: customerName,
        customer_avatar: customerAvatar,
        // These are enough for the sidebar tabs
      } as any);
    }
  }, [conversationId, customerName, customerAvatar, addActiveThread]);

  const fetchNotes = async () => {
    if (!conversationId) return;
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`);
      const json = await res.json();
      if (json.data) {
        setNotes(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [conversationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setIsLeadStatusOpen(false);
      }
      if (
        tagDropdownRef.current && 
        !tagDropdownRef.current.contains(event.target as Node) &&
        (!tagMenuRef.current || !tagMenuRef.current.contains(event.target as Node))
      ) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLeadStatus = () => {
    if (!isLeadStatusOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setDropdownDirection(spaceBelow < 400 ? 'up' : 'down');
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
    setIsLeadStatusOpen(!isLeadStatusOpen);
  };

  const toggleTagDropdown = () => {
    if (!isTagDropdownOpen && tagDropdownRef.current) {
      const rect = tagDropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setDropdownDirection(spaceBelow < 300 ? 'up' : 'down');
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
    setIsTagDropdownOpen(!isTagDropdownOpen);
  };

  const [orderStatus, setOrderStatus] = useState('none');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);

  // Debounced search logic
  React.useEffect(() => {
    if (!searchQuery.trim() && !senderFilter && !dateFilter) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let url = `/api/conversations/${conversationId}/messages?q=${encodeURIComponent(searchQuery)}&limit=100`;
        if (senderFilter) url += `&senderType=${senderFilter}`;
        
        if (dateFilter) {
          const now = new Date();
          let fromDate;
          if (dateFilter === 'today') {
            fromDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          } else if (dateFilter === 'week') {
            fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          }
          if (fromDate) url += `&fromDate=${fromDate}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (json.data) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, conversationId, senderFilter, dateFilter]);

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  const toggleTag = (tag: string) => {
    const triggerRefresh = useInboxStore.getState().triggerRefresh;
    const { name: newTagName } = parseTag(tag);
    const hasBlocked = tags.some(t => parseTag(t).name === 'Bị chặn');
    const hasPriority = tags.some(t => parseTag(t).name === 'Ưu tiên');
    const hasRestricted = tags.some(t => parseTag(t).name === 'Hạn chế');

    if (tags.some(t => parseTag(t).name === newTagName)) {
      onUpdateTags(tags.filter(t => parseTag(t).name !== newTagName));
      triggerRefresh();
      return;
    }

    if (hasBlocked) {
      alert('Tài khoản đã bị chặn, không thể thêm nhãn khác.');
      return;
    }

    if (newTagName === 'Bị chặn' && tags.length > 0) {
      if (confirm('Khi gắn nhãn "Bị chặn", các nhãn khác sẽ bị gỡ bỏ. Tiếp tục?')) {
        onUpdateTags([tag]);
        triggerRefresh();
      }
      return;
    }

    if (newTagName === 'Ưu tiên' && hasRestricted) {
      alert('Không thể gắn nhãn "Ưu tiên" khi đã có nhãn "Hạn chế".');
      return;
    }

    if (newTagName === 'Hạn chế' && hasPriority) {
      alert('Không thể gắn nhãn "Hạn chế" khi đã có nhãn "Ưu tiên".');
      return;
    }

    onUpdateTags([...tags, tag]);
    triggerRefresh();
  };

  // Tags not yet applied to this conversation
  const unappliedTags = availableTags.filter(at => 
    !tags.some(t => parseTag(t).name === parseTag(at).name) &&
    parseTag(at).name !== 'Bị chặn' // 'Bị chặn' is automated
  );

  const handleUpdateLeadStatus = async (status: string) => {
    setLeadStatus(status);
    onUpdatePriority(status); // Using priority as a proxy for lead status for now
    
    // Show specific toast message based on status
    switch (status) {
      case 'new':
        toast.success('Đã chuyển sang giai đoạn Tiếp nhận');
        break;
      case 'qualified':
        toast.success('Khách hàng đã đủ tiêu chuẩn');
        break;
      case 'converted':
        toast.success('Tuyệt vời! Đã chốt đơn thành công');
        break;
      case 'lost':
        toast.info('Đã đánh dấu khách hàng bị mất đi');
        break;
      case 'unqualified':
        toast.error('Khách hàng không đủ tiêu chuẩn');
        break;
      default:
        toast.success('Đã cập nhật giai đoạn khách hàng');
    }
  };

  const handleUpdateOrderStatus = async (status: string) => {
    setOrderStatus(status);
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: status }),
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent('');
        setIsAddingNote(false);
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingNoteContent }),
      });
      if (res.ok) {
        setEditingNoteId(null);
        setEditingNoteContent('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const formatNoteDate = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) {
      const distance = formatDistanceToNow(d, { addSuffix: true, locale: vi });
      return distance.replace('dưới 1 phút trước', 'vài giây trước');
    }
    return format(d, 'HH:mm dd/MM/yyyy');
  };

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    try {
      await fetch(`/api/conversations/${conversationId}/sync-profile`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to sync profile:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateContact = async (data: any) => {
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to update contact info:', err);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin liên hệ không?')) return;
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: null,
          email: null,
          birthday: null,
          address: null,
          city: null,
          state: null,
          zip_code: null
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete contact info:', err);
    }
  };

  const hasContactInfo = !!(contactInfo?.phone || contactInfo?.email || contactInfo?.address || contactInfo?.birthday);

  if (isCollapsed) {
    const otherThreads = activeThreads.filter(t => t.id !== conversationId);
    
    return (
      <aside className="w-full h-full p-3 flex flex-col items-center gap-4 bg-[#1a1a1e] border-l border-white/5">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Active Conversation Avatar - Toggles Sidebar */}
          <div 
            className={cn(
              "relative w-9 h-9 rounded-full bg-surface-primary border-2 border-white/10 flex items-center justify-center text-[0.875rem] font-bold text-foreground cursor-pointer transition-all hover:scale-105 hover:border-accent-primary shadow-lg",
              "border-accent-primary bg-accent-primary/10 ring-2 ring-accent-primary/20"
            )}
            onClick={onToggleCollapse}
            title={customerName || 'Active Conversation'}
          >
            {customerAvatar ? (
              <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover rounded-full" />
            ) : (
              customerName?.charAt(0) || 'U'
            )}
            <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-white border-[1.5px] border-[#1a1a1e] rounded-full flex items-center justify-center text-[#E1306C] shadow-lg z-10">
              <Camera size={10} />
            </div>
          </div>

          {/* Divider */}
          {otherThreads.length > 0 && <div className="w-6 h-px bg-white/10 opacity-50 my-2" />}

          {/* Other Active Threads */}
          {otherThreads.length > 0 && (
            <div className="flex flex-col items-center gap-5 w-full">
              {otherThreads.map(t => (
                <div 
                  key={t.id} 
                  className="group relative w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 cursor-pointer transition-all hover:scale-110 hover:bg-white/10 hover:border-foreground-tertiary"
                  onClick={() => router.push(`/dashboard/inbox/${t.id}`)}
                  title={t.sender_name || 'Switch conversation'}
                >
                  {t.customer_avatar ? (
                    <img src={t.customer_avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[0.75rem] font-bold text-foreground-secondary">{t.sender_name?.charAt(0) || '?'}</span>
                  )}
                  
                  <button 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-10 border-2 border-[#1a1a1e] transition-all hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeActiveThread(t.id);
                    }}
                    title="Remove from tabs"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-[#1a1a1e] border-l border-white/5" data-sidebar="right">
      <div className="flex items-center gap-1 p-2 border-b border-white/10">
        <button 
          className={cn(
            "flex-1 py-2 text-[0.8rem] font-semibold text-foreground-tertiary rounded-md transition-all hover:text-foreground-secondary hover:bg-white/5",
            activeTab === 'detail' && "text-accent-primary bg-accent-primary/10"
          )}
          onClick={() => setActiveTab('detail')}
        >
          Detail
        </button>
        <button 
          className={cn(
            "flex-1 py-2 text-[0.8rem] font-semibold text-foreground-tertiary rounded-md transition-all hover:text-foreground-secondary hover:bg-white/5",
            activeTab === 'ai' && "text-accent-primary bg-accent-primary/10"
          )}
          onClick={() => setActiveTab('ai')}
        >
          AI Assist
        </button>
        {activeTab === 'search' && (
          <button 
            className="flex-1 py-2 text-[0.8rem] font-semibold text-accent-primary bg-accent-primary/10 rounded-md transition-all"
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {activeTab === 'detail' && (
          <div className="p-4 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-primary border border-white/10 overflow-hidden flex items-center justify-center text-lg font-bold">
                {customerAvatar ? (
                  <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover" />
                ) : (
                  customerName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <h4 className="text-[0.9375rem] font-bold text-foreground truncate">{customerName || 'Unknown'}</h4>
                {platform === 'instagram' ? (
                  customerUsername ? (
                    <a 
                      href={`https://www.instagram.com/${customerUsername}/`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[0.75rem] text-accent-primary hover:underline"
                    >
                      Xem trang cá nhân
                    </a>
                  ) : (
                    <>
                      <span 
                        className="text-[0.75rem] text-foreground-tertiary cursor-help" 
                        title="Chưa đồng bộ được username Instagram. Nhấn 'Làm mới' để thử lại."
                      >
                        Chưa có liên kết
                      </span>
                      <button 
                        className="inline-flex items-center gap-1 text-[0.7rem] text-foreground-tertiary hover:text-foreground mt-1 transition-colors disabled:opacity-50" 
                        onClick={handleSyncProfile}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={12} className={cn(isSyncing && "animate-spin")} />
                        Làm mới
                      </button>
                    </>
                  )
                ) : (
                  customerLink ? (
                    <a 
                      href={customerLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[0.75rem] text-accent-primary hover:underline"
                    >
                      Xem trang cá nhân
                    </a>
                  ) : (
                    <>
                      <span 
                        className="text-[0.75rem] text-foreground-tertiary cursor-help" 
                        title="Facebook hạn chế link trang cá nhân qua API nếu không có quyền user_link. Nhấn 'Làm mới' để thử lại."
                      >
                        Chưa có liên kết
                      </span>
                      <button 
                        className="inline-flex items-center gap-1 text-[0.7rem] text-foreground-tertiary hover:text-foreground mt-1 transition-colors disabled:opacity-50" 
                        onClick={handleSyncProfile}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={12} className={cn(isSyncing && "animate-spin")} />
                        Làm mới
                      </button>
                    </>
                  )
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-foreground-tertiary hover:text-foreground hover:bg-white/5 rounded-md transition-all" onClick={onToggleCollapse}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.75rem] font-bold text-foreground-tertiary uppercase tracking-wider">Chi tiết liên hệ</h3>
                {hasContactInfo && (
                   <div className="flex items-center gap-3">
                    <span className="text-[0.75rem] text-accent-primary cursor-pointer hover:underline" onClick={() => setIsEditingContact(true)}>Chỉnh sửa</span>
                    <span className="text-[0.75rem] text-red-400 cursor-pointer hover:underline" onClick={handleDeleteContact}>Xóa</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {hasContactInfo ? (
                  <>
                    <p className="text-[0.7rem] font-bold text-foreground-tertiary uppercase tracking-wider mb-1">Chi tiết đã thêm</p>
                    {contactInfo.phone && (
                      <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
                        <Phone size={16} className="text-foreground-tertiary" />
                        <span className="truncate">{contactInfo.phone}</span>
                      </div>
                    )}
                    {contactInfo.email && (
                      <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
                        <Mail size={16} className="text-foreground-tertiary" />
                        <span className="truncate">{contactInfo.email}</span>
                      </div>
                    )}
                    {contactInfo.birthday && (
                      <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
                        <Cake size={16} className="text-foreground-tertiary" />
                        <span className="truncate">
                          {new Date(contactInfo.birthday).getDate()} tháng {new Date(contactInfo.birthday).getMonth() + 1}
                        </span>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
                        <Home size={16} className="text-foreground-tertiary" />
                        <span className="truncate">{contactInfo.address}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[0.8125rem] text-foreground-tertiary leading-normal mb-1">Bổ sung chi tiết về người liên hệ này.</p>
                    <button className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-white/20 rounded-lg text-[0.8125rem] text-foreground-tertiary transition-all hover:border-white/40 hover:text-foreground-secondary" onClick={() => setIsEditingContact(true)}>
                      <Plus size={16} /> Thêm chi tiết
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.75rem] font-bold text-foreground-tertiary uppercase tracking-wider">Hoạt động</h3>
                <div className="flex items-center gap-2">
                  {isLead && (
                    <span 
                      className="text-[0.75rem] text-accent-primary cursor-pointer hover:underline" 
                      onClick={() => {
                        setIsLead(false);
                        handleUpdateLeadStatus('none');
                        toast.info('Đã bỏ đánh dấu khách hàng tiềm năng');
                      }}
                    >
                      Bỏ đánh dấu
                    </span>
                  )}
                  <span className="text-[0.625rem] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground-tertiary">Khuyên dùng</span>
                </div>
              </div>
              
              <h3 className="text-[0.8125rem] font-semibold text-foreground-secondary flex items-center gap-1 mt-1">
                Giai đoạn khách hàng tiềm năng <Info size={14} className="text-foreground-tertiary" />
              </h3>

              <div className="relative w-full mt-1" ref={dropdownRef}>
                {!isLead ? (
                  <div 
                    className="flex items-center justify-center w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-[0.875rem] text-foreground-secondary cursor-pointer transition-all hover:bg-white/10 hover:border-accent-primary"
                    onClick={() => {
                      setIsLead(true);
                      handleUpdateLeadStatus('new');
                      toast.success('Đã đánh dấu là khách hàng tiềm năng');
                    }}
                  >
                    <span>Đánh dấu là khách hàng tiềm năng</span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-[0.875rem] text-foreground cursor-pointer transition-all hover:bg-white/10 hover:border-accent-primary"
                    onClick={toggleLeadStatus}
                  >
                    <span>{
                      leadStages.find(s => s.id === leadStatus)?.label || 'Chọn giai đoạn'
                    }</span>
                    <ChevronDown size={16} className={cn(isLeadStatusOpen && "rotate-180 transition-transform")} />
                  </div>
                )}

                {isLeadStatusOpen && isMounted && createPortal(
                  <div 
                    ref={menuRef}
                    className={cn(
                      "fixed bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col",
                      dropdownDirection === 'up' && "mb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
                    )}
                    style={{
                      top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
                      bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                      maxHeight: dropdownDirection === 'down' 
                        ? window.innerHeight - dropdownPos.top - 60 
                        : dropdownPos.top - 20
                    }}
                  >
                    <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-white/10">
                      {leadStages.map((stage) => (
                        <div 
                          key={stage.id} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5",
                            leadStatus === stage.id && "bg-accent-primary/10"
                          )}
                          onClick={() => {
                            handleUpdateLeadStatus(stage.id);
                            setIsLeadStatusOpen(false);
                          }}
                        >
                          <div className="pt-0.5">
                            <div className={cn(
                              "w-4.5 h-4.5 rounded-full border-2 border-white/10 flex items-center justify-center transition-all",
                              leadStatus === stage.id && "border-accent-primary"
                            )}>
                              {leadStatus === stage.id && <div className="w-2.5 h-2.5 rounded-full bg-accent-primary" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[0.875rem] text-foreground">{stage.label}</span>
                              <span className={cn(
                                "text-[0.625rem] font-bold px-2 py-0.5 rounded-full",
                                stage.badge === 'blue' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                                stage.badge === 'green' && "bg-green-500/20 text-green-400 border border-green-500/30",
                                stage.badge === 'purple' && "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                                stage.badge === 'gray' && "bg-slate-500/20 text-slate-400 border border-slate-500/30",
                                stage.badge === 'red' && "bg-red-500/20 text-red-400 border border-red-500/30"
                              )}>
                                {stage.label}
                              </span>
                            </div>
                            <p className="text-[0.75rem] text-foreground-tertiary leading-normal">{stage.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-black/20 border-t border-white/10 text-[0.75rem] text-foreground-tertiary">
                      <span>Bạn có thể tạo giai đoạn tùy chỉnh trong <a href="#" className="text-accent-primary hover:underline">Leads Center</a>.</span>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.75rem] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
                  Nhãn <Info size={14} className="text-foreground-tertiary cursor-help" />
                </h3>
                <span 
                  className="text-[0.75rem] text-accent-primary cursor-pointer hover:underline"
                  onClick={() => setIsManageTagsOpen(true)}
                >
                  Quản lý nhãn
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map(tag => {
                    const { name, color } = parseTag(tag);
                    return (
                      <span 
                        key={tag} 
                        className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[0.8125rem] font-medium transition-all"
                        style={{ 
                          backgroundColor: `${color}15`, 
                          color: color,
                          border: `1px solid ${color}30`
                        }}
                      >
                        {name}
                        <X 
                          size={12} 
                          className="cursor-pointer opacity-50 hover:opacity-100 hover:text-red-400 transition-all" 
                          onClick={() => toggleTag(tag)}
                        />
                      </span>
                    );
                  })
                ) : (
                  <p className="text-[0.75rem] text-foreground-tertiary italic my-2">
                    Chưa có nhãn nào được gắn
                  </p>
                )}
              </div>

              <div className="relative w-full mt-2" ref={tagDropdownRef}>
                <div 
                  className="flex items-center justify-between w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-[0.875rem] text-foreground cursor-pointer transition-all hover:bg-white/10 hover:border-accent-primary"
                  onClick={toggleTagDropdown}
                >
                  <span>Thêm nhãn</span>
                  <Plus size={16} />
                </div>

                {isTagDropdownOpen && isMounted && createPortal(
                  <div 
                    ref={tagMenuRef}
                    className={cn(
                      "fixed bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col",
                      dropdownDirection === 'up' && "mb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
                    )}
                    style={{
                      top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
                      bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                    }}
                  >
                    <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-white/10">
                      {unappliedTags.length > 0 ? (
                        unappliedTags.map((tag) => {
                          const { name, color } = parseTag(tag);
                          return (
                            <div 
                              key={tag} 
                              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                              onClick={() => {
                                toggleTag(tag);
                                setIsTagDropdownOpen(false);
                              }}
                            >
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: color }} 
                              />
                              <span className="font-bold text-[0.875rem] text-foreground">{name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-[0.8125rem] text-foreground-tertiary italic">Không còn nhãn nào để thêm</div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.75rem] font-bold text-foreground-tertiary uppercase tracking-wider">Ghi chú</h3>
                <span className="text-[0.75rem] text-accent-primary cursor-pointer hover:underline" onClick={() => setIsAddingNote(!isAddingNote)}>
                  {isAddingNote ? 'Hủy' : 'Thêm ghi chú'}
                </span>
              </div>
              
              {isAddingNote && (
                <div className="flex flex-col gap-3 mt-2">
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-foreground text-[0.875rem] min-height-[80px] resize-vertical outline-none focus:border-accent-primary"
                    placeholder="Nhập nội dung ghi chú..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <button 
                    className="bg-accent-primary text-white border-none p-2 rounded-lg text-[0.875rem] font-semibold cursor-pointer w-fit self-end transition-all hover:opacity-90"
                    onClick={handleSaveNote}
                  >
                    Lưu ghi chú
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 mt-3">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center gap-2 py-5 text-foreground-tertiary text-[0.8125rem]">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tải ghi chú...</span>
                  </div>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center text-[0.75rem] text-foreground-tertiary mb-2">
                        <span>{formatNoteDate(note.createdAt)}</span>
                        <div className="flex gap-3">
                          {editingNoteId === note.id ? (
                            <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => setEditingNoteId(null)}>Hủy</span>
                          ) : (
                            <>
                              <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}>Chỉnh sửa</span>
                              <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => handleDeleteNote(note.id)}>Xóa</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingNoteId === note.id ? (
                        <div className="flex flex-col gap-3">
                          <textarea 
                            className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-foreground text-[0.875rem] min-height-[80px] resize-vertical outline-none focus:border-accent-primary"
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            autoFocus
                          />
                          <button 
                            className="bg-accent-primary text-white border-none p-2 rounded-lg text-[0.875rem] font-semibold cursor-pointer w-fit self-end transition-all hover:opacity-90"
                            onClick={() => handleUpdateNote(note.id)}
                          >
                            Cập nhật
                          </button>
                        </div>
                      ) : (
                        <p className="text-[0.875rem] text-foreground leading-normal m-0">{note.content}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[0.8125rem] text-foreground-tertiary italic text-center py-4 m-0">Chưa có ghi chú nào.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AiSuggestionPanel
            suggestions={suggestions}
            tags={tags}
            priority={priority}
            sentiment={sentiment}
            loading={loadingSuggestions}
            onUse={onUseSuggestion}
            onDismiss={onDismissSuggestion}
            onUpdateTags={onUpdateTags}
            onUpdatePriority={onUpdatePriority}
            onUpdateSentiment={onUpdateSentiment}
          />
        )}


        {activeTab === 'search' && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <h3 className="text-[0.875rem] font-bold text-foreground">Search in Conversation</h3>
              <button className="text-foreground-tertiary hover:text-foreground p-1 transition-colors" onClick={() => setActiveTab('detail')}>
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary group-focus-within:text-accent-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  className="w-full bg-black/20 border border-white/10 pl-10 pr-10 py-2 rounded-lg text-[0.875rem] text-foreground outline-none focus:border-accent-primary transition-all" 
                  autoFocus 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-primary animate-spin" />}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
                    senderFilter === 'user' 
                      ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                      : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
                  )}
                  onClick={() => setSenderFilter(senderFilter === 'user' ? '' : 'user')}
                >
                  <User size={14} />
                  <span>{senderFilter === 'user' ? 'Customer only' : 'Customer'}</span>
                </div>
                <div 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
                    senderFilter === 'agent' 
                      ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                      : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
                  )}
                  onClick={() => setSenderFilter(senderFilter === 'agent' ? '' : 'agent')}
                >
                  <MessageSquare size={14} />
                  <span>{senderFilter === 'agent' ? 'Agent only' : 'Agent'}</span>
                </div>
                <div 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
                    dateFilter === 'today' 
                      ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                      : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
                  )}
                  onClick={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}
                >
                  <Calendar size={14} />
                  <span>Today</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
              {!searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-foreground-tertiary">
                    <Search size={32} />
                  </div>
                  <p className="text-[0.875rem] text-foreground-tertiary leading-relaxed">Enter a keyword to start searching for messages and files in this conversation.</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="p-3 bg-white/[0.03] border border-white/5 rounded-lg cursor-pointer transition-all hover:bg-white/10 hover:border-white/20"
                    onClick={() => onJumpToMessage?.(msg.id)}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={cn(
                        "text-[0.7rem] font-bold px-2 py-0.5 rounded uppercase",
                        msg.senderType === 'user' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                      )}>
                        {msg.senderType === 'user' ? 'Customer' : 'Agent'}
                      </span>
                      <span className="text-[0.7rem] text-foreground-tertiary">
                        {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-[0.875rem] text-foreground-secondary line-clamp-2 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              ) : !isSearching ? (
                <div className="py-10 text-center text-foreground-tertiary text-[0.875rem]">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <ContactEditModal 
        isOpen={isEditingContact}
        onClose={() => setIsEditingContact(false)}
        onSave={handleUpdateContact}
        initialData={{
          name: customerName,
          avatar: customerAvatar,
          ...contactInfo
        }}
      />
      <ManageTagsModal 
        workspaceId={workspaceId}
        isOpen={isManageTagsOpen}
        onClose={() => {
          setIsManageTagsOpen(false);
          fetchWorkspaceTags();
        }}
      />
    </aside>
  );
}
