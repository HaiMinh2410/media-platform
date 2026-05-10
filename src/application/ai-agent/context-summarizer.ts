import { db } from '@/lib/db';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { longContextSummaryPrompt } from './prompts/long-context-summary.prompt';
import type { FanProfile, ConversationSummary } from '@/domain/types/ai-agent';

/**
 * Generates a dense ConversationSummary for a long conversation history.
 * This summary consolidates key insights, emotion trends, and purchase records
 * to keep subsequent conversation turns clean and within the context window limits.
 *
 * @param conversationId The UUID of the conversation
 * @param currentProfile The current FanProfile of the fan (if any)
 */
export async function summarizeConversation(
  conversationId: string,
  currentProfile: FanProfile
): Promise<ConversationSummary | null> {
  try {
    console.log(`📝 [ContextSummarizer] Summarizing long context for conversation: ${conversationId}`);

    // 1. Fetch all messages in the conversation sorted chronologically
    const rawMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    if (rawMessages.length === 0) {
      console.log(`⚠️ [ContextSummarizer] No messages found to summarize for conversation: ${conversationId}`);
      return null;
    }

    // 2. Format messages into ChatTurns for the prompt (role: 'fan' | 'agent')
    const formattedHistory = rawMessages.map((msg) => ({
      role: (msg.senderType === 'user' ? 'fan' : 'agent') as 'fan' | 'agent',
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));

    // 3. Prepare Prompt context
    const systemPrompt = longContextSummaryPrompt.system;
    const userPrompt = longContextSummaryPrompt.user({
      history: formattedHistory,
      currentProfile,
      now: new Date().toISOString(),
    });

    // 4. Invoke Groq with llama-3.3-70b-versatile for high reasoning quality
    const { data: completion, error } = await groqClient.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        maxTokens: 2048,
        jsonMode: true,
      }
    );

    if (error || !completion) {
      console.error(`❌ [ContextSummarizer] Groq summary call failed: ${error}`);
      return null;
    }

    // 5. Parse and validate JSON output
    const rawContent = completion.content.trim();
    let summary: any;
    try {
      summary = JSON.parse(rawContent);
    } catch (parseError) {
      console.error(`❌ [ContextSummarizer] Failed to parse summary JSON. Raw content:`, rawContent);
      return null;
    }

    // 6. Map and normalize output to strictly match ConversationSummary domain structure
    const conversationSummary: ConversationSummary = {
      summaryVersion: summary.summaryVersion || '1.0',
      fanType: summary.fanType || currentProfile.fanType || 'Unknown',
      fanTypeConfidence: typeof summary.fanTypeConfidence === 'number' ? summary.fanTypeConfidence : (currentProfile.fanTypeConfidence ?? 0.0),
      currentStage: summary.currentStage || currentProfile.stage || 'G1',
      dayCount: typeof summary.dayCount === 'number' ? summary.dayCount : currentProfile.dayCount,
      emotionScore: typeof summary.emotionScore === 'number' ? summary.emotionScore : currentProfile.emotionScore,
      emotionTrend: summary.emotionTrend || currentProfile.emotionTrend || 'stable',
      flirtLevel: typeof summary.flirtLevel === 'number' ? summary.flirtLevel : currentProfile.flirtLevel,
      keyInsights: Array.isArray(summary.keyInsights) ? summary.keyInsights : currentProfile.keyInsights,
      purchaseHistory: Array.isArray(summary.purchaseHistory) ? summary.purchaseHistory.map((p: any) => ({
        purchasedAt: p.purchasedAt ? new Date(p.purchasedAt) : new Date(),
        packageName: p.packageName || 'Basic',
        amount: typeof p.amount === 'number' ? p.amount : 0,
        currency: p.currency || 'VND',
        notes: p.notes || undefined,
      })) : currentProfile.purchaseHistory,
      objections: Array.isArray(summary.objections) ? summary.objections : currentProfile.objectionsSeen,
      riskLevel: summary.riskLevel || currentProfile.riskLevel || 'low',
      lastMessages: Array.isArray(summary.lastMessages) ? summary.lastMessages.map((m: any) => ({
        role: m.role === 'fan' ? 'fan' : 'agent',
        content: m.content || '',
        timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
      })) : formattedHistory.slice(-5), // Fallback to last 5 messages from DB
      recommendedNextAction: summary.recommendedNextAction || 'Tiếp tục trò chuyện thân thiện',
      fullSummary: summary.fullSummary || 'Hội thoại đang tiếp diễn.',
      generatedAt: summary.generatedAt ? new Date(summary.generatedAt) : new Date(),
    };

    console.log(`✅ [ContextSummarizer] Successfully generated new ConversationSummary.`);
    return conversationSummary;
  } catch (err) {
    console.error('❌ [ContextSummarizer] Error during summary execution:', err);
    return null;
  }
}
