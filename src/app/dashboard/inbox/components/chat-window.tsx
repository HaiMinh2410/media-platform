'use client';

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';
import { MessageBubble } from './message-bubble';
import { ChatSkeleton } from './skeletons';
import { useMessageRealtime } from '../hooks/use-inbox-realtime';

export type ChatWindowRef = {
  addMessage: (message: MessageWithSender) => void;
};

export const ChatWindow = forwardRef<ChatWindowRef, { conversationId: string }>(
  ({ conversationId }, ref) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef(true);
  // Track IDs so Realtime duplicates from the initial fetch are ignored
  const seenIds = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async (cursor?: string | null) => {
    try {
      setLoading(true);
      const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin);
      url.searchParams.set('limit', '50');
      if (cursor) url.searchParams.set('cursor', cursor);

      // Record scroll height before adding new items
      if (scrollRef.current) {
        previousScrollHeight.current = scrollRef.current.scrollHeight;
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.data) {
        // API returns newest first. We reverse to make oldest first for chronological order visually.
        const chronologicalChunk = [...data.data].reverse() as MessageWithSender[];
        
        // Track seen IDs to avoid realtime duplicates
        chronologicalChunk.forEach(m => seenIds.current.add(m.id));
        
        setMessages(prev => {
          // If cursor is present, we are prepending older chunks at the top
          return cursor ? [...chronologicalChunk, ...prev] : chronologicalChunk;
        });
        
        setNextCursor(data.meta?.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial fetch + mark conversation as read
  useEffect(() => {
    isInitialLoad.current = true;
    seenIds.current = new Set();
    fetchMessages(null);

    // Fire-and-forget: mark all messages as read when entering the conversation
    fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(
      (err) => console.warn('[ChatWindow] Failed to mark conversation as read:', err)
    );
  }, [fetchMessages, conversationId]);

  // Handle scroll position maintenance
  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollEl = scrollRef.current;

    if (isInitialLoad.current && messages.length > 0) {
      // First load: scroll to bottom
      scrollEl.scrollTo(0, scrollEl.scrollHeight);
      isInitialLoad.current = false;
    } else if (messages.length > 0 && previousScrollHeight.current > 0) {
      // Older items fetched: maintain user's view by adjusting scroll
      const heightDifference = scrollEl.scrollHeight - previousScrollHeight.current;
      scrollEl.scrollTo(0, scrollEl.scrollTop + heightDifference);
      previousScrollHeight.current = 0;
    }
  }, [messages]);

  // Fetch more when scrolling to top
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          fetchMessages(nextCursor);
        }
      },
      { threshold: 0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [nextCursor, loading, fetchMessages]);

  // Realtime: append new messages arriving from Supabase
  const handleNewMessage = useCallback((message: MessageWithSender) => {
    // Dedup: ignore if we already fetched this message in the initial load
    // or if it was added optimistically via addMessage ref
    if (seenIds.current.has(message.id)) return;
    seenIds.current.add(message.id);

    setMessages(prev => [...prev, message]);

    // Auto-scroll to bottom when new message arrives (only if already at bottom)
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }, []);

  // Expose addMessage to parent so ReplyBox can trigger optimistic updates
  useImperativeHandle(ref, () => ({
    addMessage: (message: MessageWithSender) => {
      handleNewMessage(message);
    }
  }), [handleNewMessage]);

  useMessageRealtime({ conversationId, onNewMessage: handleNewMessage });

  return (
    <div className={styles.messagesArea} ref={scrollRef}>
      {/* Invisible target at the top for infinite scroll backwards */}
      <div ref={observerTarget} style={{ height: '1px', opacity: 0 }} />

      {loading && nextCursor && (
        <div className={styles.loadingTop}>Loading older messages...</div>
      )}
      
      {/* Initial loading state */}
      {loading && messages.length === 0 && <ChatSkeleton />}

      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      
      {!loading && messages.length === 0 && (
        <div className={styles.loadingTop}>No messages found for this conversation.</div>
      )}
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
