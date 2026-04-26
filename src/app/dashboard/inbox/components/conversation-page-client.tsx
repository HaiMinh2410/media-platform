'use client';

import React, { useState, useCallback } from 'react';
import { ChatWindow, ChatWindowRef } from './chat-window';
import { ReplyBox } from './reply-box';
import { ConversationContext } from './conversation-context';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { useAiSuggestions } from '../hooks/use-ai-suggestions';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';

type ConversationPageClientProps = {
  conversationId: string;
  platform: string;
  externalId: string;
  lastMessageAt: Date;
  pageName: string;
  customerName?: string;
  priority: string | null;
  sentiment: string | null;
  initialTags: string[];
};

export function ConversationPageClient({
  conversationId,
  platform,
  externalId,
  lastMessageAt,
  pageName,
  customerName,
  priority,
  sentiment,
  initialTags,
}: ConversationPageClientProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  // fillText encodes both the suggestion text and a sequence counter
  // so the same text can be injected multiple times without React bailing out.
  // Format: "<seq>|<text>" — ReplyBox parses the text part.
  const [fillText, setFillText] = useState<string | undefined>(undefined);
  const fillSeqRef = React.useRef(0);
  const chatRef = React.useRef<ChatWindowRef>(null);

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
    try {
      await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ sentiment: newSentiment }),
      });
    } catch (err) {
      console.error('Failed to sync sentiment:', err);
    }
  }, [conversationId]);

  return (
    <div className={styles.mainContent}>
      <div className={styles.chatMain}>
        <ChatWindow ref={chatRef} conversationId={conversationId} />
        <ReplyBox
          conversationId={conversationId}
          fillText={fillText}
          onMessageSent={handleMessageSent}
        />
      </div>

      <aside className={styles.sidePanel}>
        <ConversationContext
          platform={platform}
          externalId={externalId}
          lastMessageAt={lastMessageAt}
          pageName={pageName}
          customerName={customerName}
        />

        <div className={styles.sideSection}>
          <AiSuggestionPanel
            suggestions={suggestions}
            tags={tags}
            priority={priority}
            sentiment={sentiment}
            loading={loading}
            onUse={handleUseSuggestion}
            onDismiss={dismiss}
            onUpdateTags={handleUpdateTags}
            onUpdatePriority={handleUpdatePriority}
            onUpdateSentiment={handleUpdateSentiment}
          />
        </div>
      </aside>
    </div>
  );
}
