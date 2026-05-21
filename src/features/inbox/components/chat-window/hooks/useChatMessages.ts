import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageWithSender } from '@features/inbox/types';
import { useInboxStore, InboxState } from '../../../store/inbox.store';
import { useMessageRealtime } from '../../../hooks/use-inbox-realtime';

type UseChatMessagesProps = {
  conversationId: string;
  typingUsersCount: number;
  fetchPinnedMessages: () => void;
};

export function useChatMessages({
  conversationId,
  typingUsersCount,
  fetchPinnedMessages,
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const seenIds = useRef<Set<string>>(new Set());

  const refreshCounter = useInboxStore((state: InboxState) => state.refreshCounter);

  // Fetch messages from API
  const fetchMessages = useCallback(async (cursor?: string | null) => {
    if (!conversationId) return;
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

  // Initial load
  useEffect(() => {
    isInitialLoad.current = true;
    seenIds.current = new Set();
    fetchMessages(null);

    // Mark as read
    if (conversationId) {
      fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(
        (err) => console.warn('[ChatWindow] Failed to mark conversation as read:', err)
      );
    }
  }, [fetchMessages, conversationId]);

  // Reload when refreshCounter changes
  useEffect(() => {
    fetchMessages(null);
  }, [fetchMessages, refreshCounter]);

  // Scroll management
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

  // Infinite scroll observer
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

  // Handle new incoming messages
  const handleNewMessage = useCallback((message: MessageWithSender) => {
    if (seenIds.current.has(message.id)) return;
    seenIds.current.add(message.id);

    setMessages(prev => {
      const resolvedMessage = { ...message };
      // Map parentMessage if exists but not populated
      if (resolvedMessage.parentMessageId && !resolvedMessage.parentMessage) {
        const parent = prev.find(m => m.id === resolvedMessage.parentMessageId);
        if (parent) {
          resolvedMessage.parentMessage = parent;
        }
      }

      // Check if there is an explicit tempId to replace
      const tempId = (message as MessageWithSender & { tempId?: string }).tempId;
      if (tempId) {
        return prev.map(m => m.id === tempId ? resolvedMessage : m);
      }

      // Fallback: if this is a real agent message, search for any matching temp- message and replace it
      if (resolvedMessage.senderType === 'agent' && !resolvedMessage.id.startsWith('temp-')) {
        const existingTempIndex = prev.findIndex(m =>
          m.id.startsWith('temp-') &&
          m.content === resolvedMessage.content
        );
        if (existingTempIndex !== -1) {
          const updated = [...prev];
          updated[existingTempIndex] = resolvedMessage;
          return updated;
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

  // Handle message updates (read status, delivered, pinned)
  const handleUpdateMessage = useCallback((updated: {
    id: string;
    is_read?: boolean;
    isRead?: boolean;
    is_delivered?: boolean;
    isDelivered?: boolean;
    is_pinned?: boolean;
    isPinned?: boolean;
  }) => {
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

  // Realtime messages subscription
  useMessageRealtime({
    conversationId,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleUpdateMessage
  });

  // Scroll to bottom when someone starts typing
  useEffect(() => {
    if (typingUsersCount > 0 && scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [typingUsersCount]);

  // Scroll to specific message handler
  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const targets = element.querySelectorAll('.bubble-highlight-target');
      if (targets.length > 0) {
        targets.forEach(target => {
          target.classList.add(
            'ring-2',
            'ring-indigo-500',
            'dark:ring-white',
            'ring-offset-2',
            'ring-offset-background',
            'scale-[1.03]',
            'shadow-lg',
            'z-30'
          );
        });
        setTimeout(() => {
          targets.forEach(target => {
            target.classList.remove(
              'ring-2',
              'ring-indigo-500',
              'dark:ring-white',
              'ring-offset-2',
              'ring-offset-background',
              'scale-[1.03]',
              'shadow-lg',
              'z-30'
            );
          });
        }, 2000);
      } else {
        // Fallback focus ring
        element.classList.add('ring-4', 'ring-indigo-500/50', 'ring-offset-4', 'scale-[1.01]', 'transition-all', 'duration-500', 'ease-out', 'z-10');
        const bubble = element.querySelector('.w-fit');
        if (bubble) {
          bubble.classList.add('shadow-xl', 'shadow-indigo-500/20', 'border-indigo-500/50');
        }

        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-indigo-500/50', 'ring-offset-4', 'scale-[1.01]');
          if (bubble) {
            bubble.classList.remove('shadow-xl', 'shadow-indigo-500/20', 'border-indigo-500/50');
          }
        }, 2000);
      }
    } else {
      console.warn(`[ChatWindow] Message ${messageId} not found in current window`);
    }
  }, []);

  return {
    messages,
    setMessages,
    loading,
    nextCursor,
    scrollRef,
    observerTarget,
    handleNewMessage,
    scrollToMessage
  };
}
