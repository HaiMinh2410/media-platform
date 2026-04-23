'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import type { AiSuggestion } from '@/domain/types/messaging';

/**
 * Raw row shape from Supabase Realtime postgres_changes for ai_reply_logs.
 */
type AiReplyLogRow = {
  id: string;
  message_id: string;
  model: string;
  prompt: string;
  response: string;
  status: string;
  created_at: string;
};

type UseAiSuggestionsOptions = {
  conversationId: string;
};

type UseAiSuggestionsResult = {
  suggestions: AiSuggestion[];
  loading: boolean;
  /** Remove a suggestion from local state (e.g. after using it) */
  dismiss: (id: string) => void;
};

/**
 * useAiSuggestions
 *
 * Fetches existing AI suggestions from the REST API, then subscribes to
 * Supabase Realtime postgres_changes on ai_reply_logs to receive new
 * suggestions as they arrive (inserted by the BullMQ worker).
 *
 * Suggestions arrive linked to a message in this conversation. We filter
 * by joining through the conversation's messages on the server.
 *
 * Cleanup: removes the realtime channel on unmount or when conversationId changes.
 */
export function useAiSuggestions({
  conversationId,
}: UseAiSuggestionsOptions): UseAiSuggestionsResult {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  // ──────────────────────────────────────────────────────────────
  // Initial fetch
  // ──────────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${conversationId}/suggestions`);
      if (!res.ok) return;
      const body = await res.json();
      const data = (body.data ?? []) as AiSuggestion[];
      data.forEach((s) => seenIds.current.add(s.id));
      setSuggestions(data);
    } catch (err) {
      console.error('[useAiSuggestions] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    seenIds.current = new Set();
    setSuggestions([]);
    fetchSuggestions();
  }, [fetchSuggestions]);

  // ──────────────────────────────────────────────────────────────
  // Realtime subscription — ai_reply_logs INSERTs
  // We cannot filter by conversation_id directly (the log is linked via
  // message_id, not conversation_id), so we subscribe globally and
  // deduplicate via seenIds. The API fetch ensures we only show logs
  // for this conversation; new realtime events are cross-checked by
  // re-fetching when an insert arrives so we confirm it belongs here.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channelName = `ai_reply_logs:conv:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_reply_logs',
        },
        (payload) => {
          const row = payload.new as AiReplyLogRow;

          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          // Re-fetch to confirm this log belongs to our conversation.
          // Optimistic path: we could add it directly, but since we can't
          // filter by conversation_id in the Realtime filter without a
          // DB-level function, re-fetching is the safe approach.
          fetchSuggestions();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Subscribed to ai_reply_logs for conv ${conversationId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for ai_reply_logs conv ${conversationId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchSuggestions]);

  // ──────────────────────────────────────────────────────────────
  // Dismiss: remove a suggestion from local state optimistically
  // ──────────────────────────────────────────────────────────────
  const dismiss = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { suggestions, loading, dismiss };
}
