import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ConversationPageClient } from '../components/conversation-page-client';
import styles from '../components/chat.module.css';

export default async function ConversationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { platform_accounts: true }
  });

  if (!conversation) {
    notFound();
  }

  const platform = conversation.platform_accounts.platform;
  const userName = conversation.customer_name || conversation.platform_conversation_id; 
  const userAvatar = conversation.customer_avatar;

  const getInitials = (name: string) => {
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className={styles.avatarImg} />
            ) : (
              getInitials(userName)
            )}
          </div>
          <div>
            <h2 className={styles.userName}>{userName}</h2>
            <div className={styles.platformDetails}>
              <span className={styles.platformBadge}>{platform}</span>
              <span className={styles.status}>via {conversation.platform_accounts.platform_user_name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Client boundary: owns state for fillText (AI suggestion → ReplyBox) */}
      <ConversationPageClient
        conversationId={id}
        platform={platform}
        externalId={conversation.platform_conversation_id}
        lastMessageAt={conversation.lastMessageAt}
        pageName={conversation.platform_accounts.platform_user_name}
        customerName={conversation.customer_name || undefined}
      />
    </div>
  );
}
