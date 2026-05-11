'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatWindow, ChatWindowRef } from './chat-window';
import { ReplyComposer } from '@/app/dashboard/inbox/components/reply-composer';
import { ChatHeader } from './chat-header';
import { RightSidebar } from './right-sidebar';
import { useAiSuggestions } from '../hooks/use-ai-suggestions';
import { useMetadataRealtime, useFanProfileRealtime } from '../hooks/use-inbox-realtime';
import { MessageWithSender } from '@/domain/types/messaging';
import { useInboxStore } from '../store/inbox.store';
import { cn } from '@/lib/utils';
import { createClient } from '@/infrastructure/supabase/client';

import { usePresenceAndTyping } from '../hooks/use-presence-typing';

type RightPanelProps = {
  workspaceId: string;
  accountId: string;
  conversationId: string;
  platform: string;
  externalId: string;
  lastMessageAt: Date;
  pageName: string;
  customerName?: string;
  customerAvatar?: string;
  priority: string | null;
  sentiment: string | null;
  initialTags: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  customerUsername?: string;
  customerLink?: string;
  initialFanProfile?: any;
  initialBotConfig?: any;
  gender?: string | null;
};

export function RightPanel({
  workspaceId,
  accountId,
  conversationId,
  platform,
  externalId,
  lastMessageAt,
  pageName,
  customerName,
  customerAvatar,
  priority: initialPriority,
  sentiment: initialSentiment,
  initialTags,
  contactInfo,
  customerUsername,
  customerLink,
  initialFanProfile,
  initialBotConfig,
  gender: initialGender,
}: RightPanelProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [priority, setPriority] = useState<string | null>(initialPriority);
  const [sentiment, setSentiment] = useState<string | null>(initialSentiment);
  const [fanProfile, setFanProfile] = useState<any>(initialFanProfile);
  const [botConfig, setBotConfig] = useState<any>(initialBotConfig);
  const [gender, setGender] = useState<string | null>(initialGender || null);

  useFanProfileRealtime({
    conversationId,
    onProfileUpdate: (updatedProfile) => {
      setFanProfile(updatedProfile);
    }
  });

  // Realtime subscription to bot configuration changes
  useEffect(() => {
    if (!accountId) return;
    const supabase = createClient();
    const channelName = `bot_config:account:${accountId}:${Math.random().toString(36).slice(2, 11)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_configurations',
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          console.log('[Realtime] Bot config updated:', payload);
          if (payload.eventType === 'DELETE') {
            setBotConfig(null);
          } else {
            setBotConfig(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);
  
  const [fillText, setFillText] = useState<string | undefined>(undefined);
  const fillSeqRef = useRef(0);
  const chatRef = useRef<ChatWindowRef>(null);

  const { suggestions, loading, dismiss } = useAiSuggestions({ conversationId });

  // Real-time Presence and Typing tracking
  const { typingUsers, sendTypingState } = usePresenceAndTyping(
    conversationId,
    customerName || externalId,
    customerAvatar
  );

  const handleUseSuggestion = useCallback((text: string) => {
    fillSeqRef.current += 1;
    setFillText(`${fillSeqRef.current}|${text}`);
  }, []);

  const handleMessageSent = useCallback((message: MessageWithSender) => {
    chatRef.current?.addMessage(message);
  }, []);

  const handleUpdateTags = useCallback(async (newTags: string[]) => {
    setTags(newTags);
    try {
      await fetch(`/api/conversations/${conversationId}/tags`, {
        method: 'PUT',
        body: JSON.stringify({ tags: newTags }),
      });
    } catch (err) {
      console.error('Failed to sync tags:', err);
    }
  }, [conversationId]);

  const handleUpdatePriority = useCallback(async (newPriority: string) => {
    setPriority(newPriority);
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ priority: newPriority }),
      });
    } catch (err) {
      console.error('Failed to sync priority:', err);
    }
  }, [conversationId]);

  const handleUpdateSentiment = useCallback(async (newSentiment: string) => {
    setSentiment(newSentiment);
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ sentiment: newSentiment }),
      });
    } catch (err) {
      console.error('Failed to sync sentiment:', err);
    }
  }, [conversationId]);

  const handleUpdateGender = useCallback(async (newGender: string | null) => {
    setGender(newGender);
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ gender: newGender }),
      });
    } catch (err) {
      console.error('Failed to sync gender:', err);
    }
  }, [conversationId]);

  const handleRealtimeMetadata = useCallback((meta: { priority?: string | null; sentiment?: string | null; gender?: string | null }) => {
    if (meta.priority !== undefined) setPriority(meta.priority);
    if (meta.sentiment !== undefined) setSentiment(meta.sentiment);
    if (meta.gender !== undefined) setGender(meta.gender);
  }, []);

  useMetadataRealtime({
    conversationId,
    onMetadataUpdate: handleRealtimeMetadata,
  });

  const { isRightPanelVisible, setRightPanelVisible } = useInboxStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-foreground/10 relative z-10">
        <ChatHeader 
          conversationId={conversationId}
          customerName={customerName || externalId}
          customerAvatar={customerAvatar}
          platform={platform}
          platformUserName={pageName}
          tags={tags}
          onUpdateTags={handleUpdateTags}
          customerLink={platform === 'instagram' && customerUsername ? `https://www.instagram.com/${customerUsername}/` : customerLink}
        />
        <ChatWindow 
          ref={chatRef} 
          conversationId={conversationId} 
          typingUsers={typingUsers}
          customerAvatar={customerAvatar}
          customerName={customerName}
        />
        <ReplyComposer
          workspaceId={workspaceId}
          conversationId={conversationId}
          fillText={fillText}
          onMessageSent={handleMessageSent}
          platform={platform}
          platformUserName={pageName}
          onTypingStateChange={sendTypingState}
          botConfig={botConfig}
        />
      </div>

      <div className={cn(
        "w-[340px] flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden border-l border-foreground/10 bg-background-tertiary/40",
        !isRightPanelVisible && "w-[60px]"
      )}>
        <RightSidebar
          workspaceId={workspaceId}
          conversationId={conversationId}
          customerName={customerName}
          customerAvatar={customerAvatar}
          platform={platform}
          tags={tags}
          priority={priority}
          sentiment={sentiment}
          suggestions={suggestions}
          loadingSuggestions={loading}
          onUseSuggestion={handleUseSuggestion}
          onDismissSuggestion={dismiss}
          onUpdateTags={handleUpdateTags}
          onUpdatePriority={handleUpdatePriority}
          onUpdateSentiment={handleUpdateSentiment}
          onJumpToMessage={(id) => chatRef.current?.scrollToMessage(id)}
          contactInfo={contactInfo}
          customerUsername={customerUsername}
          customerLink={customerLink}
          isCollapsed={!isRightPanelVisible}
          onToggleCollapse={() => setRightPanelVisible(!isRightPanelVisible)}
          fanProfile={fanProfile}
          gender={gender}
          onUpdateGender={handleUpdateGender}
          botConfig={botConfig}
        />
      </div>
    </div>
  );
}
