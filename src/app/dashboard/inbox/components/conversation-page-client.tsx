'use client';

import React, { useState, useCallback } from 'react';
import { ChatWindow } from './chat-window';
import { ReplyBox } from './reply-box';
import { ConversationContext } from './conversation-context';
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { useAiSuggestions } from '../hooks/use-ai-suggestions';
import styles from './chat.module.css';

type ConversationPageClientProps = {
  conversationId: string;
  platform: string;
  externalId: string;
  lastMessageAt: Date;
  pageName: string;
};

/**
 * ConversationPageClient
 *
 * Client wrapper that owns the shared state between AiSuggestionPanel
 * and ReplyBox. When the user clicks "Use this" on a suggestion, the
 * selected text is injected into ReplyBox via the `fillText` prop.
 *
 * This component is intentionally kept thin — business logic lives in
 * hooks and child components.
 */
export function ConversationPageClient({
  conversationId,
  platform,
  externalId,
  lastMessageAt,
  pageName,
}: ConversationPageClientProps) {
  // fillText encodes both the suggestion text and a sequence counter
  // so the same text can be injected multiple times without React bailing out.
  // Format: "<seq>|<text>" — ReplyBox parses the text part.
  const [fillText, setFillText] = useState<string | undefined>(undefined);
  const fillSeqRef = React.useRef(0);

  const { suggestions, loading, dismiss } = useAiSuggestions({ conversationId });

  const handleUseSuggestion = useCallback((text: string) => {
    fillSeqRef.current += 1;
    setFillText(`${fillSeqRef.current}|${text}`);
  }, []);

  return (
    <div className={styles.mainContent}>
      <div className={styles.chatMain}>
        <ChatWindow conversationId={conversationId} />
        <ReplyBox
          conversationId={conversationId}
          fillText={fillText}
        />
      </div>

      <aside className={styles.sidePanel}>
        <ConversationContext
          platform={platform}
          externalId={externalId}
          lastMessageAt={lastMessageAt}
          pageName={pageName}
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
