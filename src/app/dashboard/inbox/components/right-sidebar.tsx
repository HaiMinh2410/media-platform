'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import styles from './chat.module.css';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { ContactEditModal } from './modals/contact-edit-modal';
import { ManageTagsModal } from './modals/manage-tags-modal';
import { useInboxStore } from '../store/inbox.store';
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
    if (!p) return 'new';
    if (p === 'low') return 'new';
    if (p === 'medium') return 'qualified';
    if (p === 'high') return 'converted';
    return p;
  };

  const [leadStatus, setLeadStatus] = useState(getInitialStatus(priority));
  const [isLead, setIsLead] = useState(priority !== null && priority !== 'none');

  useEffect(() => {
    setIsLead(priority !== null && priority !== 'none');
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
      <aside className={clsx(styles.rightSidebar, styles.collapsed)}>
        <div className={styles.collapsedContent}>
          {/* Active Conversation Avatar - Toggles Sidebar */}
          <div 
            className={clsx(styles.collapsedAvatar, styles.activeTabCollapsed)} 
            onClick={onToggleCollapse}
            title={customerName || 'Active Conversation'}
          >
            {customerAvatar ? (
              <img src={customerAvatar} alt={customerName} className={styles.avatarImg} />
            ) : (
              customerName?.charAt(0) || 'U'
            )}
            <div className={styles.platformIndicator}>
              <Camera size={10} />
            </div>
          </div>

          {/* Divider */}
          {otherThreads.length > 0 && <div className={styles.collapsedDivider} />}

          {/* Other Active Threads */}
          {otherThreads.length > 0 && (
            <div className={styles.multiThreadList}>
              {otherThreads.map(t => (
                <div 
                  key={t.id} 
                  className={styles.threadTabCollapsed}
                  onClick={() => router.push(`/dashboard/inbox/${t.id}`)}
                  title={t.sender_name || 'Switch conversation'}
                >
                  {t.customer_avatar ? (
                    <img src={t.customer_avatar} alt="" className={styles.avatarImg} style={{ borderRadius: '50%' }} />
                  ) : (
                    <span>{t.sender_name?.charAt(0) || '?'}</span>
                  )}
                  
                  <button 
                    className={styles.removeThreadBtn}
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
    <aside className={styles.rightSidebar} data-sidebar="right">
      <div className={styles.workspaceTabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'detail' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          Detail
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Assist
        </button>
        {activeTab === 'search' && (
          <button 
            className={`${styles.tabBtn} ${styles.tabActive}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        )}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'detail' && (
          <div className={styles.detailSection}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {customerAvatar ? (
                  <img src={customerAvatar} alt={customerName} className={styles.avatarImg} />
                ) : (
                  customerName?.charAt(0) || 'U'
                )}
              </div>
              <div className={styles.profileInfo}>
                <h4 className={styles.profileName}>{customerName || 'Unknown'}</h4>
                {platform === 'instagram' ? (
                  customerUsername ? (
                    <a 
                      href={`https://www.instagram.com/${customerUsername}/`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={styles.profileLink}
                    >
                      Xem trang cá nhân
                    </a>
                  ) : (
                    <>
                      <span 
                        className={styles.profileLinkDisabled} 
                        title="Chưa đồng bộ được username Instagram. Nhấn 'Làm mới' để thử lại."
                      >
                        Chưa có liên kết
                      </span>
                      <button 
                        className={styles.syncBtn} 
                        onClick={handleSyncProfile}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={12} className={clsx(isSyncing && styles.spin)} />
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
                      className={styles.profileLink}
                    >
                      Xem trang cá nhân
                    </a>
                  ) : (
                    <>
                      <span 
                        className={styles.profileLinkDisabled} 
                        title="Facebook hạn chế link trang cá nhân qua API nếu không có quyền user_link. Nhấn 'Làm mới' để thử lại."
                      >
                        Chưa có liên kết
                      </span>
                      <button 
                        className={styles.syncBtn} 
                        onClick={handleSyncProfile}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={12} className={clsx(isSyncing && styles.spin)} />
                        Làm mới
                      </button>
                    </>
                  )
                )}
              </div>
              <div className={styles.headerActions}>
                <button className={styles.iconBtn} onClick={onToggleCollapse}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Chi tiết liên hệ</h3>
                {hasContactInfo && (
                  <div className={styles.contactActions}>
                    <span className={styles.statusAction} onClick={() => setIsEditingContact(true)}>Chỉnh sửa</span>
                    <span className={styles.deleteAction} onClick={handleDeleteContact}>Xóa</span>
                  </div>
                )}
              </div>
              <div className={styles.contactDetails}>
                {hasContactInfo ? (
                  <>
                    <p className={styles.addedLabel}>Chi tiết đã thêm</p>
                    {contactInfo.phone && (
                      <div className={styles.contactRow}>
                        <Phone size={16} className={styles.contactIcon} />
                        <span className={styles.contactValue}>{contactInfo.phone}</span>
                      </div>
                    )}
                    {contactInfo.email && (
                      <div className={styles.contactRow}>
                        <Mail size={16} className={styles.contactIcon} />
                        <span className={styles.contactValue}>{contactInfo.email}</span>
                      </div>
                    )}
                    {contactInfo.birthday && (
                      <div className={styles.contactRow}>
                        <Cake size={16} className={styles.contactIcon} />
                        <span className={styles.contactValue}>
                          {new Date(contactInfo.birthday).getDate()} tháng {new Date(contactInfo.birthday).getMonth() + 1}
                        </span>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className={styles.contactRow}>
                        <Home size={16} className={styles.contactIcon} />
                        <span className={styles.contactValue}>{contactInfo.address}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className={styles.detailDesc}>Bổ sung chi tiết về người liên hệ này.</p>
                    <button className={styles.addDetailBtn} onClick={() => setIsEditingContact(true)}>
                      <Plus size={16} /> Thêm chi tiết
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Hoạt động</h3>
                <div className={styles.headerActions}>
                  {isLead && (
                    <span 
                      className={styles.statusAction} 
                      onClick={() => {
                        setIsLead(false);
                        handleUpdateLeadStatus('none');
                        toast.info('Đã bỏ đánh dấu khách hàng tiềm năng');
                      }}
                    >
                      Bỏ đánh dấu
                    </span>
                  )}
                  <span className={styles.tagBadge}>Khuyên dùng</span>
                </div>
              </div>
              
              <h3 className={styles.detailTitle} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Giai đoạn khách hàng tiềm năng <Info size={14} className={styles.infoIcon} />
              </h3>

              <div className={styles.leadStatusDropdown} ref={dropdownRef}>
                {!isLead ? (
                  <div 
                    className={styles.dropdownTrigger} 
                    style={{ justifyContent: 'center', color: 'var(--fg-secondary)' }}
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
                    className={styles.dropdownTrigger} 
                    onClick={toggleLeadStatus}
                  >
                    <span>{
                      leadStages.find(s => s.id === leadStatus)?.label || 'Chọn giai đoạn'
                    }</span>
                    <ChevronDown size={16} className={clsx(isLeadStatusOpen && styles.rotate180)} />
                  </div>
                )}

                {isLeadStatusOpen && isMounted && createPortal(
                  <div 
                    ref={menuRef}
                    className={clsx(styles.leadStatusMenu, dropdownDirection === 'up' && styles.leadStatusMenuUp)}
                    style={{
                      position: 'fixed',
                      top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
                      bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
                      left: dropdownPos.left,
                      right: 'auto',
                      width: dropdownPos.width,
                      zIndex: 10000,
                      maxHeight: dropdownDirection === 'down' 
                        ? window.innerHeight - dropdownPos.top - 60 
                        : dropdownPos.top - 20
                    }}
                  >
                    <div className={styles.menuList}>
                      {leadStages.map((stage) => (
                        <div 
                          key={stage.id} 
                          className={clsx(styles.menuItem, leadStatus === stage.id && styles.menuItemActive)}
                          onClick={() => {
                            handleUpdateLeadStatus(stage.id);
                            setIsLeadStatusOpen(false);
                          }}
                        >
                          <div className={styles.itemRadio}>
                            <div className={clsx(styles.radioOuter, leadStatus === stage.id && styles.radioActive)}>
                              {leadStatus === stage.id && <div className={styles.radioInner} />}
                            </div>
                          </div>
                          <div className={styles.itemContent}>
                            <div className={styles.itemHeader}>
                              <span className={styles.itemLabel}>{stage.label}</span>
                              <span className={clsx(styles.statusBadge, styles[`badge${stage.badge.charAt(0).toUpperCase() + stage.badge.slice(1)}`])}>
                                {stage.label}
                              </span>
                            </div>
                            <p className={styles.itemDesc}>{stage.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.menuFooter}>
                      <span>Bạn có thể tạo giai đoạn tùy chỉnh trong <a href="#">Leads Center</a>.</span>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>
                  Nhãn <Info size={14} className={styles.infoIcon} />
                </h3>
                <span 
                  className={styles.statusAction}
                  onClick={() => setIsManageTagsOpen(true)}
                >
                  Quản lý nhãn
                </span>
              </div>
              <div className={styles.tagsContainer}>
                {tags.length > 0 ? (
                  tags.map(tag => {
                    const { name, color } = parseTag(tag);
                    return (
                      <span 
                        key={tag} 
                        className={styles.tagBadge}
                        style={{ 
                          backgroundColor: `${color}15`, 
                          color: color,
                          border: `1px solid ${color}30`
                        }}
                      >
                        {name}
                        <X 
                          size={12} 
                          className={styles.removeTagIcon} 
                          onClick={() => toggleTag(tag)}
                        />
                      </span>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--fg-tertiary)', fontStyle: 'italic', margin: '8px 0' }}>
                    Chưa có nhãn nào được gắn
                  </p>
                )}
              </div>

              <div className={styles.tagInputWrapper} ref={tagDropdownRef}>
                <div 
                  className={styles.dropdownTrigger} 
                  onClick={toggleTagDropdown}
                >
                  <span>Thêm nhãn</span>
                  <Plus size={16} />
                </div>

                {isTagDropdownOpen && isMounted && createPortal(
                  <div 
                    ref={tagMenuRef}
                    className={clsx(styles.leadStatusMenu, styles.tagSelectMenu, dropdownDirection === 'up' && styles.leadStatusMenuUp)}
                    style={{
                      position: 'fixed',
                      top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
                      bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
                      left: dropdownPos.left,
                      right: 'auto',
                      width: dropdownPos.width,
                      zIndex: 10000,
                    }}
                  >
                    <div className={styles.menuList}>
                      {unappliedTags.length > 0 ? (
                        unappliedTags.map((tag) => {
                          const { name, color } = parseTag(tag);
                          return (
                            <div 
                              key={tag} 
                              className={styles.menuItem}
                              onClick={() => {
                                toggleTag(tag);
                                setIsTagDropdownOpen(false);
                              }}
                            >
                              <div 
                                className={styles.colorDot} 
                                style={{ backgroundColor: color }} 
                              />
                              <span className={styles.itemLabel}>{name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.emptyText}>Không còn nhãn nào để thêm</div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Ghi chú</h3>
                <span className={styles.statusAction} onClick={() => setIsAddingNote(!isAddingNote)}>
                  {isAddingNote ? 'Hủy' : 'Thêm ghi chú'}
                </span>
              </div>
              
              {isAddingNote && (
                <div className={styles.addNoteForm}>
                  <textarea 
                    className={styles.noteInput}
                    placeholder="Nhập nội dung ghi chú..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <button 
                    className={styles.saveNoteBtn}
                    onClick={handleSaveNote}
                  >
                    Lưu ghi chú
                  </button>
                </div>
              )}

              <div className={styles.notesList}>
                {isLoadingNotes ? (
                  <div className={styles.loadingNotes}>
                    <Loader2 size={16} className={styles.spin} />
                    <span>Đang tải ghi chú...</span>
                  </div>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className={styles.noteItem}>
                      <div className={styles.noteMeta}>
                        <span>{formatNoteDate(note.createdAt)}</span>
                        <div className={styles.noteActions}>
                          {editingNoteId === note.id ? (
                            <span onClick={() => setEditingNoteId(null)}>Hủy</span>
                          ) : (
                            <>
                              <span onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}>Chỉnh sửa</span>
                              <span onClick={() => handleDeleteNote(note.id)}>Xóa</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingNoteId === note.id ? (
                        <div className={styles.editNoteForm}>
                          <textarea 
                            className={styles.noteInput}
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            autoFocus
                          />
                          <button 
                            className={styles.saveNoteBtn}
                            onClick={() => handleUpdateNote(note.id)}
                          >
                            Cập nhật
                          </button>
                        </div>
                      ) : (
                        <p className={styles.noteText}>{note.content}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyNotes}>Chưa có ghi chú nào.</p>
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
          <div className={styles.searchSection}>
            <div className={styles.searchHeader}>
              <h3>Search in Conversation</h3>
              <button className={styles.closeSearch} onClick={() => setActiveTab('detail')}>
                <X size={16} />
              </button>
            </div>
            
            <div className={styles.searchControls}>
              <div className={styles.searchBar}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  className={styles.sidebarSearchInput} 
                  autoFocus 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 size={16} className={styles.loadingSpinner} />}
              </div>
              
              <div className={styles.searchFilters}>
                <div 
                  className={clsx(styles.filterChip, senderFilter === 'user' && styles.activeFilter)}
                  onClick={() => setSenderFilter(senderFilter === 'user' ? '' : 'user')}
                >
                  <User size={14} />
                  <span>{senderFilter === 'user' ? 'Customer only' : 'Customer'}</span>
                </div>
                <div 
                  className={clsx(styles.filterChip, senderFilter === 'agent' && styles.activeFilter)}
                  onClick={() => setSenderFilter(senderFilter === 'agent' ? '' : 'agent')}
                >
                  <MessageSquare size={14} />
                  <span>{senderFilter === 'agent' ? 'Agent only' : 'Agent'}</span>
                </div>
                <div 
                  className={clsx(styles.filterChip, dateFilter === 'today' && styles.activeFilter)}
                  onClick={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}
                >
                  <Calendar size={14} />
                  <span>Today</span>
                </div>
              </div>
            </div>

            <div className={styles.searchResultsList}>
              {!searchQuery.trim() ? (
                <div className={styles.searchEmpty}>
                  <div className={styles.emptyIcon}>
                    <Search size={48} />
                  </div>
                  <p>Enter a keyword to start searching for messages and files in this conversation.</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={styles.searchResultItem}
                    onClick={() => onJumpToMessage?.(msg.id)}
                  >
                    <div className={styles.resultHeader}>
                      <span className={clsx(styles.resultSender, styles[msg.senderType])}>
                        {msg.senderType === 'user' ? 'Customer' : 'Agent'}
                      </span>
                      <span className={styles.resultTime}>
                        {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className={styles.resultContent}>{msg.content}</p>
                  </div>
                ))
              ) : !isSearching ? (
                <div className={styles.searchEmpty}>
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
};
