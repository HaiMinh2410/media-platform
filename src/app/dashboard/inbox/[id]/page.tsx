import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { RightPanel } from '../components/right-panel';
import styles from '../components/chat.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const userName = (conversation as any).customer_name || conversation.platform_conversation_id; 
  const userAvatar = (conversation as any).customer_avatar;

  return (
    <div className={styles.chatContainer}>
      <RightPanel
        conversationId={id}
        platform={platform}
        externalId={conversation.platform_conversation_id}
        lastMessageAt={conversation.lastMessageAt}
        pageName={conversation.platform_accounts.platform_user_name}
        customerName={userName}
        customerAvatar={userAvatar}
        priority={(conversation as any).priority || null}
        sentiment={(conversation as any).sentiment || null}
        initialTags={(conversation as any).tags || []}
      />
    </div>
  );
}
