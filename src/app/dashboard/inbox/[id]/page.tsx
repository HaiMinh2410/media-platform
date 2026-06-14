import { db } from "@shared/lib/db";

import React from 'react';
import { notFound } from 'next/navigation';
import { RightPanel } from '@features/inbox/components/right-panel';
import { calculateInteractiveDays, determineStage } from '@features/ai-agent';

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
    include: { 
      platform_accounts: {
        include: {
          bot_configurations: true
        }
      },
      fan_profile: true
    }
  });

  if (!conversation) {
    notFound();
  }

  // Bổ sung tính toán ngày tương tác thực tế cho FanProfile
  let fanProfile = null;
  if (conversation.fan_profile) {
    const firstMessage = await db.message.findFirst({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    let dayCount = conversation.fan_profile.day_count;
    let firstInteractedAt = conversation.fan_profile.created_at;

    if (firstMessage) {
      firstInteractedAt = firstMessage.createdAt;
      
      // Tính số ngày có tương tác thực tế (đếm số ngày duy nhất có tin nhắn)
      dayCount = await calculateInteractiveDays(id);

      // Tính lại stage dựa trên dayCount mới
      const currentStage = determineStage({
        ...conversation.fan_profile,
        dayCount,
      } as any);

      // Cập nhật lại DB nếu day_count hoặc stage thực tế bị sai lệch
      if (dayCount !== conversation.fan_profile.day_count || currentStage !== conversation.fan_profile.stage) {
        await db.fanProfile.update({
          where: { id: conversation.fan_profile.id },
          data: { 
            day_count: dayCount,
            stage: currentStage,
          },
        });
      }

      fanProfile = {
        ...conversation.fan_profile,
        day_count: dayCount,
        stage: currentStage,
        firstInteractedAt,
      };
    } else {
      fanProfile = {
        ...conversation.fan_profile,
        firstInteractedAt,
      };
    }
  }

  const platform = conversation.platform_accounts.platform;
  const userName = (conversation as any).customer_name || conversation.platform_conversation_id; 
  const userAvatar = (conversation as any).customer_avatar;

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <RightPanel
        workspaceId={conversation.platform_accounts.workspaceId}
        accountId={conversation.account_id}
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
        initialFanProfile={fanProfile}
        initialBotConfig={conversation.platform_accounts.bot_configurations}
        gender={(conversation as any).gender || null}
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
