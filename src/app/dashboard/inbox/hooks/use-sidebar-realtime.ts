'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import type { ConversationWithLastMessage } from '@/domain/types/messaging';

/**
 * Realtime payload shape from Supabase postgres_changes for the conversations table.
 * Field names match the database column names (snake_case).
 */
type ConversationRow = {
  id: string;
  account_id: string;
  platform_conversation_id: string;
  last_message_at: string;
  status: string | null;
};

type UseSidebarRealtimeOptions = {
  workspaceId: string;
  /**
   * Called when any conversation row is inserted or updated.
   * The sidebar should use this to bump the affected conversation to the top
   * or update its last_message_at / unread_count.
   *
   * NOTE: The realtime payload does NOT include joined fields (platform, sender_name, etc.)
   * so the callback receives a partial update. The sidebar should re-fetch or
   * patch its local state accordingly.
   */
  onConversationUpdated: (
    eventType: 'INSERT' | 'UPDATE',
    partialConversation: Pick<
      ConversationWithLastMessage,
      'id' | 'platform_conversation_id' | 'last_message_at' | 'status'
    >
  ) => void;
};

/**
 * useSidebarRealtime
 *
 * Subscribes to Supabase Realtime postgres_changes for the `conversations` table.
 * Because conversations are linked to workspace via platform_accounts (a join table),
 * we cannot filter directly by workspace_id at the Realtime level.
 *
 * Strategy: Subscribe to ALL conversation changes, filter client-side in the callback
 * by checking if the conversation id is already in the sidebar list (handled by caller).
 *
 * The caller (`ConversationSidebar`) is responsible for deciding whether to:
 *  - Refetch the full list (simplest, safest)
 *  - Optimistically patch the local array (faster, more complex)
 *
 * Cleanup: removes the realtime channel on unmount or when workspaceId changes.
 *
 * NOTE: Caller must memoize `onConversationUpdated` (e.g. via useCallback) to avoid
 * unnecessary re-subscriptions.
 */
export function useSidebarRealtime({
  workspaceId,
  onConversationUpdated,
}: UseSidebarRealtimeOptions): void {
  // Stable ref to the latest callback — avoids re-subscribing on callback identity change
  const callbackRef = useRef(onConversationUpdated);
  useEffect(() => {
    callbackRef.current = onConversationUpdated;
  }, [onConversationUpdated]);

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();
    const channelName = `conversations:workspace:${workspaceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const row = payload.new as ConversationRow;
          callbackRef.current('INSERT', {
            id: row.id,
            platform_conversation_id: row.platform_conversation_id,
            last_message_at: new Date(row.last_message_at),
            status: row.status,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const row = payload.new as ConversationRow;
          callbackRef.current('UPDATE', {
            id: row.id,
            platform_conversation_id: row.platform_conversation_id,
            last_message_at: new Date(row.last_message_at),
            status: row.status,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Subscribed to conversations for workspace ${workspaceId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for conversations workspace ${workspaceId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}
