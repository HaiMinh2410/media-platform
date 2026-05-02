'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import styles from './middle-panel.module.css';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { ThreadCard } from './thread-card';
import { ConversationSkeleton } from './skeletons';
import { useSidebarRealtime } from '../hooks/use-sidebar-realtime';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MoreHorizontal, Settings, Plus, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { getConversationAction } from '@/application/actions/inbox.actions';
import { getCurrentWorkspaceUnreadCountAction } from '@/application/actions/workspace.actions';

export function MiddlePanel({ workspaceId }: { workspaceId: string }) {
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Power user feature: Multi-thread tabs
  const [activeThreads, setActiveThreads] = useState<ConversationWithLastMessage[]>([]);

  const { 
    viewMode, platform, segmentFilter, 
    middlePanelWidth, setMiddlePanelWidth, 
    selectedGroupId, accountGroups 
  } = useInboxStore();
  
  const [totalUnread, setTotalUnread] = useState(0);


  
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeIdRef = useRef(params?.id as string | undefined);
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth > 280 && newWidth < 500) {
        setMiddlePanelWidth(newWidth);
      }
    }
  }, [setMiddlePanelWidth]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    activeIdRef.current = params?.id as string | undefined;
    
    // Add to active threads if not present
    if (activeIdRef.current) {
      const conv = conversations.find(c => c.id === activeIdRef.current);
      if (conv && !activeThreads.some(t => t.id === conv.id)) {
        setActiveThreads(prev => {
          // Keep max 5 tabs
          const next = [...prev, conv];
          if (next.length > 5) return next.slice(next.length - 5);
          return next;
        });
      }
    }
  }, [params?.id, conversations]);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<(() => void) | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);
  
  const fetchConversations = useCallback(async (cursor?: string | null, reset = false) => {
    try {
      setLoading(true);
      const url = new URL('/api/conversations', window.location.origin);
      url.searchParams.set('workspaceId', workspaceId);
      url.searchParams.set('limit', '20');
      if (cursor) url.searchParams.set('cursor', cursor);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      
      // Apply segment filter from global store (SecondaryHeader)
      if (segmentFilter === 'unread') url.searchParams.set('unread', 'true');
      if (segmentFilter === 'vip') url.searchParams.set('is_vip', 'true');
      if (segmentFilter === 'needs_reply') url.searchParams.set('status', 'open');
      if (segmentFilter === 'hot_lead') url.searchParams.set('priority', 'high');
      if (segmentFilter === 'cold') url.searchParams.set('priority', 'low');

      // Apply global scopes from LeftPanel
      if (selectedGroupId) url.searchParams.set('groupId', selectedGroupId);
      if (platform !== 'all') url.searchParams.set('platform', platform);

      // Handle Filter from the Filter dropdown
      if (filterBy === 'unread') {
        url.searchParams.set('unread', 'true');
      } else if (filterBy === 'priority') {
        url.searchParams.set('priority', 'high');
      } else if (filterBy !== 'all') {
        // Assume it's a tag
        url.searchParams.set('tag', filterBy);
      }

      // Handle Sort Field & Order
      url.searchParams.set('sortBy', sortField === 'date' ? 'lastMessageAt' : 'customer_name');
      url.searchParams.set('sortOrder', sortOrder);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.data) {
        setConversations(prev => reset ? data.data : [...prev, ...data.data]);
        setNextCursor(data.meta?.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, searchQuery, filterBy, sortField, sortOrder, platform, segmentFilter, selectedGroupId]);


  useEffect(() => {
    fetchRef.current = () => fetchConversations(null, true);
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations(null, true);
  }, [fetchConversations]);

  // Infinite Scroll via Virtualizer
  const virtualizer = useVirtualizer({
    count: nextCursor ? conversations.length + 1 : conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84, // Approx ThreadCard height
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;
    if (lastItem.index >= conversations.length - 1 && nextCursor && !loading) {
      fetchConversations(nextCursor, false);
    }
  }, [virtualItems, conversations.length, nextCursor, loading, fetchConversations]);

  const handleConversationUpdated = useCallback(
    async (
      eventType: 'INSERT' | 'UPDATE',
      partial: Pick<ConversationWithLastMessage, 'id' | 'platform_conversation_id' | 'last_message_at' | 'status' | 'priority' | 'sentiment'>
    ) => {
      if (eventType === 'INSERT') {
        fetchRef.current?.();
        return;
      }

      // Re-fetch the full conversation data to ensure accurate unread count and state
      const { data: updatedConv } = await getConversationAction(partial.id);
      if (!updatedConv) return;

      setConversations(prev => {
        const existing = prev.find(c => c.id === partial.id);
        if (!existing) return prev;

        const isNewer = new Date(updatedConv.last_message_at).getTime() > new Date(existing.last_message_at).getTime();
        
        if (isNewer && updatedConv.id !== activeIdRef.current) {
          toast(`New message from ${existing.sender_name}`, {
            description: new Date(updatedConv.last_message_at).toLocaleTimeString()
          });
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? {
                ...c,
                ...updatedConv,
              } as ConversationWithLastMessage
            : c
        );

        if (sortField === 'date' && sortOrder === 'desc') {
          return [...updated].sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        }
        return updated;
      });
    },
    [filterBy, sortField, sortOrder]
  );

  const handleMessageReceived = useCallback((payload: { conversationId: string; content: string; createdAt: Date }) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === payload.conversationId);
      if (!existing) return prev;

      const updated = prev.map(c => 
        c.id === payload.conversationId 
          ? { 
              ...c, 
              last_message_content: payload.content,
              last_message_at: payload.createdAt
            } 
          : c
      );

      if (sortField === 'date' && sortOrder === 'desc') {
        return [...updated].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      }
      return updated;
    });
  }, [filterBy, sortField, sortOrder]);

  useSidebarRealtime({ 
    workspaceId, 
    onConversationUpdated: handleConversationUpdated,
    onMessageReceived: handleMessageReceived
  });

  // Fetch total unread for header
  const refreshTotalUnread = useCallback(() => {
    getCurrentWorkspaceUnreadCountAction().then(res => {
      if (res.data !== null) setTotalUnread(res.data);
    });
  }, []);

  useEffect(() => {
    refreshTotalUnread();
  }, [workspaceId, refreshTotalUnread]);

  useUnreadRealtime({
    workspaceId,
    onRefresh: refreshTotalUnread
  });

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
        const json = await res.json();
        if (json.data) setAvailableTags(json.data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, [workspaceId]);

  if (pathname?.includes('/flow')) return null;

  const activeGroupName = selectedGroupId 
    ? accountGroups.find(g => g.id === selectedGroupId)?.name 
    : 'Unified Feed';

  return (
    <aside 
      className={styles.middlePanel} 
      ref={panelRef}
      style={{ width: middlePanelWidth }}
    >
      <div 
        className={styles.resizeHandle} 
        onMouseDown={startResizing}
      />
      {/* Multi-thread Tabs for Power Users */}
      {activeThreads.length > 0 && (
        <div className={styles.multiThreadBar}>
          {activeThreads.map(t => (
            <div 
              key={t.id} 
              className={`${styles.threadTab} ${t.id === activeIdRef.current ? styles.activeTab : ''}`}
              onClick={() => router.push(`/dashboard/inbox/${t.id}`)}
            >
              <div className={styles.avatar} style={{ width: 16, height: 16, fontSize: 8 }}>
                {t.customer_avatar ? <img src={t.customer_avatar} alt="" className={styles.avatarImg}/> : '?'}
              </div>
              <span>{t.sender_name?.split(' ')[0] || 'Unknown'}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className="flex items-center gap-2">
            <h2 className={styles.title}>{activeGroupName}</h2>
          </div>

          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors">
              <Filter size={16} />
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder="Search conversations..." 
          className={styles.searchBox}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        
        {/* Filters are now managed in the SecondaryHeader */}

        {/* Inbox Sort Bar */}
        <div className={styles.sortBar}>
          <div className={styles.countInfo}>
            <span>{conversations.length} items</span>
          </div>
          
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <select 
                className={styles.miniSelect}
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="priority">Ưu tiên</option>
                <optgroup label="Lọc theo nhãn">
                  {availableTags.map(tag => {
                    const name = tag.split('::')[0];
                    return (
                      <option key={tag} value={tag}>Nhãn: {name}</option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <select 
                className={styles.miniSelect}
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'date' | 'name')}
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
              </select>
              <button 
                className={styles.orderBtn}
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <div className={styles.listContainer} ref={parentRef}>
        {loading && conversations.length === 0 ? (
          <div className="p-4 space-y-2">
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </div>
        ) : conversations.length === 0 ? (
          <div className={styles.empty}>
            <p>No conversations found</p>
          </div>
        ) : (
          <div 
            className={styles.virtualInner}
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualItem) => {
              const isLoaderRow = virtualItem.index > conversations.length - 1;
              const conv = conversations[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <div className={styles.loading}>Loading more...</div>
                  ) : (
                    <ThreadCard 
                      conversation={conv} 
                      style={{ height: `${virtualItem.size - 4}px` }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
