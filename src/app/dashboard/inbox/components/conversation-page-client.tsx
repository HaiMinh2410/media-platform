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
};

/**
 * ConversationPageClient
 *
 * Client wrapper that owns the shared state between AiSuggestionPanel
 * and ReplyBox. When the user clicks "Use this" on a suggestion, the
 * selected text is injected into ReplyBox via the `fillText` prop.
 *
 * It also handles wiring up optimistic updates between ReplyBox and ChatWindow.
 */
export function ConversationPageClient({
  conversationId,
  platform,
  externalId,
  lastMessageAt,
  pageName,
  customerName,
}: ConversationPageClientProps) {
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
            loading={loading}
            onUse={handleUseSuggestion}
            onDismiss={dismiss}
          />
        </div>
      </aside>
    </div>
  );
}
