'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import type { MessageWithSender } from '@/domain/types/messaging';

/**
 * Realtime payload shape from Supabase postgres_changes for the messages table.
 * Field names match the database column names (snake_case).
 */
type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  platform_message_id: string;
  sender_type: string | null;
  is_read: boolean;
  created_at: string;
};

type UseInboxRealtimeOptions = {
  conversationId: string;
  /** Called when a new message arrives or an existing message is updated. */
  onNewMessage: (message: MessageWithSender) => void;
};

/**
 * useInboxRealtime
 *
 * Subscribes to Supabase Realtime postgres_changes for the `messages` table,
 * filtered by conversation_id.
 *
 * Fires `onNewMessage` on every INSERT event so the ChatWindow stays live
 * without manual polling.
 *
 * Cleanup: removes the realtime channel on unmount or when conversationId changes.
 *
 * NOTE: Caller must memoize `onNewMessage` (e.g. via useCallback) to avoid
 * unnecessary re-subscriptions.
 */
export function useInboxRealtime({
  conversationId,
  onNewMessage,
}: UseInboxRealtimeOptions): void {
  // Stable ref to the latest callback — avoids re-subscribing on callback identity change
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channelName = `messages:conversation:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Note: Removed server-side filter as it can be flaky with UUID formats/quoting.
          // Filtering is handled client-side in the callback below.
        },
        (payload) => {
          console.log('[Realtime] 📩 New message event received!', payload);
          const row = payload.new as any;
          console.log('[Realtime] Row keys:', Object.keys(row));
          console.log('[Realtime] Full row content:', JSON.stringify(row));

          // Try both snake_case and camelCase
          const incomingConvId = row.conversation_id || row.conversationId;

          // Client-side filtering
          if (incomingConvId !== conversationId) {
            console.log(`[Realtime] ⏩ Ignoring message. Target: ${conversationId}, Received: ${incomingConvId}`);
            return;
          }

          // Map DB row → domain type expected by ChatWindow / MessageBubble
          const message: MessageWithSender = {
            id: row.id,
            content: row.content,
            senderId: row.sender_id,
            senderType: (row.sender_type as MessageWithSender['senderType']) ?? 'user',
            createdAt: new Date(row.created_at),
          };

          onNewMessageRef.current(message);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Subscribed to messages in conversation ${conversationId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for conversation ${conversationId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
