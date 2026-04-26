'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import type { MessageWithSender } from '@/domain/types/messaging';

type UseMessageRealtimeOptions = {
  conversationId: string;
  /** Called when a new message arrives. */
  onNewMessage: (message: MessageWithSender) => void;
};

/**
 * useMessageRealtime
 * Subscribes to Supabase Realtime postgres_changes for the `messages` table.
 */
export function useMessageRealtime({
  conversationId,
  onNewMessage,
}: UseMessageRealtimeOptions): void {
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
        },
        (payload) => {
          const row = payload.new as any;
          const incomingConvId = row.conversation_id || row.conversationId;
          if (incomingConvId !== conversationId) return;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

type UseMetadataRealtimeOptions = {
  conversationId: string;
  /** Called when conversation metadata (priority, sentiment) is updated. */
  onMetadataUpdate: (metadata: { priority?: string | null; sentiment?: string | null }) => void;
};

/**
 * useMetadataRealtime
 * Subscribes to Supabase Realtime postgres_changes for the `conversations` table.
 */
export function useMetadataRealtime({
  conversationId,
  onMetadataUpdate,
}: UseMetadataRealtimeOptions): void {
  const onMetadataUpdateRef = useRef(onMetadataUpdate);
  useEffect(() => {
    onMetadataUpdateRef.current = onMetadataUpdate;
  }, [onMetadataUpdate]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channelName = `metadata:conversation:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as any;
          onMetadataUpdateRef.current({
            priority: row.priority,
            sentiment: row.sentiment,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

