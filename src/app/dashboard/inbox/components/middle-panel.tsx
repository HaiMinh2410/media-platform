'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import styles from './middle-panel.module.css';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { ThreadCard } from './thread-card';
import { ConversationSkeleton } from './skeletons';
import { useSidebarRealtime } from '../hooks/use-sidebar-realtime';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Filter, MoreHorizontal, Settings, Plus } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';

export function MiddlePanel({ workspaceId }: { workspaceId: string }) {
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBucket, setActiveBucket] = useState<'all' | 'unread' | 'need_reply' | 'vip'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'unread'>('newest');
  
  // Power user feature: Multi-thread tabs
  const [activeThreads, setActiveThreads] = useState<ConversationWithLastMessage[]>([]);

  const { viewMode, platform, segmentFilter } = useInboxStore();
  
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeIdRef = useRef(params?.id as string | undefined);
  
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
      url.searchParams.set('limit', '20'); // Fetch more for virtualization
      if (cursor) url.searchParams.set('cursor', cursor);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      
      // Apply buckets
      if (activeBucket === 'unread') url.searchParams.set('unread', 'true');
      if (activeBucket === 'vip') url.searchParams.set('is_vip', 'true');
      if (activeBucket === 'need_reply') url.searchParams.set('status', 'open'); // Approximate
      
      // Apply global scopes from LeftPanel
      if (platform !== 'all') url.searchParams.set('platform', platform);
      if (segmentFilter === 'hot_lead') url.searchParams.set('priority', 'high');
      
      // Sort
      if (sortBy !== 'newest') url.searchParams.set('sort', sortBy);

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
  }, [workspaceId, searchQuery, activeBucket, sortBy, platform, segmentFilter]);

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
    (
      eventType: 'INSERT' | 'UPDATE',
      partial: Pick<ConversationWithLastMessage, 'id' | 'platform_conversation_id' | 'last_message_at' | 'status' | 'priority' | 'sentiment'>
    ) => {
      if (eventType === 'INSERT') {
        fetchRef.current?.();
        return;
      }

      setConversations(prev => {
        const existing = prev.find(c => c.id === partial.id);
        if (!existing) return prev;

        const isNewer = new Date(partial.last_message_at).getTime() > new Date(existing.last_message_at).getTime();
        
        if (isNewer && partial.id !== activeIdRef.current) {
          toast(`New message from ${existing.sender_name}`, {
            description: new Date(partial.last_message_at).toLocaleTimeString()
          });
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? {
                ...c,
                last_message_at: partial.last_message_at,
                status: partial.status,
                priority: partial.priority,
                sentiment: partial.sentiment,
                unread_count: (isNewer && partial.id !== activeIdRef.current) ? c.unread_count + 1 : c.unread_count,
              }
            : c
        );

        if (sortBy === 'newest') {
          return [...updated].sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        }
        return updated;
      });
    },
    [sortBy]
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

      if (sortBy === 'newest') {
        return [...updated].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      }
      return updated;
    });
  }, [sortBy]);

  useSidebarRealtime({ 
    workspaceId, 
    onConversationUpdated: handleConversationUpdated,
    onMessageReceived: handleMessageReceived
  });

  if (pathname?.includes('/flow')) return null;

  return (
    <aside className={styles.middlePanel}>
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
          <h2 className={styles.title}>Unified Feed</h2>
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
        
        {/* Inbox Bucket Tabs */}
        <div className={styles.bucketTabs}>
          <button 
            className={`${styles.bucketTab} ${activeBucket === 'all' ? styles.activeBucket : ''}`}
            onClick={() => setActiveBucket('all')}
          >All</button>
          <button 
            className={`${styles.bucketTab} ${activeBucket === 'unread' ? styles.activeBucket : ''}`}
            onClick={() => setActiveBucket('unread')}
          >Unread</button>
          <button 
            className={`${styles.bucketTab} ${activeBucket === 'need_reply' ? styles.activeBucket : ''}`}
            onClick={() => setActiveBucket('need_reply')}
          >Need Reply</button>
          <button 
            className={`${styles.bucketTab} ${activeBucket === 'vip' ? styles.activeBucket : ''}`}
            onClick={() => setActiveBucket('vip')}
          >VIP</button>
        </div>

        {/* Inbox Sort Bar */}
        <div className={styles.sortBar}>
          <span>{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</span>
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select 
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
              <option value="unread">Unread First</option>
            </select>
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
