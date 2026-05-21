import { useState, useCallback, useEffect } from 'react';
import { MessageWithSender } from '@features/inbox/types';
import { useInboxStore, InboxState } from '../../../store/inbox.store';

type UsePinnedMessagesProps = {
  conversationId: string;
};

export function usePinnedMessages({ conversationId }: UsePinnedMessagesProps) {
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithSender[]>([]);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const refreshCounter = useInboxStore((state: InboxState) => state.refreshCounter);
  const triggerRefresh = useInboxStore((state: InboxState) => state.triggerRefresh);

  const fetchPinnedMessages = useCallback(async () => {
    if (!conversationId) return;
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
    if (!conversationId) return;
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

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPinnedMessages();
    }, 0);
    return () => clearTimeout(handler);
  }, [fetchPinnedMessages, refreshCounter]);

  return {
    pinnedMessages,
    setPinnedMessages,
    isPinnedModalOpen,
    setIsPinnedModalOpen,
    fetchPinnedMessages,
    handleUnpin
  };
}
