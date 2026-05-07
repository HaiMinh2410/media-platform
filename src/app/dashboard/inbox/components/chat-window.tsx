'use client';

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { MessageWithSender } from '@/domain/types/messaging';
import { MessageBubble } from './message-bubble';
import { ChatSkeleton } from './skeletons';
import { useMessageRealtime } from '../hooks/use-inbox-realtime';
import { formatChatSeparator } from '@/lib/utils';
import { cn } from '@/lib/utils';

import { ChevronLeft, ChevronRight, X, Pin } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { TypingUser } from '../hooks/use-presence-typing';

export type ChatWindowRef = {
  addMessage: (message: MessageWithSender) => void;
  scrollToMessage: (messageId: string) => void;
};

// --- PINNED MESSAGES CAROUSEL BANNER ---
const PinnedMessageBanner = ({
  pinnedMessages,
  onJumpToMessage,
  onUnpin
}: {
  pinnedMessages: MessageWithSender[];
  onJumpToMessage: (id: string) => void;
  onUnpin: (id: string) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= pinnedMessages.length) {
      setActiveIndex(Math.max(0, pinnedMessages.length - 1));
    }
  }, [pinnedMessages.length, activeIndex]);

  if (pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[activeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev + 1) % pinnedMessages.length);
  };

  return (
    <div 
      className="sticky top-0 z-10 w-full backdrop-blur-md bg-background-secondary/70 border-b border-foreground/10 px-4.5 py-2.5 flex items-center justify-between gap-3 shadow-sm select-none transition-all hover:bg-background-secondary/80 cursor-pointer"
      onClick={() => onJumpToMessage(currentMessage.id)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
          <Pin size={14} fill="currentColor" className="rotate-45" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Tin nhắn đã ghim {pinnedMessages.length > 1 && `(${activeIndex + 1}/${pinnedMessages.length})`}
          </span>
          <span className="text-sm text-foreground-secondary truncate max-w-full font-medium">
            {currentMessage.content || 'Ghim tập tin / phương tiện'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {pinnedMessages.length > 1 && (
          <div className="flex items-center gap-1.5 bg-foreground/5 rounded-full p-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/5 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
              title="Tin nhắn ghim trước"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-foreground-tertiary font-bold px-1 select-none">
              {activeIndex + 1}/{pinnedMessages.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/5 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
              title="Tin nhắn ghim tiếp theo"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(currentMessage.id);
          }}
          className="p-1.5 rounded-full text-foreground-tertiary hover:text-error hover:bg-error/10 transition-all duration-150 cursor-pointer border-0 bg-transparent flex items-center justify-center"
          title="Bỏ ghim tin nhắn này"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const ChatWindow = forwardRef<ChatWindowRef, { conversationId: string; typingUsers?: TypingUser[] }>(
  ({ conversationId, typingUsers = [] }, ref) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const seenIds = useRef<Set<string>>(new Set());

  const refreshCounter = useInboxStore(state => state.refreshCounter);
  const triggerRefresh = useInboxStore(state => state.triggerRefresh);

  const fetchPinnedMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?isPinned=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setPinnedMessages(data.data);
        }
      }
    } catch (err) {
      console.error('[ChatWindow] Failed to fetch pinned messages:', err);
    }
  }, [conversationId]);

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
    fetchPinnedMessages();

    fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(
      (err) => console.warn('[ChatWindow] Failed to mark conversation as read:', err)
    );
  }, [fetchMessages, fetchPinnedMessages, conversationId]);

  useEffect(() => {
    fetchPinnedMessages();
  }, [fetchPinnedMessages, refreshCounter]);

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
          is_pinned: updated.is_pinned ?? updated.isPinned ?? m.is_pinned,
        };
      }
      return m;
    }));
    fetchPinnedMessages();
  }, [fetchPinnedMessages]);

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Gorgeous premium glowing focus ring transition
      element.classList.add("ring-4", "ring-indigo-500/50", "ring-offset-4", "scale-[1.01]", "transition-all", "duration-500", "ease-out", "z-10");
      const bubble = element.querySelector('.w-fit');
      if (bubble) {
        bubble.classList.add("shadow-xl", "shadow-indigo-500/20", "border-indigo-500/50");
      }
      
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-indigo-500/50", "ring-offset-4", "scale-[1.01]");
        if (bubble) {
          bubble.classList.remove("shadow-xl", "shadow-indigo-500/20", "border-indigo-500/50");
        }
      }, 2000);
    } else {
      console.warn(`[ChatWindow] Message ${messageId} not found in current window`);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    addMessage: (message: MessageWithSender) => {
      handleNewMessage(message);
    },
    scrollToMessage: (messageId: string) => {
      scrollToMessage(messageId);
    }
  }), [handleNewMessage, scrollToMessage]);

  useMessageRealtime({ 
    conversationId, 
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleUpdateMessage 
  });

  // Scroll to bottom when someone starts typing to ensure the indicator is visible
  useEffect(() => {
    if (typingUsers.length > 0 && scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [typingUsers.length]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Glassmorphic Sticky Pinned Message Banner */}
      {pinnedMessages.length > 0 && (
        <PinnedMessageBanner 
          pinnedMessages={pinnedMessages} 
          onJumpToMessage={scrollToMessage}
          onUnpin={async (id) => {
            try {
              const res = await fetch(`/api/conversations/${conversationId}/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  target: 'message',
                  messageId: id,
                  isPinned: false
                })
              });
              if (res.ok) {
                setPinnedMessages(prev => prev.filter(m => m.id !== id));
                triggerRefresh();
              }
            } catch (err) {
              console.error('Failed to unpin message:', err);
            }
          }}
        />
      )}

      {/* Main scrolling chat window */}
      <div 
        className="flex-1 overflow-y-auto p-6 flex flex-col bg-transparent scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent" 
        ref={scrollRef}
      >
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
                  <span className="bg-base-200 px-4 py-1 rounded-full text-xs font-medium text-foreground-tertiary border border-foreground/10 relative z-10">
                    {formatChatSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble 
                message={msg} 
                showStatus={showStatus} 
                conversationId={conversationId}
              />
            </React.Fragment>
          );
        })}
        
        {/* Typing Indicators */}
        {typingUsers.map((u) => (
          <div key={u.senderId} className="flex items-center gap-2.5 px-3 py-1.5 mt-2 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center font-bold text-xs border border-foreground/10 overflow-hidden shrink-0 shadow-sm">
              {u.avatar ? (
                <img src={u.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                u.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-background-secondary border border-foreground/10 px-4 py-2 rounded-2xl max-w-[70%] shadow-sm">
              <span className="text-sm font-medium text-foreground-secondary">{u.name} đang soạn tin</span>
              <div className="flex gap-1 items-center ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
              </div>
            </div>
          </div>
        ))}

        {!loading && messages.length === 0 && (
          <div className="p-4 text-center text-foreground-tertiary text-sm">No messages found for this conversation.</div>
        )}
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
