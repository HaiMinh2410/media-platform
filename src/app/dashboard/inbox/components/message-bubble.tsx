'use client';

import React, { memo } from 'react';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';

export const MessageBubble = memo(function MessageBubble({ message }: { message: MessageWithSender }) {
  const isUser = message.senderType === 'user';
  const isAi = message.senderType === 'ai';
  const isAgent = message.senderType === 'agent';

  const rowClass = isUser ? styles.rowUser : (isAi ? styles.rowAi : styles.rowAgent);
  
  let bubbleClass = styles.bubbleUser;
  if (isAi) bubbleClass = styles.bubbleAi;
  if (isAgent) bubbleClass = styles.bubbleAgent;

  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.messageRow} ${rowClass}`}>
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {isAi && (
          <div className={styles.aiBadge}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            Auto-Reply
          </div>
        )}
        <div className={styles.messageContent}>
          {message.content}
        </div>
        <span className={styles.messageTime}>{timeString}</span>
      </div>
    </div>
  );
});
