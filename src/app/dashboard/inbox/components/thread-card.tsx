'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './middle-panel.module.css';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { cn } from '@/lib/utils';
import { MessageCircle, Flame, Star, Bot, Users } from 'lucide-react';

export function ThreadCard({ conversation, style }: { conversation: ConversationWithLastMessage, style?: React.CSSProperties }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/inbox/${conversation.id}`);

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
    <Link 
      href={`/dashboard/inbox/${conversation.id}`} 
      className={cn(styles.threadCard, isActive && styles.active, isUnread && styles.unread)}
      style={style}
    >
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
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#1877F2]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
        </div>
      </div>
      
      <div className={styles.textContent}>
        <div className={styles.itemHeader}>
          <div className={styles.senderNameContainer}>
            <span className={styles.senderName}>{conversation.sender_name || 'Unknown User'}</span>
            
            {/* Tag Segment & State */}
            {conversation.is_vip && (
              <span className={styles.vipBadge} title="VIP">
                <Star size={12} fill="currentColor" />
              </span>
            )}
            
            {getSentimentEmoji(conversation.sentiment) && (
              <span className={styles.sentimentIcon} title={`Sentiment: ${conversation.sentiment}`}>
                {getSentimentEmoji(conversation.sentiment)}
              </span>
            )}

            {conversation.priority === 'high' && (
              <span className={styles.hotLeadBadge} title="Hot Lead">
                <Flame size={12} fill="currentColor" />
              </span>
            )}
            
            {conversation.ai_replied && (
              <span className={styles.aiBadge} title="AI Handled">
                <Bot size={12} />
              </span>
            )}
          </div>
          <span className={styles.time}>{formatTime(conversation.last_message_at)}</span>
        </div>
        
        <div className={styles.itemBody}>
          <span className={styles.lastMessage}>{conversation.last_message_content || 'No messages'}</span>
          {isUnread && (
            <span className={styles.unreadBadge}>
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>

        <div className={styles.itemInfo}>
          {conversation.priority && conversation.priority !== 'none' && conversation.priority !== 'high' && (
            <span className={cn(styles.priorityBadge, getPriorityClass(conversation.priority))}>
              {conversation.priority}
            </span>
          )}
          {conversation.canonical_conversation_id && (
            <span className={styles.duplicateIcon} title="Linked Identity">
              <Users size={12} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
