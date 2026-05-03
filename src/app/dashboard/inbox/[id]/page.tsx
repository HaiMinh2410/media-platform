import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { RightPanel } from '../components/right-panel';

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
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <RightPanel
        workspaceId={conversation.platform_accounts.workspaceId}
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
        contactInfo={{
          phone: (conversation as any).phone,
          email: (conversation as any).email,
          birthday: (conversation as any).birthday,
          address: (conversation as any).address,
          city: (conversation as any).city,
          state: (conversation as any).state,
          zipCode: (conversation as any).zip_code,
        }}
        customerUsername={(conversation as any).customer_username}
        customerLink={(conversation as any).customer_link}
      />
    </div>
  );
}
