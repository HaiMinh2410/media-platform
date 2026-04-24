'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import styles from './conversation-sidebar.module.css';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { ConversationItem } from './conversation-item';
import { ConversationSkeleton } from './skeletons';
import { useSidebarRealtime } from '../hooks/use-sidebar-realtime';

export function ConversationSidebar({ workspaceId }: { workspaceId: string }) {
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'open' | 'done'>('all');
  
  const params = useParams();
  const activeIdRef = useRef(params?.id);
  
  useEffect(() => {
    activeIdRef.current = params?.id;
  }, [params?.id]);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  // Stable ref to fetch so the realtime callback can trigger a refetch
  const fetchRef = useRef<(() => void) | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);
  
  const fetchConversations = useCallback(async (cursor?: string | null, reset = false) => {
    try {
      setLoading(true);
      const url = new URL('/api/conversations', window.location.origin);
      url.searchParams.set('workspaceId', workspaceId);
      url.searchParams.set('limit', '15');
      if (cursor) url.searchParams.set('cursor', cursor);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      if (activeFilter === 'unread') url.searchParams.set('unread', 'true');
      if (activeFilter === 'open' || activeFilter === 'done') url.searchParams.set('status', activeFilter);

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
  }, [workspaceId, searchQuery, activeFilter]);

  // Stable ref for realtime callback
  useEffect(() => {
    fetchRef.current = () => fetchConversations(null, true);
  }, [fetchConversations]);

  // Initial load and whenever filters change
  useEffect(() => {
    fetchConversations(null, true);
  }, [fetchConversations]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          fetchConversations(nextCursor, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [nextCursor, loading, fetchConversations]);

  // Realtime: handle conversation INSERT/UPDATE events
  // Strategy: on UPDATE, optimistically update last_message_at in local state and re-sort.
  // On INSERT, refetch the first page so the new conversation appears at the top.
  const handleConversationUpdated = useCallback(
    (
      eventType: 'INSERT' | 'UPDATE',
      partial: Pick<ConversationWithLastMessage, 'id' | 'platform_conversation_id' | 'last_message_at' | 'status'>
    ) => {
      if (eventType === 'INSERT') {
        // Refetch to pick up the new conversation with all joined fields (platform, sender_name, etc.)
        fetchRef.current?.();
        return;
      }

      // UPDATE: patch in-place and re-sort by last_message_at desc
      setConversations(prev => {
        const existing = prev.find(c => c.id === partial.id);
        if (!existing) {
          // Unknown conversation — could belong to a different workspace, ignore
          return prev;
        }

        const isNewer = new Date(partial.last_message_at).getTime() > new Date(existing.last_message_at).getTime();
        
        if (isNewer && partial.id !== activeIdRef.current) {
          toast(`New message from ${existing.sender_name}`, {
            description: new Date(partial.last_message_at).toLocaleTimeString()
          });
          // Also, we could optimistically increment unread_count here, but simple refetching logic is safer for accuracy.
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? {
                ...c,
                last_message_at: partial.last_message_at,
                status: partial.status,
                // If it's a new message and not active, pessimistically increment unread count
                unread_count: (isNewer && partial.id !== activeIdRef.current) ? c.unread_count + 1 : c.unread_count,
              }
            : c
        );

        // Re-sort: most recently active first
        return [...updated].sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      });
    },
    []
  );

  const handleMessageReceived = useCallback((payload: { conversationId: string; content: string; createdAt: Date }) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === payload.conversationId);
      if (!existing) return prev;

      // Update the preview text and timestamp
      const updated = prev.map(c => 
        c.id === payload.conversationId 
          ? { 
              ...c, 
              last_message_content: payload.content,
              last_message_at: payload.createdAt
            } 
          : c
      );

      // Re-sort: move the updated conversation to the top
      return [...updated].sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    });
  }, []);

  useSidebarRealtime({ 
    workspaceId, 
    onConversationUpdated: handleConversationUpdated,
    onMessageReceived: handleMessageReceived
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Inbox</h2>
        </div>
        <input 
          type="text" 
          placeholder="Search messages..." 
          className={styles.searchBox}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.filterTab} ${activeFilter === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveFilter('all')}
          >All</button>
          <button 
            className={`${styles.filterTab} ${activeFilter === 'unread' ? styles.activeTab : ''}`}
            onClick={() => setActiveFilter('unread')}
          >Unread</button>
          <button 
            className={`${styles.filterTab} ${activeFilter === 'open' ? styles.activeTab : ''}`}
            onClick={() => setActiveFilter('open')}
          >Open</button>
        </div>
      </div>

      <div className={styles.list}>
        {conversations.map(conv => (
          <ConversationItem key={conv.id} conversation={conv} />
        ))}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </div>
        )}
        
        {!loading && conversations.length === 0 && (
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 48, height: 48, opacity: 0.2, marginBottom: 16}}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <polyline points="22 7 12 14 2 7" />
            </svg>
            <p>No conversations found</p>
          </div>
        )}
        
        {/* Invisible target for intersection observer */}
        <div ref={observerTarget} style={{ height: '10px' }} />
      </div>
    </aside>
  );
}
