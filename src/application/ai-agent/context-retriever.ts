import { db } from '@/lib/db';
import type { FanProfile } from '@/domain/types/ai-agent';
import { findByConversationId, upsertFanProfile } from '@/infrastructure/repositories/fan-profile.repository';

export type ContextBundle = {
  fanProfile: FanProfile;
  recentMessages: { role: 'fan' | 'you'; content: string }[];
};

/**
 * Retrieves the full conversation context (Context Bundle) including the fan's profile
 * and recent chat history for a given conversationId.
 * If the fan profile does not exist yet, a default profile is created automatically.
 *
 * @param conversationId The UUID of the conversation
 */
export async function retrieveContext(conversationId: string): Promise<ContextBundle> {
  try {
    // 1. Fetch existing FanProfile
    let fanProfile = await findByConversationId(conversationId);

    // 2. If profile doesn't exist, create a default one
    if (!fanProfile) {
      console.log(`ℹ️ [ContextRetriever] FanProfile not found for conversation ${conversationId}. Creating default...`);
      
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          platform_accounts: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation not found for ID: ${conversationId}`);
      }

      if (!conversation.platform_accounts) {
        throw new Error(`Platform account not associated with conversation ID: ${conversationId}`);
      }

      // Calculate dayCount since the first message
      const firstMessage = await db.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      let dayCount = 0;
      if (firstMessage) {
        const diffTime = Math.abs(new Date().getTime() - firstMessage.createdAt.getTime());
        dayCount = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Create new FanProfile record with default values
      const createdProfile = await upsertFanProfile({
        conversationId,
        workspaceId: conversation.platform_accounts.workspaceId,
        platformUserId: conversation.platform_conversation_id,
        fanType: 'Unknown',
        fanTypeConfidence: 0.0,
        stage: 'G1',
        flirtLevel: 0,
        emotionScore: 0.5,
        emotionTrend: 'stable',
        dayCount,
        messageCount: 0,
        riskLevel: 'low',
        purchaseHistory: [],
        objectionsSeen: [],
        keyInsights: [],
        nextAction: 'continue',
        notes: null,
        lastSummary: null,
        linkSentCount: 0,
        lastLinkSentAt: null,
      });

      if (!createdProfile) {
        throw new Error(`Failed to create default FanProfile for conversation: ${conversationId}`);
      }

      fanProfile = createdProfile;
    }

    // 3. Fetch up to 20 recent messages sorted chronologically (ascending)
    const rawMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Reverse to chronological order and map to simple role-content structure
    const recentMessages = rawMessages
      .reverse()
      .map((msg) => ({
        role: (msg.senderType === 'user' ? 'fan' : 'you') as 'fan' | 'you',
        content: msg.content,
      }));

    return {
      fanProfile,
      recentMessages,
    };
  } catch (error) {
    console.error('❌ [ContextRetriever] Error in retrieveContext:', error);
    throw error;
  }
}
