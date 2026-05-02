'use client';

import React, { useState } from 'react';
import styles from './chat.module.css';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { useInboxStore } from '../store/inbox.store';
import { Search, X, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { MessageWithSender } from '@/domain/types/messaging';
import { format } from 'date-fns';
import clsx from 'clsx';

type TabType = 'conversation' | 'notes' | 'ai' | 'profile' | 'search';

type RightSidebarProps = {
  conversationId: string;
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
          className={`${styles.tabBtn} ${activeTab === 'conversation' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Details
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Assist
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
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
        {activeTab === 'conversation' && (
          <div className={styles.intelSidebar}>
            <div className={styles.intelSection}>
              <h3>Contact Intel</h3>
              <div className={styles.intelGrid}>
                <div className={styles.intelCard}>
                  <span className={styles.intelLabel}>Lead Score</span>
                  <span className={styles.intelValue}>85/100</span>
                </div>
                <div className={styles.intelCard}>
                  <span className={styles.intelLabel}>Sentiment</span>
                  <span className={styles.intelValue}>{sentiment || 'Neutral'}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.intelSection}>
              <h3>Channel Activity</h3>
              <div className={styles.activityStats}>
                <div className={styles.statRow}>
                  <span>Total Messages</span>
                  <strong>24</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Avg Response Time</span>
                  <strong>15m</strong>
                </div>
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

        {activeTab === 'notes' && (
          <div className={styles.notesSection}>
            <p className={styles.emptyText}>No notes yet. Add a note to collaborate with your team.</p>
            <textarea 
              className={styles.notesArea} 
              placeholder="Add internal note..."
            ></textarea>
            <button className={styles.saveNoteBtn}>Save Note</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className={styles.profileSection}>
            <div className={styles.profileField}>
              <label>Email</label>
              <input type="email" placeholder="customer@example.com" className={styles.profileInput} />
            </div>
            <div className={styles.profileField}>
              <label>Phone</label>
              <input type="tel" placeholder="+1234567890" className={styles.profileInput} />
            </div>
            <button className={styles.saveNoteBtn}>Update CRM</button>
          </div>
        )}

        {activeTab === 'search' && (
          <div className={styles.searchSection}>
            <div className={styles.searchHeader}>
              <h3>Search in Conversation</h3>
              <button className={styles.closeSearch} onClick={() => setActiveTab('conversation')}>
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
