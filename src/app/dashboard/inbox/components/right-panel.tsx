'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ChatWindow, ChatWindowRef } from './chat-window';
import { ReplyComposer } from '@/app/dashboard/inbox/components/reply-composer';
import { ChatHeader } from './chat-header';
import { RightSidebar } from './right-sidebar';
import { useAiSuggestions } from '../hooks/use-ai-suggestions';
import { useMetadataRealtime } from '../hooks/use-inbox-realtime';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';
import { useInboxStore } from '../store/inbox.store';
import clsx from 'clsx';

type RightPanelProps = {
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
};

export function RightPanel({
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
}: RightPanelProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [priority, setPriority] = useState<string | null>(initialPriority);
  const [sentiment, setSentiment] = useState<string | null>(initialSentiment);
  
  const [fillText, setFillText] = useState<string | undefined>(undefined);
  const fillSeqRef = useRef(0);
  const chatRef = useRef<ChatWindowRef>(null);

  const { suggestions, loading, dismiss } = useAiSuggestions({ conversationId });

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

  const handleRealtimeMetadata = useCallback((meta: { priority?: string | null; sentiment?: string | null }) => {
    if (meta.priority !== undefined) setPriority(meta.priority);
    if (meta.sentiment !== undefined) setSentiment(meta.sentiment);
  }, []);

  useMetadataRealtime({
    conversationId,
    onMetadataUpdate: handleRealtimeMetadata,
  });

  const isRightPanelVisible = useInboxStore((state) => state.isRightPanelVisible);

  return (
    <div className={styles.mainContent}>
      <div className={styles.chatMain}>
        <ChatHeader 
          conversationId={conversationId}
          customerName={customerName || externalId}
          customerAvatar={customerAvatar}
          platform={platform}
          platformUserName={pageName}
        />
        <ChatWindow ref={chatRef} conversationId={conversationId} />
        <ReplyComposer
          conversationId={conversationId}
          fillText={fillText}
          onMessageSent={handleMessageSent}
          platform={platform}
          platformUserName={pageName}
        />
      </div>

      <div className={clsx(styles.rightSidebarWrapper, !isRightPanelVisible && styles.hidden)}>
        <RightSidebar
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
        />
      </div>
    </div>
  );
}
