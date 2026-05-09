'use client';

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageWithSender } from '@/domain/types/messaging';
import { MessageBubble } from './message-bubble';
import { ChatSkeleton } from './skeletons';
import { useMessageRealtime } from '../hooks/use-inbox-realtime';
import { formatChatSeparator } from '@/lib/utils';
import { cn } from '@/lib/utils';

import { ChevronLeft, ChevronRight, X, Pin, Paperclip, MoreHorizontal } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { TypingUser } from '../hooks/use-presence-typing';
import { motion, AnimatePresence } from 'framer-motion';

export type ChatWindowRef = {
  addMessage: (message: MessageWithSender) => void;
  scrollToMessage: (messageId: string) => void;
};

// --- PINNED MESSAGES CAROUSEL BANNER ---
const PinnedMessageBanner = ({
  pinnedMessages,
  onJumpToMessage,
  onUnpin,
  customerName
}: {
  pinnedMessages: MessageWithSender[];
  onJumpToMessage: (id: string) => void;
  onUnpin: (id: string) => void;
  customerName?: string;
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
      className="sticky-pinned-banner sticky top-0 z-10 w-full backdrop-blur-md border-y-2 border-background-secondary px-4.5 py-1.5 flex items-center justify-between gap-3 select-none transition-all duration-300 cursor-pointer"
      onClick={() => onJumpToMessage(currentMessage.id)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground-secondary shrink-0">
          <Pin fill="currentColor" className="rotate-45 size-4.5" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs tracking-wider text-foreground-secondary">
            {currentMessage.senderType === 'user' ? (customerName || 'Khách hàng') : 'Bạn'}
          </span>
          <span className="text-sm text-foreground truncate max-w-full font-semibold">
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

// --- Utility for getting initials of a name ---
const getInitials = (name: string) => {
  const split = name.trim().split(' ');
  if (split.length > 1) {
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- Utility for formatting time into hours and minutes ---
const formatBubbleTime = (dateInput?: Date | string) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const ChatWindow = forwardRef<ChatWindowRef, { 
  conversationId: string; 
  typingUsers?: TypingUser[];
  customerAvatar?: string;
  customerName?: string;
}>(
  ({ conversationId, typingUsers = [], customerAvatar, customerName }, ref) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithSender[]>([]);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const seenIds = useRef<Set<string>>(new Set());

  const refreshCounter = useInboxStore(state => state.refreshCounter);
  const triggerRefresh = useInboxStore(state => state.triggerRefresh);
  const lightboxImage = useInboxStore(state => state.lightboxImage);
  const setLightboxImage = useInboxStore(state => state.setLightboxImage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage, setLightboxImage]);

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

  const handleUnpin = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'message',
          messageId,
          isPinned: false
        })
      });
      if (res.ok) {
        setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
        triggerRefresh();
      }
    } catch (err) {
      console.error('[ChatWindow] Failed to unpin message:', err);
    }
  }, [conversationId, triggerRefresh]);

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
    fetchMessages(null);
  }, [fetchPinnedMessages, fetchMessages, refreshCounter]);

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

    setMessages(prev => {
      let resolvedMessage = { ...message };
      // Nếu có parentMessageId nhưng thiếu đối tượng parentMessage, tự động ánh xạ từ tin nhắn hiện tại
      if (resolvedMessage.parentMessageId && !resolvedMessage.parentMessage) {
        const parent = prev.find(m => m.id === resolvedMessage.parentMessageId);
        if (parent) {
          resolvedMessage.parentMessage = parent;
        }
      }
      return [...prev, resolvedMessage];
    });

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
      
      const targets = element.querySelectorAll('.bubble-highlight-target');
      if (targets.length > 0) {
        targets.forEach(target => {
          target.classList.add(
            "ring-2", 
            "ring-indigo-500", 
            "dark:ring-white", 
            "ring-offset-2", 
            "ring-offset-background", 
            "scale-[1.03]", 
            "shadow-lg", 
            "z-30"
          );
        });
        setTimeout(() => {
          targets.forEach(target => {
            target.classList.remove(
              "ring-2", 
              "ring-indigo-500", 
              "dark:ring-white", 
              "ring-offset-2", 
              "ring-offset-background", 
              "scale-[1.03]", 
              "shadow-lg", 
              "z-30"
            );
          });
        }, 2000);
      } else {
        // Fallback gorgeous focus ring if no bubble target classes are found
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
      }
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

  // Find latest outgoing and read outgoing messages for delivery status & read receipt
  const outgoingMessages = messages.filter(m => m.senderType === 'ai' || m.senderType === 'agent');
  const latestOutgoingMessageId = outgoingMessages.length > 0 
    ? outgoingMessages[outgoingMessages.length - 1].id 
    : null;
  const readOutgoingMessages = outgoingMessages.filter(m => m.is_read);
  const latestReadOutgoingMessageId = readOutgoingMessages.length > 0 
    ? readOutgoingMessages[readOutgoingMessages.length - 1].id 
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative">
      {/* Glassmorphic Sticky Pinned Message Banner */}
      {pinnedMessages.length > 0 && (
        <PinnedMessageBanner 
          pinnedMessages={pinnedMessages} 
          customerName={customerName}
          onJumpToMessage={scrollToMessage}
          onUnpin={handleUnpin}
        />
      )}

      {/* Main scrolling chat window */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-md px-4 flex flex-col bg-transparent scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent" 
        ref={scrollRef}
      >
        <div ref={observerTarget} style={{ height: '1px', opacity: 0 }} />

        {loading && nextCursor && (
          <div className="p-4 text-center text-foreground-tertiary text-sm">Loading older messages...</div>
        )}
        
        {loading && messages.length === 0 && <ChatSkeleton />}

        {messages.map((msg, index) => {
          if (msg.senderId === 'system') {
            return (
              <div key={msg.id} className="flex justify-center items-center my-1.5 select-none animate-in fade-in duration-300">
                <span className="text-xs font-medium text-foreground-secondary/75 flex items-center gap-1.5">
                  <span>{msg.content}</span>
                  <button 
                    onClick={() => {
                      setIsPinnedModalOpen(true);
                    }}
                    className="text-primary transition-colors hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    Xem tất cả
                  </button>
                </span>
              </div>
            );
          }

          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          
          let showSeparator = false;
          if (!prevMsg) {
            showSeparator = true;
          } else {
            const currDate = new Date(msg.createdAt);
            const prevDate = new Date(prevMsg.createdAt);
            const isSameDay = currDate.toDateString() === prevDate.toDateString();
            const diffMins = (currDate.getTime() - prevDate.getTime()) / (1000 * 60);
            
            if (!isSameDay || diffMins > 10) {
              showSeparator = true;
            }
          }

          let showNextSeparator = false;
          if (nextMsg) {
            const currDate = new Date(msg.createdAt);
            const nextDate = new Date(nextMsg.createdAt);
            const isNextSameDay = currDate.toDateString() === nextDate.toDateString();
            const diffNextMins = (nextDate.getTime() - currDate.getTime()) / (1000 * 60);
            
            if (!isNextSameDay || diffNextMins > 10) {
              showNextSeparator = true;
            }
          } else {
            showNextSeparator = true;
          }

          const isLastMessage = index === messages.length - 1;
          const isOutgoing = msg.senderType === 'ai' || msg.senderType === 'agent';
          const showStatus = isLastMessage && isOutgoing;

          const isPrevMsgOutgoing = prevMsg ? (prevMsg.senderType === 'ai' || prevMsg.senderType === 'agent') : false;
          const isPrevConsecutive = !!(prevMsg && !showSeparator && (
            (isOutgoing && isPrevMsgOutgoing) ||
            (!isOutgoing && !isPrevMsgOutgoing)
          ));

          const isNextMsgOutgoing = nextMsg ? (nextMsg.senderType === 'ai' || nextMsg.senderType === 'agent') : false;
          const isNextConsecutive = !!(nextMsg && !showNextSeparator && (
            (isOutgoing && isNextMsgOutgoing) ||
            (!isOutgoing && !isNextMsgOutgoing)
          ));

          return (
            <React.Fragment key={msg.id}>
              {showSeparator && (
                <div className="flex justify-center items-center my-6 relative">
                  <span className="px-4 py-1 rounded-full text-xs font-semibold text-foreground/85 relative z-10">
                    {formatChatSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble 
                message={msg} 
                showStatus={showStatus} 
                conversationId={conversationId}
                isNextConsecutive={isNextConsecutive}
                isPrevConsecutive={isPrevConsecutive}
                customerAvatar={customerAvatar}
                customerName={customerName}
                showSeparator={showSeparator}
                isLatestOutgoing={msg.id === latestOutgoingMessageId}
                isLatestReadOutgoing={msg.id === latestReadOutgoingMessageId}
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

      {/* Premium Lightbox Overlay and Pinned Messages Modal rendering in document.body via separate Portals */}
      {isMounted && typeof window !== 'undefined' && (
        <>
          {createPortal(
            <AnimatePresence>
              {lightboxImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                  onClick={() => setLightboxImage(null)}
                >
                  {/* Control buttons overlay */}
                  <div className="absolute top-4 right-4 flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <a 
                      href={lightboxImage} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
                      title="Mở tab mới"
                    >
                      <ChevronRight className="rotate-[-45deg] stroke-[2.5]" size={18} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setLightboxImage(null)}
                      className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20 active:scale-95 border-none cursor-pointer"
                      title="Đóng"
                    >
                      <X size={20} className="stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Main Image Container */}
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative max-w-full max-h-[85vh] flex items-center justify-center select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img 
                      src={lightboxImage} 
                      alt="Full size view" 
                      className="max-w-full max-h-[85vh] object-contain border border-white/10 pointer-events-auto"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {createPortal(
            <AnimatePresence>
              {isPinnedModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
                  onClick={() => setIsPinnedModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="bg-background-secondary border border-foreground/10 text-foreground rounded-xl shadow-2xl flex flex-col w-full max-w-[500px] h-[550px] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="h-16 flex items-center justify-center relative border-b border-foreground/10 shrink-0">
                      <h3 className="text-lg font-bold text-foreground">Tin nhắn đã ghim</h3>
                      <button
                        type="button"
                        onClick={() => setIsPinnedModalOpen(false)}
                        className="absolute right-4 w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground border-none cursor-pointer"
                        title="Đóng"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Body / List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
                      {pinnedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-foreground-tertiary space-y-2 py-12 select-none">
                          <Pin className="rotate-45 size-10 stroke-[1.5]" />
                          <p className="text-sm font-medium">Không có tin nhắn được ghim</p>
                        </div>
                      ) : (
                        pinnedMessages.map((msg, index) => {
                          const isMsgUser = msg.senderType === 'user';
                          const senderName = isMsgUser ? (customerName || 'Khách hàng') : 'Bạn';
                          const avatarSrc = isMsgUser ? customerAvatar : undefined;
                          const formattedTime = formatBubbleTime(msg.createdAt);

                          return (
                            <React.Fragment key={`modal-pinned-${msg.id}`}>
                              <div 
                                className="flex items-end px-2 gap-3 rounded-xl select-none group relative"
                              >
                                {/* Avatar */}
                                {avatarSrc ? (
                                  <img 
                                    src={avatarSrc} 
                                    alt={senderName} 
                                    className="size-8 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0" 
                                  />
                                ) : (
                                  <div className="size-8 rounded-full bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center border border-foreground/10 shrink-0 select-none">
                                    {getInitials(senderName)}
                                  </div>
                                )}

                                {/* Content */}
                                {/** Note: relative pr-18 is not needed anymore since options is inside flex wrapper now **/}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-foreground-secondary truncate pr-2">{senderName}</span>
                                    <span className="text-[12px] text-foreground-tertiary font-medium select-none shrink-0 pr-1">
                                      {formattedTime}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 relative">
                                    {/* Content text */}
                                    {msg.content && (
                                      <div className="inline-block px-3 py-2 rounded-2xl bg-foreground/5 text-[14px] text-foreground max-w-[85%] break-words border border-foreground/5 shadow-sm">
                                        {msg.content}
                                      </div>
                                    )}

                                    {/* Attachments preview */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="space-y-1">
                                        {msg.attachments.map((att, attIdx) => {
                                          const payload = att.payload as any;
                                          if (att.type === 'image') {
                                            return (
                                              <div key={attIdx} className="overflow-hidden rounded-xl border border-foreground/5 max-w-[150px] max-h-[150px]">
                                                <img src={payload.url} alt="Attachment" className="object-cover w-full h-full" />
                                              </div>
                                            );
                                          }
                                          return (
                                            <div key={attIdx} className="flex items-center gap-1.5 text-xs text-foreground-tertiary">
                                              <Paperclip size={12} />
                                              <span className="truncate">{payload.title || 'Tệp đính kèm'}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Custom Options dropdown (Three dots) */}
                                    <div className="relative shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                                        className="w-8 h-8 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/10 flex items-center justify-center cursor-pointer border-none bg-transparent transition-all duration-150 font-bold"
                                        title="Tùy chọn"
                                      >
                                        <MoreHorizontal size={18} />
                                      </button>

                                      {/* Popover Menu matching image */}
                                      {activeMenuId === msg.id && (
                                        <>
                                          <div 
                                            className="fixed inset-0 z-[99999]" 
                                            onClick={() => setActiveMenuId(null)} 
                                          />
                                          <div
                                            className="absolute left-0 mt-2 w-48 rounded-lg bg-[#242526] border border-white/10 shadow-2xl z-[100000] p-2 text-white select-none overflow-hidden"
                                          >
                                            {/* Arrow pointer */}
                                            <div className="absolute top-[-5px] left-3 w-2.5 h-2.5 bg-[#242526] border-t border-l border-white/10 rotate-45" />

                                            <button
                                              type="button"
                                              onClick={() => {
                                                scrollToMessage(msg.id);
                                                setIsPinnedModalOpen(false);
                                                setActiveMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 border-none bg-transparent text-foreground cursor-pointer rounded-md"
                                            >
                                              Xem trong đoạn chat
                                            </button>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                await handleUnpin(msg.id);
                                                setActiveMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 border-none bg-transparent text-foreground cursor-pointer rounded-md"
                                            >
                                              Bỏ ghim
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {index < pinnedMessages.length - 1 && (
                                <div className="border-b border-foreground/10 my-4" />
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
