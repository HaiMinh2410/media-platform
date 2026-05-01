'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';

type UseUnreadRealtimeOptions = {
  workspaceId: string;
  onRefresh: () => void;
};

/**
 * useUnreadRealtime
 * Listens for any changes in the messages table to trigger an unread count refresh.
 * Since we can't easily filter by workspace_id at the database level for realtime without complex joins,
 * we listen for all message insertions and updates to read status.
 */
export function useUnreadRealtime({ workspaceId, onRefresh }: UseUnreadRealtimeOptions) {
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();
    // Use a unique channel name per instance to avoid "after subscribe" errors
    const channelName = `unread-counts:${workspaceId}:${Math.random().toString(36).slice(2, 11)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          console.log('[Realtime] New message detected, refreshing counts...');
          onRefreshRef.current();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldRow = payload.old as any;
          const newRow = payload.new as any;

          // Only refresh if is_read status changed
          if (oldRow && newRow && oldRow.is_read !== newRow.is_read) {
            console.log('[Realtime] Message read status changed, refreshing counts...');
            onRefreshRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}
