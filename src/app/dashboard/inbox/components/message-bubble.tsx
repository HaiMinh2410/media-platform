'use client';

import React, { memo } from 'react';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';
import { Sparkles } from 'lucide-react';

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
      <div className={styles.bubbleContainer}>
        <div className={`${styles.bubble} ${bubbleClass}`}>
          {isAi && (
            <div className={styles.aiBadge}>
              <Sparkles size={12} className="text-purple-400" />
              <span>AI Auto-Reply</span>
            </div>
          )}
          <div className={styles.messageContent}>
            {message.content}
          </div>
        </div>

        <div className={styles.messageMeta}>
          <span className={styles.messageTime}>{timeString}</span>
          {(isAi || isAgent) && (
            <span className={styles.messageStatus}>
              {message.is_read ? 'Đã xem' : (message.is_delivered ? 'Đã gửi' : 'Đang gửi...')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
