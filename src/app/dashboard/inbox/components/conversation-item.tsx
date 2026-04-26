'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './conversation-sidebar.module.css';
import { ConversationWithLastMessage } from '@/domain/types/messaging';

export function ConversationItem({ conversation }: { conversation: ConversationWithLastMessage }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/inbox/${conversation.id}`);

  // Format time (e.g., "10:30 AM" or "Yesterday" or "Oct 24")
  const formatTime = (dateStr: Date | string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (diff < oneDay && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < oneDay * 2) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isUnread = conversation.unread_count > 0;

  const getPriorityClass = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      case 'low': return styles.priorityLow;
      default: return '';
    }
  };

  const getSentimentEmoji = (sentiment?: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '😊';
      case 'frustrated': return '😠';
      case 'negative': return '😟';
      case 'neutral': return '😐';
      default: return null;
    }
  };

  return (
    <Link href={`/dashboard/inbox/${conversation.id}`} className={`${styles.item} ${isActive ? styles.active : ''} ${isUnread ? styles.unread : ''}`}>
      <div className={styles.avatar}>
        {conversation.customer_avatar ? (
          <img src={conversation.customer_avatar} alt={conversation.sender_name} className={styles.avatarImg} />
        ) : (
          getInitials(conversation.sender_name)
        )}
        <div className={styles.platformIcon}>
          {conversation.platform === 'instagram' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          )}
        </div>
      </div>
      
      <div className={styles.textContent}>
        <div className={styles.itemHeader}>
          <div className={styles.senderNameContainer}>
            <span className={styles.senderName}>{conversation.sender_name || 'Unknown User'}</span>
            {conversation.is_vip && (
              <span className={styles.vipBadge} title="VIP Customer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            )}
            {getSentimentEmoji(conversation.sentiment) && (
              <span className={styles.sentimentIcon} title={`Sentiment: ${conversation.sentiment}`}>
                {getSentimentEmoji(conversation.sentiment)}
              </span>
            )}
          </div>
          <span className={styles.time}>{formatTime(conversation.last_message_at)}</span>
        </div>
        
        <div className={styles.itemBody}>
          <span className={styles.lastMessage}>{conversation.last_message_content || 'No messages'}</span>
          {isUnread && (
            <span className={styles.unreadBadge}>{conversation.unread_count}</span>
          )}
        </div>

        <div className={styles.itemInfo}>
          {conversation.priority && conversation.priority !== 'none' && (
            <span className={`${styles.priorityBadge} ${getPriorityClass(conversation.priority)}`}>
              {conversation.priority}
            </span>
          )}
          {conversation.canonical_conversation_id && (
            <span className={styles.duplicateIcon} title="Linked Identity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
