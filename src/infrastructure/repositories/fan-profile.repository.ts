import { db } from '@/lib/db';
import type { 
  FanProfile, 
  FanType, 
  ConversationStage, 
  NextAction, 
  RiskLevel, 
  EmotionTrend, 
  FlirtLevel 
} from '@/domain/types/ai-agent';

/**
 * Maps a raw database FanProfile record returned by Prisma to our strongly-typed domain FanProfile model.
 */
function mapToDomain(dbProfile: any): FanProfile {
  return {
    id: dbProfile.id,
    conversationId: dbProfile.conversation_id,
    workspaceId: dbProfile.workspace_id,
    platformUserId: dbProfile.platform_user_id,
    fanType: (dbProfile.fan_type || 'Unknown') as FanType,
    fanTypeConfidence: dbProfile.fanTypeConfidence ?? 0.0,
    stage: (dbProfile.stage || 'G1') as ConversationStage,
    flirtLevel: (dbProfile.flirt_level ?? 0) as FlirtLevel,
    emotionScore: dbProfile.emotion_score ?? 0.5,
    emotionTrend: (dbProfile.emotion_trend || 'stable') as EmotionTrend,
    dayCount: dbProfile.day_count ?? 0,
    messageCount: dbProfile.message_count ?? 0,
    riskLevel: (dbProfile.risk_level || 'low') as RiskLevel,
    purchaseHistory: (dbProfile.purchase_history || []) as any[],
    objectionsSeen: dbProfile.objections_seen || [],
    keyInsights: dbProfile.key_insights || [],
    nextAction: (dbProfile.next_action || 'continue') as NextAction,
    notes: dbProfile.notes ?? null,
    lastSummary: dbProfile.last_summary ?? null,
    linkSentCount: dbProfile.link_sent_count ?? 0,
    lastLinkSentAt: dbProfile.last_link_sent_at ?? null,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

/**
 * Retrieves a FanProfile by its associated conversationId.
 * Returns null if no profile exists for the given conversation.
 * 
 * @param conversationId The UUID of the conversation
 */
export async function findByConversationId(
  conversationId: string
): Promise<FanProfile | null> {
  try {
    const dbProfile = await db.fanProfile.findUnique({
      where: { conversation_id: conversationId },
    });

    if (!dbProfile) {
      return null;
    }

    return mapToDomain(dbProfile);
  } catch (error) {
    console.error('❌ [FanProfileRepository] Error in findByConversationId:', error);
    return null;
  }
}

/**
 * Creates or updates a FanProfile for a conversation.
 * If a profile exists for the given conversationId, it updates it with the provided subset of fields.
 * If not, it creates a new record using defaults for missing fields.
 * 
 * @param data Combined properties containing the lookup key and fields to create/update
 */
export async function upsertFanProfile(
  data: Partial<FanProfile> & { conversationId: string; workspaceId: string; platformUserId: string }
): Promise<FanProfile | null> {
  try {
    const updateData: any = {};
    if (data.fanType !== undefined) updateData.fan_type = data.fanType;
    if (data.fanTypeConfidence !== undefined) updateData.fanTypeConfidence = data.fanTypeConfidence;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.flirtLevel !== undefined) updateData.flirt_level = data.flirtLevel;
    if (data.emotionScore !== undefined) updateData.emotion_score = data.emotionScore;
    if (data.emotionTrend !== undefined) updateData.emotion_trend = data.emotionTrend;
    if (data.dayCount !== undefined) updateData.day_count = data.dayCount;
    if (data.messageCount !== undefined) updateData.message_count = data.messageCount;
    if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;
    if (data.purchaseHistory !== undefined) updateData.purchase_history = data.purchaseHistory;
    if (data.objectionsSeen !== undefined) updateData.objections_seen = data.objectionsSeen;
    if (data.keyInsights !== undefined) updateData.key_insights = data.keyInsights;
    if (data.nextAction !== undefined) updateData.next_action = data.nextAction;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.lastSummary !== undefined) updateData.last_summary = data.lastSummary;
    if (data.linkSentCount !== undefined) updateData.link_sent_count = data.linkSentCount;
    if (data.lastLinkSentAt !== undefined) updateData.last_link_sent_at = data.lastLinkSentAt;

    const createData: any = {
      conversation_id: data.conversationId,
      workspace_id: data.workspaceId,
      platform_user_id: data.platformUserId,
      fan_type: data.fanType ?? 'Unknown',
      fanTypeConfidence: data.fanTypeConfidence ?? 0.0,
      stage: data.stage ?? 'G1',
      flirt_level: data.flirtLevel ?? 0,
      emotion_score: data.emotionScore ?? 0.5,
      emotion_trend: data.emotionTrend ?? 'stable',
      day_count: data.dayCount ?? 0,
      message_count: data.messageCount ?? 0,
      risk_level: data.riskLevel ?? 'low',
      purchase_history: data.purchaseHistory ?? [],
      objections_seen: data.objectionsSeen ?? [],
      key_insights: data.keyInsights ?? [],
      next_action: data.nextAction ?? 'continue',
      notes: data.notes ?? null,
      last_summary: data.lastSummary ?? null,
      link_sent_count: data.linkSentCount ?? 0,
      last_link_sent_at: data.lastLinkSentAt ?? null,
    };

    const dbProfile = await db.fanProfile.upsert({
      where: { conversation_id: data.conversationId },
      update: updateData,
      create: createData,
    });

    return mapToDomain(dbProfile);
  } catch (error) {
    console.error('❌ [FanProfileRepository] Error in upsertFanProfile:', error);
    return null;
  }
}
