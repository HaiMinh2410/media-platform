'use client';

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { MessageWithSender } from '@/domain/types/messaging';
import { MessageBubble } from './message-bubble';
import { ChatSkeleton } from './skeletons';
import { useMessageRealtime } from '../hooks/use-inbox-realtime';
import { formatChatSeparator } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type ChatWindowRef = {
  addMessage: (message: MessageWithSender) => void;
  scrollToMessage: (messageId: string) => void;
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
  const seenIds = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async (cursor?: string | null) => {
    try {
      setLoading(true);
      const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin);
      url.searchParams.set('limit', '50');
      if (cursor) url.searchParams.set('cursor', cursor);

      if (scrollRef.current) {
        previousScrollHeight.current = scrollRef.current.scrollHeight;
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.data) {
        const chronologicalChunk = [...data.data].reverse() as MessageWithSender[];
        chronologicalChunk.forEach(m => seenIds.current.add(m.id));
        
        setMessages(prev => {
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

  useEffect(() => {
    isInitialLoad.current = true;
    seenIds.current = new Set();
    fetchMessages(null);

    fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(
      (err) => console.warn('[ChatWindow] Failed to mark conversation as read:', err)
    );
  }, [fetchMessages, conversationId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollEl = scrollRef.current;

    if (isInitialLoad.current && messages.length > 0) {
      scrollEl.scrollTo(0, scrollEl.scrollHeight);
      isInitialLoad.current = false;
    } else if (messages.length > 0 && previousScrollHeight.current > 0) {
      const heightDifference = scrollEl.scrollHeight - previousScrollHeight.current;
      scrollEl.scrollTo(0, scrollEl.scrollTop + heightDifference);
      previousScrollHeight.current = 0;
    }
  }, [messages]);

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

  const handleNewMessage = useCallback((message: MessageWithSender) => {
    if (seenIds.current.has(message.id)) return;
    seenIds.current.add(message.id);

    setMessages(prev => [...prev, message]);

    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }, []);

  const handleUpdateMessage = useCallback((updated: any) => {
    setMessages(prev => prev.map(m => {
      if (m.id === updated.id) {
        return {
          ...m,
          is_read: updated.is_read ?? updated.isRead ?? m.is_read,
          is_delivered: updated.is_delivered ?? updated.isDelivered ?? m.is_delivered,
        };
      }
      return m;
    }));
  }, []);

  useImperativeHandle(ref, () => ({
    addMessage: (message: MessageWithSender) => {
      handleNewMessage(message);
    },
    scrollToMessage: (messageId: string) => {
      const element = document.getElementById(`msg-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add("ring-2", "ring-accent-primary", "ring-offset-2", "ring-offset-background", "rounded-[20px]", "animate-pulse");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-accent-primary", "ring-offset-2", "ring-offset-background", "rounded-[20px]", "animate-pulse");
        }, 2000);
      } else {
        console.warn(`[ChatWindow] Message ${messageId} not found in current window`);
      }
    }
  }), [handleNewMessage]);

  useMessageRealtime({ 
    conversationId, 
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleUpdateMessage 
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col bg-transparent scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent" ref={scrollRef}>
      <div ref={observerTarget} style={{ height: '1px', opacity: 0 }} />

      {loading && nextCursor && (
        <div className="p-4 text-center text-foreground-tertiary text-sm">Loading older messages...</div>
      )}
      
      {loading && messages.length === 0 && <ChatSkeleton />}

      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : null;
        
        let showSeparator = false;
        if (!prevMsg) {
          showSeparator = true;
        } else {
          const currDate = new Date(msg.createdAt);
          const prevDate = new Date(prevMsg.createdAt);
          const isSameDay = currDate.toDateString() === prevDate.toDateString();
          const diffMins = (currDate.getTime() - prevDate.getTime()) / (1000 * 60);
          
          if (!isSameDay || diffMins > 20) {
            showSeparator = true;
          }
        }

        const isLastMessage = index === messages.length - 1;
        const isOutgoing = msg.senderType === 'ai' || msg.senderType === 'agent';
        const showStatus = isLastMessage && isOutgoing;

        return (
          <React.Fragment key={msg.id}>
            {showSeparator && (
              <div className="flex justify-center items-center my-6 relative before:content-[''] before:absolute before:left-0 before:right-0 before:top-1/2 before:h-px before:bg-foreground/5">
                <span className="bg-base-200 px-4 py-1 rounded-full text-11 font-medium text-foreground-tertiary border border-foreground/10 relative z-10">
                  {formatChatSeparator(msg.createdAt)}
                </span>
              </div>
            )}
            <MessageBubble 
              message={msg} 
              showStatus={showStatus} 
            />
          </React.Fragment>
        );
      })}
      
      {!loading && messages.length === 0 && (
        <div className="p-4 text-center text-foreground-tertiary text-sm">No messages found for this conversation.</div>
      )}
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
