'use client';

import React, { useState } from 'react';
import styles from './chat.module.css';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { useInboxStore } from '../store/inbox.store';
import { 
  Search, X, User, Calendar, MessageSquare, Loader2, 
  MoreHorizontal, ChevronRight, Camera, Info, Plus, Trash2, ChevronDown 
} from 'lucide-react';
import { MessageWithSender } from '@/domain/types/messaging';
import { format } from 'date-fns';
import clsx from 'clsx';

type TabType = 'detail' | 'ai' | 'search';

type RightSidebarProps = {
  conversationId: string;
  customerName?: string;
  customerAvatar?: string;
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
};

export function RightSidebar({
  conversationId,
  customerName,
  customerAvatar,
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
}: RightSidebarProps) {
  const activeTab = useInboxStore((state) => state.rightSidebarTab) as TabType;
  const setActiveTab = useInboxStore((state) => state.setRightSidebarTab);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageWithSender[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderFilter, setSenderFilter] = useState<'user' | 'agent' | ''>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | ''>('');

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

  return (
    <aside className={styles.rightSidebar}>
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
                <a href="#" className={styles.profileLink}>
                  Xem trang cá nhân
                </a>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.iconBtn}><MoreHorizontal size={18} /></button>
                <button className={styles.iconBtn}><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className={styles.detailItem}>
              <h3 className={styles.detailTitle}>Chi tiết liên hệ</h3>
              <p className={styles.detailDesc}>Bổ sung chi tiết về người liên hệ này.</p>
              <button className={styles.addDetailBtn}>
                <Plus size={16} /> Thêm chi tiết
              </button>
            </div>

            <div className={styles.detailItem}>
              <h3 className={styles.detailTitle}>
                Trang cá nhân trên Instagram <Info size={14} className={styles.infoIcon} />
              </h3>
              <div className={styles.socialRow}>
                <Camera size={18} className={styles.socialIcon} />
                <div className={styles.socialContent}>
                  <span className={styles.socialHandle}>minhhigh_</span>
                  <span>Sweat Today, Smile Tomorrow! Another @highminh_</span>
                  <span>Hai Minh</span>
                  <a href="https://highminh.vercel.app/" target="_blank" rel="noreferrer" className={styles.profileLink}>
                    https://highminh.vercel.app/
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Hoạt động</h3>
                <span className={styles.tagBadge}>Khuyên dùng</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <h3 className={styles.detailTitle}>
                Giai đoạn khách hàng tiềm năng <Info size={14} className={styles.infoIcon} />
              </h3>
              <button className={styles.primaryBtn}>
                Đánh dấu là khách hàng tiềm năng
              </button>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Trạng thái đơn đặt hàng</h3>
                <span className={styles.statusAction}>Xóa trạng thái</span>
              </div>
              <div className={styles.selectWrapper}>
                <select className={styles.customSelect}>
                  <option>Chọn 1 mục</option>
                </select>
                <ChevronDown size={16} className={styles.selectIcon} />
              </div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>
                  Nhãn <Info size={14} className={styles.infoIcon} />
                </h3>
                <span className={styles.statusAction}>Quản lý nhãn</span>
              </div>
              <div className={styles.tagsContainer}>
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <span key={tag} className={styles.tagBadge}>{tag}</span>
                  ))
                ) : (
                  <span className={styles.tagBadge}>Ưu tiên</span>
                )}
              </div>
              <div className={styles.tagInputWrapper}>
                <input type="text" placeholder="Thêm nhãn" className={styles.tagInput} />
              </div>
              <div className={styles.suggestedTags}>
                <p className={styles.suggestTitle}>Nhãn gợi ý</p>
                <div className={styles.suggestList}>
                  <label className={styles.suggestItem}>
                    <input type="checkbox" />
                    <span className={styles.suggestBadgeGreen}>Khách hàng mới</span>
                  </label>
                  <label className={styles.suggestItem}>
                    <input type="checkbox" />
                    <span className={styles.suggestBadgeBlue}>Ngày hôm nay (5/02)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.statusHeader}>
                <h3 className={styles.detailTitle}>Ghi chú</h3>
                <span className={styles.statusAction}>Thêm ghi chú</span>
              </div>
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
    </aside>
  );
}
