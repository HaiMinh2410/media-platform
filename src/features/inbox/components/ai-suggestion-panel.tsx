/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import type { AiSuggestion } from '@features/inbox/types';
import { cn } from '@shared/lib/utils';
import { createClient } from '@shared/api/supabase/client';
import { Zap, Info, Loader2 } from 'lucide-react';

import { SuggestionCard } from './ai-suggestion-panel/suggestion-card';
import { ScheduledReplyCard } from './ai-suggestion-panel/scheduled-reply-card';
import { AiProfileViewer } from './ai-suggestion-panel/ai-profile-viewer';
import {
  REALTIME_REFRESH_POLL_INTERVAL_MS,
  REALTIME_POLL_RETRIES_MS,
  SCHEDULER_CHECK_INTERVAL_MS,
  MAX_VISIBLE_SUGGESTIONS
} from './ai-suggestion-panel/panel-constants';

type Props = {
  conversationId: string;
  suggestions: AiSuggestion[];
  loading: boolean;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
  fanProfile?: any;
  gender?: string | null;
  onUpdateGender?: (gender: string | null) => void;
  botConfig?: any;
};

export function AiSuggestionPanel({
  conversationId,
  suggestions,
  loading,
  onUse,
  onDismiss,
  fanProfile,
  gender,
  onUpdateGender,
  botConfig
}: Props) {
  const visibleSuggestions = suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS);
  const [scheduledReply, setScheduledReply] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const isAutoReplyActive = botConfig?.is_active === true && botConfig?.auto_send === true;

  // Lắng nghe thay đổi tin nhắn thời gian thực và tự động cập nhậtScheduled Reply
  useEffect(() => {
    if (!conversationId) return;

    const fetchScheduledReply = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/scheduled-reply`);
        const json = await res.json();
        if (json.data && json.data.exists) {
          setScheduledReply(json.data);
        } else {
          setScheduledReply(null);
        }
      } catch (err) {
        console.error('[AiSuggestionPanel] Failed to fetch scheduled reply:', err);
      }
    };

    fetchScheduledReply();

    const interval = setInterval(fetchScheduledReply, REALTIME_REFRESH_POLL_INTERVAL_MS);

    const supabase = createClient();
    const channelName = `scheduled_reply_refresh:${conversationId}:${Math.random().toString(36).slice(2, 11)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversationId=eq.${conversationId}`,
        },
        () => {
          console.log('[Realtime] Message change detected, refreshing scheduled reply with retries...');
          fetchScheduledReply();
          
          // Poll aggressively at key intervals to capture the newly queued BullMQ job
          REALTIME_POLL_RETRIES_MS.forEach(delay => {
            setTimeout(fetchScheduledReply, delay);
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Xử lý bộ đếm ngược hẹn giờ gửi
  useEffect(() => {
    if (!scheduledReply?.scheduledAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(scheduledReply.scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('đang gửi...');
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${secs}s`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, SCHEDULER_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [scheduledReply]);

  const handleCancelScheduledReply = async () => {
    if (!conversationId) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/scheduled-reply`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setScheduledReply(null);
      } else {
        alert('Hủy gửi không thành công: ' + (json.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      console.error('[AiSuggestionPanel] Failed to cancel scheduled reply:', err);
      alert('Không thể kết nối đến máy chủ để hủy gửi.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex flex-col bg-base-200 text-foreground select-none">
      {/* ================= SECTION 1: AI SUGGESTIONS & AUTO REPLY ================= */}
      <div>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-1 rounded border",
              isAutoReplyActive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-accent-primary/10 text-accent-primary border-accent-primary/20"
            )}>
              <Zap size={14} className="animate-pulse" />
            </div>
            <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">
              {isAutoReplyActive ? "Tự động phản hồi AI" : "Gợi ý phản hồi AI"}
            </h4>
          </div>

          {isAutoReplyActive && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Auto Active
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-4">
          {isAutoReplyActive ? (
            /* --- Auto Reply Mode --- */
            scheduledReply ? (
              <ScheduledReplyCard
                scheduledReply={scheduledReply}
                timeLeft={timeLeft}
                onUse={onUse}
                onCancel={handleCancelScheduledReply}
                isCancelling={isCancelling}
              />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-foreground-tertiary gap-3 bg-foreground/[0.01] border border-foreground/5 rounded-xl">
                <Loader2 size={18} className="animate-spin text-emerald-500" />
                <p className="text-2xs italic leading-relaxed text-emerald-400 font-black animate-pulse">
                  AI đang phân tích tin nhắn và soạn thảo phản hồi tự động...
                </p>
              </div>
            ) : (
              <div className="flex items-start justify-center px-4 py-5 text-center text-foreground-tertiary gap-3 bg-foreground/[0.01] border border-foreground/5 rounded-xl relative">
                <span className="absolute top-0 left-0 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-sm whitespace-nowrap">
                  Hệ thống tự động phản hồi đang chạy.<br/>Đang chờ tin nhắn tiếp theo của khách...
                </p>
              </div>
            )
          ) : (
            /* --- Regular Manual Suggestions Mode --- */
            <>
              {loading && (
                <div className="flex flex-col gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                      <div className="h-3 bg-foreground/5 rounded w-1/3" />
                      <div className="h-4 bg-foreground/5 rounded w-full" />
                      <div className="h-4 bg-foreground/5 rounded w-4/5" />
                    </div>
                  ))}
                  <div className="flex items-center justify-center py-5 text-foreground-tertiary text-sm gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tạo phản hồi...</span>
                  </div>
                </div>
              )}

              {!loading && visibleSuggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-foreground-tertiary gap-3 bg-foreground/[0.01] border border-foreground/5 rounded-xl">
                  <Info size={24} className="text-foreground-tertiary opacity-40" />
                  <p className="text-xs italic">Chưa có gợi ý nào</p>
                </div>
              )}

              {!loading && visibleSuggestions.length > 0 && (
                <div className="flex flex-col gap-4">
                  {visibleSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onUse={onUse}
                      onDismiss={onDismiss}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= SECTION 2: AI SMART PROFILE ================= */}
      {fanProfile && (
        <AiProfileViewer
          fanProfile={fanProfile}
          gender={gender || null}
          onUpdateGender={onUpdateGender || (() => {})}
        />
      )}
    </div>
  );
}
