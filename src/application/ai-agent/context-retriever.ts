import { db } from '@/lib/db';
import type { FanProfile, ConversationSummary } from '@/domain/types/ai-agent';
import { findByConversationId, upsertFanProfile } from '@/infrastructure/repositories/fan-profile.repository';
import { summarizeConversation } from './context-summarizer';
import { AI_AGENT_DEFAULTS } from '@/domain/types/ai-agent';

export type ContextBundle = {
  fanProfile: FanProfile;
  recentMessages: { role: 'fan' | 'you'; content: string }[];
};

/**
 * Retrieves the full conversation context (Context Bundle) including the fan's profile
 * and recent chat history for a given conversationId.
 * If the fan profile does not exist yet, a default profile is created automatically.
 * Supports auto-summarization of long conversation history (>50 messages) to save tokens.
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

    // 3. Count total messages in this conversation
    const totalMessages = await db.message.count({
      where: { conversationId },
    });

    const triggerLimit = AI_AGENT_DEFAULTS.SUMMARY_TRIGGER_MESSAGE_COUNT || 50;

    // 4. Handle long-context auto summarization
    if (totalMessages > triggerLimit) {
      let needsSummary = false;

      if (!fanProfile.lastSummary) {
        needsSummary = true;
      } else {
        // Count new messages sent after the last summary timestamp
        const newMessagesCount = await db.message.count({
          where: {
            conversationId,
            createdAt: { gt: new Date((fanProfile.lastSummary as any).generatedAt) },
          },
        });
        
        // If there are 5 or more new messages since the last summary, regenerate it
        if (newMessagesCount >= 5) {
          needsSummary = true;
        }
      }

      if (needsSummary) {
        console.log(`⚡ [ContextRetriever] Triggering long context summarizer for conversation ${conversationId} (${totalMessages} messages total)`);
        const newSummary = await summarizeConversation(conversationId, fanProfile);
        if (newSummary) {
          // Update DB with the newly generated summary and metadata
          const updatedProfile = await upsertFanProfile({
            conversationId,
            workspaceId: fanProfile.workspaceId,
            platformUserId: fanProfile.platformUserId,
            fanType: newSummary.fanType,
            fanTypeConfidence: newSummary.fanTypeConfidence,
            stage: newSummary.currentStage,
            emotionScore: newSummary.emotionScore,
            emotionTrend: newSummary.emotionTrend,
            riskLevel: newSummary.riskLevel,
            keyInsights: newSummary.keyInsights,
            objectionsSeen: newSummary.objections,
            lastSummary: newSummary as any,
          });

          if (updatedProfile) {
            fanProfile = updatedProfile;
          }
        }
      }
    }

    // 5. Build recentMessages context
    let recentMessages: { role: 'fan' | 'you'; content: string }[] = [];

    if (fanProfile.lastSummary) {
      const summaryCache = fanProfile.lastSummary as unknown as ConversationSummary;
      
      // Fetch only the messages created AFTER the summary timestamp
      const rawNewMessages = await db.message.findMany({
        where: {
          conversationId,
          createdAt: { gt: new Date(summaryCache.generatedAt) },
        },
        orderBy: { createdAt: 'asc' },
      });

      const formattedNewMessages = rawNewMessages.map((msg) => ({
        role: (msg.senderType === 'user' ? 'fan' : 'you') as 'fan' | 'you',
        content: msg.content,
      }));

      // Map cached lastMessages (4-6 turns) as the rolling bridge context
      const cachedMessages = summaryCache.lastMessages.map((msg) => ({
        role: (msg.role === 'fan' ? 'fan' : 'you') as 'fan' | 'you',
        content: msg.content,
      }));

      recentMessages = [...cachedMessages, ...formattedNewMessages];
      console.log(`ℹ️ [ContextRetriever] Loaded optimized context with summary bridge. Total turns: ${recentMessages.length}`);
    } else {
      // Fallback/Default: Fetch up to 20 recent messages sorted chronologically
      const rawMessages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentMessages = rawMessages
        .reverse()
        .map((msg) => ({
          role: (msg.senderType === 'user' ? 'fan' : 'you') as 'fan' | 'you',
          content: msg.content,
        }));
    }

    return {
      fanProfile,
      recentMessages,
    };
  } catch (error) {
    console.error('❌ [ContextRetriever] Error in retrieveContext:', error);
    throw error;
  }
}
