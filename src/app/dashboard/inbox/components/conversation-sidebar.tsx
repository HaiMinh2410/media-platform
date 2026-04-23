'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  }, [workspaceId, searchQuery]);

  // Stable ref for realtime callback
  useEffect(() => {
    fetchRef.current = () => fetchConversations(null, true);
  }, [fetchConversations]);

  // Initial load and search query change
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
        const exists = prev.some(c => c.id === partial.id);
        if (!exists) {
          // Unknown conversation — could belong to a different workspace, ignore
          return prev;
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? {
                ...c,
                last_message_at: partial.last_message_at,
                status: partial.status,
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

  useSidebarRealtime({ workspaceId, onConversationUpdated: handleConversationUpdated });

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
