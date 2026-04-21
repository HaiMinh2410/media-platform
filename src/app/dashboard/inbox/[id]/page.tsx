import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ChatWindow } from '../components/chat-window';
import { ReplyBox } from '../components/reply-box';
import { ConversationContext } from '../components/conversation-context';
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
  const userName = conversation.platform_conversation_id; 

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {userName.substring(0, 2).toUpperCase()}
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

      <div className={styles.mainContent}>
        <div className={styles.chatMain}>
          <ChatWindow conversationId={id} />
          <ReplyBox conversationId={id} />
        </div>
        
        <ConversationContext 
          platform={platform}
          externalId={conversation.platform_conversation_id}
          lastMessageAt={conversation.lastMessageAt}
          pageName={conversation.platform_accounts.platform_user_name}
        />
      </div>
    </div>
  );
}
