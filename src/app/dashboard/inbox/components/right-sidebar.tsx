'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './chat.module.css';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { ContactEditModal } from './modals/contact-edit-modal';
import { ManageTagsModal } from './modals/manage-tags-modal';
import { useInboxStore } from '../store/inbox.store';
import { 
  Search, X, User, Calendar, MessageSquare, Loader2, 
  MoreHorizontal, ChevronRight, Camera, Info, Plus, Trash2, ChevronDown,
  Phone, Mail, Cake, Home, RefreshCw
} from 'lucide-react';
import { MessageWithSender } from '@/domain/types/messaging';
import { format } from 'date-fns';
import clsx from 'clsx';

type TabType = 'detail' | 'ai' | 'search';

const leadStages = [
  { id: 'new', label: 'Tiếp nhận', description: 'Khách hàng tiềm năng mới hoặc mới đây đã tương tác với Trang của bạn.', badge: 'blue' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', description: 'Khách hàng tiềm năng thực sự quan tâm đến sản phẩm hoặc dịch vụ của bạn.', badge: 'green' },
  { id: 'converted', label: 'Đã chuyển đổi', description: 'Khách hàng tiềm năng đã thỏa thuận hoặc giao dịch với doanh nghiệp của bạn.', badge: 'purple' },
  { id: 'lost', label: 'Bị mất đi', description: 'Khách hàng tiềm năng không quan tâm nhưng có thể đáng để thu hút lại trong tương lai.', badge: 'gray' },
  { id: 'unqualified', label: 'Không đủ tiêu chuẩn', description: 'Khách hàng tiềm năng không phù hợp với doanh nghiệp của bạn.', badge: 'red' },
];

type RightSidebarProps = {
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageWithSender[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderFilter, setSenderFilter] = useState<'user' | 'agent' | ''>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | ''>('');
  const [newTag, setNewTag] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const getInitialStatus = (p: string | null) => {
    if (!p) return 'new';
    if (p === 'low') return 'new';
    if (p === 'medium') return 'qualified';
    if (p === 'high') return 'converted';
    return p;
  };

  const [leadStatus, setLeadStatus] = useState(getInitialStatus(priority));
  const [isLeadStatusOpen, setIsLeadStatusOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Đóng dropdown khi cuộn trang lớn (ví dụ cuộn chính của sidebar)
  useEffect(() => {
    const handleScroll = (e: any) => {
      // Chỉ đóng nếu cuộn bên trong sidebar (tránh các sự kiện nhỏ nhặt)
      if (isLeadStatusOpen && e.target.closest && e.target.closest('[data-sidebar="right"]')) {
        setIsLeadStatusOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isLeadStatusOpen]);

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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        onUpdateTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      onUpdateTags(tags.filter(t => t !== tagName));
    } else {
      onUpdateTags([...tags, tagName]);
    }
  };

  const handleUpdateLeadStatus = async (status: string) => {
    setLeadStatus(status);
    onUpdatePriority(status); // Using priority as a proxy for lead status for now
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
      await fetch(`/api/conversations/${conversationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      setNoteContent('');
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to save note:', err);
    }
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
    return (
      <aside className={clsx(styles.rightSidebar, styles.collapsed)}>
        <div className={styles.collapsedContent}>
          <div className={styles.collapsedAvatar} onClick={onToggleCollapse}>
            {customerAvatar ? (
              <img src={customerAvatar} alt={customerName} className={styles.avatarImg} />
            ) : (
              customerName?.charAt(0) || 'U'
            )}
            <div className={styles.platformIndicator}>
              <Camera size={10} />
            </div>
          </div>
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
                <span className={styles.tagBadge}>Khuyên dùng</span>
              </div>
              
              <h3 className={styles.detailTitle} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Giai đoạn khách hàng tiềm năng <Info size={14} className={styles.infoIcon} />
              </h3>

              <div className={styles.leadStatusDropdown} ref={dropdownRef}>
                <div 
                  className={styles.dropdownTrigger} 
                  onClick={toggleLeadStatus}
                >
                  <span>{
                    leadStages.find(s => s.id === leadStatus)?.label || 'Chọn giai đoạn'
                  }</span>
                  <ChevronDown size={16} className={clsx(isLeadStatusOpen && styles.rotate180)} />
                </div>

                {isLeadStatusOpen && isMounted && createPortal(
                  <div 
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
                  tags.map(tag => (
                    <span key={tag} className={styles.tagBadge}>
                      {tag}
                      <X 
                        size={12} 
                        className={styles.removeTagIcon} 
                        onClick={() => toggleTag(tag)}
                      />
                    </span>
                  ))
                ) : (
                  <span className={styles.tagBadge}>Ưu tiên</span>
                )}
              </div>
              <div className={styles.tagInputWrapper}>
                <input 
                  type="text" 
                  placeholder="Thêm nhãn" 
                  className={styles.tagInput} 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
              <div className={styles.suggestedTags}>
                <p className={styles.suggestTitle}>Nhãn gợi ý</p>
                <div className={styles.suggestList}>
                  {!tags.includes('Khách hàng mới') && (
                    <label className={styles.suggestItem}>
                      <input 
                        type="checkbox" 
                        checked={false}
                        onChange={() => toggleTag('Khách hàng mới')}
                      />
                      <span className={styles.suggestBadgeGreen}>Khách hàng mới</span>
                    </label>
                  )}
                  {!tags.includes('Ngày hôm nay (5/02)') && (
                    <label className={styles.suggestItem}>
                      <input 
                        type="checkbox" 
                        checked={false}
                        onChange={() => toggleTag('Ngày hôm nay (5/02)')}
                      />
                      <span className={styles.suggestBadgeBlue}>Ngày hôm nay (5/02)</span>
                    </label>
                  )}
                  {tags.includes('Khách hàng mới') && tags.includes('Ngày hôm nay (5/02)') && (
                    <p style={{ fontSize: '12px', color: 'var(--fg-tertiary)', fontStyle: 'italic' }}>
                      Không còn nhãn gợi ý
                    </p>
                  )}
                </div>
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

              <div className={styles.noteItem}>
                <div className={styles.noteMeta}>
                  <span>vài giây trước</span>
                  <div className={styles.noteActions}>
                    <span>Chỉnh sửa</span>
                    <span>Xóa</span>
                  </div>
                </div>
                <p className={styles.noteText}>test</p>
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
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
        tags={tags}
        onUpdateTags={onUpdateTags}
      />
    </aside>
  );
};
