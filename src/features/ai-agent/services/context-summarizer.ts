import { db } from "@shared/lib/db";

import { groqClient } from '@features/ai-agent/services/groq-client';
import { longContextSummaryPrompt } from './prompts/long-context-summary.prompt';
import { getDynamicPronouns } from './prompts/response-generator.prompt';
import type { FanProfile, ConversationSummary } from '@features/ai-agent/types-agent';

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
    console.log(`📝 [ContextSummarizer] Summarizing long context incrementally for conversation: ${conversationId}`);

    let rawMessages: any[] = [];
    let lastSummaryCache: any = null;
    let isIncremental = false;

    // 1. Kiểm tra xem đã có bản tóm tắt cũ chưa để thực hiện tối ưu hóa luỹ tiến
    if (currentProfile.lastSummary) {
      lastSummaryCache = currentProfile.lastSummary as any;
      const lastGeneratedAt = new Date(lastSummaryCache.generatedAt);

      // Chỉ lấy các tin nhắn được tạo SAU thời điểm bản tóm tắt trước đó được tạo ra
      rawMessages = await db.message.findMany({
        where: {
          conversationId,
          createdAt: { gt: lastGeneratedAt },
        },
        orderBy: { createdAt: 'asc' },
      });

      isIncremental = rawMessages.length > 0;
      if (isIncremental) {
        console.log(`🔄 [ContextSummarizer] Incremental mode active. Processing ${rawMessages.length} new messages since last summary (${lastGeneratedAt.toISOString()}).`);
      }
    }

    // Nếu không có tóm tắt cũ hoặc không có tin nhắn mới sau mốc tóm tắt, quay lại tải toàn bộ tin nhắn
    if (rawMessages.length === 0) {
      rawMessages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      isIncremental = false;
    }

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

    // 2.5 Fetch conversation with platform_accounts, persona, and customerGender
    let persona: any = null;
    let customerGender: string | null = null;
    try {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          platform_accounts: {
            include: {
              ai_personas: true,
            },
          },
        },
      });
      persona = conversation?.platform_accounts?.ai_personas || null;
      customerGender = conversation?.gender || null;
    } catch (err) {
      console.error('⚠️ [ContextSummarizer] Failed to load conversation/persona for summarization:', err);
    }

    const { agentPronoun, fanPronoun } = getDynamicPronouns(persona, customerGender);

    // 3. Prepare Prompt context
    const systemPrompt = typeof longContextSummaryPrompt.system === 'function'
      ? longContextSummaryPrompt.system({ agent_pronoun: agentPronoun, fan_pronoun: fanPronoun })
      : longContextSummaryPrompt.system;

    // Tối ưu hóa User Prompt: Gửi kèm ngữ cảnh tóm tắt cũ dạng JSON và chỉ các tin nhắn mới nếu là luỹ tiến
    const userPrompt = isIncremental
      ? `PREVIOUS CONVERSATION SUMMARY:
${JSON.stringify(lastSummaryCache, null, 2)}

NEW MESSAGES DEVELOPED SINCE THE PREVIOUS SUMMARY:
${JSON.stringify(formattedHistory, null, 2)}

CURRENT TIMESTAMP:
${new Date().toISOString()}

Please update the existing summary and profile metrics incrementally by incorporating the information from the new messages into the previous summary.`
      : longContextSummaryPrompt.user({
          history: formattedHistory,
          currentProfile,
          now: new Date().toISOString(),
          agent_pronoun: agentPronoun,
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

    // 5.5 Smart Merge & Defensive Fallbacks cho môi trường Production
    // 1. Hợp nhất Key Insights (loại bỏ trùng lặp)
    const existingInsights = Array.isArray(currentProfile.keyInsights) ? currentProfile.keyInsights : [];
    const newInsights = Array.isArray(summary.keyInsights) ? summary.keyInsights : [];
    const mergedInsights = Array.from(new Set([...existingInsights, ...newInsights]));

    // 2. Hợp nhất Objections Seen
    const existingObjections = Array.isArray(currentProfile.objectionsSeen) ? currentProfile.objectionsSeen : [];
    const newObjections = Array.isArray(summary.objections) ? summary.objections : [];
    const mergedObjections = Array.from(new Set([...existingObjections, ...newObjections]));

    // 3. Hợp nhất Purchase History (dựa trên mốc thời gian hoặc ID gói để tránh duplicate)
    const existingPurchases = Array.isArray(currentProfile.purchaseHistory) ? currentProfile.purchaseHistory : [];
    const newPurchases = Array.isArray(summary.purchaseHistory) ? summary.purchaseHistory.map((p: any) => ({
      purchasedAt: p.purchasedAt ? new Date(p.purchasedAt) : new Date(),
      packageName: p.packageName || 'Basic',
      amount: typeof p.amount === 'number' ? p.amount : 0,
      currency: p.currency || 'VND',
      notes: p.notes || undefined,
    })) : [];

    const mergedPurchases = [...existingPurchases];
    for (const newP of newPurchases) {
      const isDuplicate = existingPurchases.some(
        oldP => oldP.packageName === newP.packageName && 
        Math.abs(new Date(oldP.purchasedAt).getTime() - newP.purchasedAt.getTime()) < 5 * 60 * 1000
      );
      if (!isDuplicate) {
        mergedPurchases.push(newP);
      }
    }

    // 4. DB Fallback cho lastMessages để bảo đảm rolling bridge context đủ 5 tin nhắn
    let fallbackLastMessages: any[] = [];
    if (isIncremental) {
      try {
        const dbFallback = await db.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        fallbackLastMessages = dbFallback.reverse().map(msg => ({
          role: msg.senderType === 'user' ? 'fan' as const : 'agent' as const,
          content: msg.content,
          timestamp: msg.createdAt
        }));
      } catch (err) {
        console.error('⚠️ Failed to fetch fallback last messages:', err);
        fallbackLastMessages = formattedHistory.slice(-5);
      }
    } else {
      fallbackLastMessages = formattedHistory.slice(-5);
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
      keyInsights: mergedInsights,
      purchaseHistory: mergedPurchases,
      objections: mergedObjections,
      riskLevel: summary.riskLevel || currentProfile.riskLevel || 'low',
      lastMessages: Array.isArray(summary.lastMessages) && summary.lastMessages.length > 0
        ? summary.lastMessages.map((m: any) => ({
            role: m.role === 'fan' ? 'fan' : 'agent',
            content: m.content || '',
            timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
          }))
        : fallbackLastMessages,
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
