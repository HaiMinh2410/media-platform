import type { FanType, ConversationStage, RiskLevel, ClassifierOutput, FanProfile } from '@/domain/types/ai-agent';
import { AI_MODELS } from '@/domain/types/ai';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { classifierPrompt } from './prompts/classifier.prompt';

// Define pattern matching rules for rule-based static classification
const DRAINER_KEYWORDS = /(free|miễn phí|cho xin|xin ảnh|gửi ảnh|cho xem|xin video|gửi video|xin link|cho link|xem free|xin hình|gửi hình|coi free)/i;
const WHALE_KEYWORDS = /(giá|bao nhiêu|gói|private|mua|premium|donate|bảng giá|stk|số tài khoản|chuyển khoản|bank|ck)/i;
const LUY_KEYWORDS = /(yêu|thương|nhớ|thích|dễ thương|đẹp|xinh|hihi|haha|hehe|quá đi|bạn ơi|mến|ôm|hôn|hi\s*hi|ha\s*ha)/i;
const SENSITIVE_KEYWORDS = /(gọi video|video call|cam show|show cam|gặp trực tiếp|gặp ngoài đời|tống tiền|bắt cóc|báo công an|phốt|bóc phốt)/i;

/**
 * Counts the number of emojis in a text string.
 */
function countEmojis(text: string): number {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Counts the number of words in a text string.
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Performs a fast, cost-effective, static rule-based classification of the fan
 * based on the recent message history. Ideal for Phase 1 MVP without LLM costs.
 *
 * @param recentMessages The most recent messages of the conversation
 * @returns ClassifierOutput with fan type, confidence, and recommended metrics
 */
export function classifyFanRuleBased(
  recentMessages: { role: 'fan' | 'you'; content: string }[]
): ClassifierOutput {
  const fanMessages = recentMessages.filter((m) => m.role === 'fan');
  const totalFanMsgs = fanMessages.length;

  // 1. Unknown if not enough message history
  if (totalFanMsgs < 3) {
    return {
      fan_type: 'Unknown',
      confidence: 0.0,
      reasoning: `Chưa đủ dữ liệu tin nhắn của fan để phân loại (chỉ mới có ${totalFanMsgs}/3 tin từ fan).`,
      recommended_stage: 'G1',
      emotion_score: 0.5,
      risk_level: 'low',
    };
  }

  // Aggregate stats
  let whaleMatches = 0;
  let drainerMatches = 0;
  let luyMatches = 0;
  let coolMatches = 0;
  let totalEmojis = 0;
  let totalWords = 0;
  let hasQuestionMark = false;
  let hasSensitiveWord = false;

  for (const msg of fanMessages) {
    const content = msg.content;
    const wordCount = countWords(content);
    const emojiCount = countEmojis(content);

    totalEmojis += emojiCount;
    totalWords += wordCount;

    if (content.includes('?')) {
      hasQuestionMark = true;
    }

    if (DRAINER_KEYWORDS.test(content)) {
      drainerMatches++;
    }
    if (WHALE_KEYWORDS.test(content)) {
      whaleMatches++;
    }
    if (LUY_KEYWORDS.test(content)) {
      luyMatches++;
    }
    if (SENSITIVE_KEYWORDS.test(content)) {
      hasSensitiveWord = true;
    }

    // Cool criteria: very short, no emoji, no question mark
    if (wordCount <= 3 && emojiCount === 0 && !content.includes('?')) {
      coolMatches++;
    }
  }

  const avgEmojis = totalEmojis / totalFanMsgs;
  const avgWords = totalWords / totalFanMsgs;

  // 2. Classify: Drainer (High Priority check)
  // Check if they frequently ask for free stuff without indicating intent to buy
  if (drainerMatches > 0 && whaleMatches === 0) {
    return {
      fan_type: 'Drainer',
      confidence: 0.8,
      reasoning: `Phát hiện ${drainerMatches} tin nhắn chứa từ khóa đòi nội dung miễn phí (free/xin ảnh) và không hỏi mua hàng.`,
      recommended_stage: 'G1',
      emotion_score: 0.3,
      risk_level: hasSensitiveWord ? 'high' : 'low',
    };
  }

  // 3. Classify: Whale
  // Check if they ask about price/packages
  if (whaleMatches > 0) {
    return {
      fan_type: 'Whale',
      confidence: 0.7,
      reasoning: `Phát hiện ${whaleMatches} tin nhắn chủ động hỏi về bảng giá, gói private hoặc mua dịch vụ.`,
      recommended_stage: 'G3', // Whale bypasses directly to G3 for immediate offer
      emotion_score: 0.7,
      risk_level: hasSensitiveWord ? 'medium' : 'low',
    };
  }

  // 4. Classify: Cool
  // Short messages, no emotion/emoji, no questions
  if (coolMatches === totalFanMsgs || (avgWords <= 3 && totalEmojis === 0 && !hasQuestionMark)) {
    return {
      fan_type: 'Cool',
      confidence: 0.6,
      reasoning: `Tin nhắn cực kỳ ngắn (trung bình ${avgWords.toFixed(1)} từ), không chứa emoji hoặc câu hỏi ngược.`,
      recommended_stage: 'G1',
      emotion_score: 0.4,
      risk_level: hasSensitiveWord ? 'medium' : 'low',
    };
  }

  // 5. Classify: Luy
  // High emoji count or high usage of emotional keywords
  if (avgEmojis >= 1.5 || luyMatches > 0 || totalEmojis >= 4) {
    return {
      fan_type: 'Luy',
      confidence: 0.6,
      reasoning: `Fan phản hồi nồng nhiệt bằng cảm xúc (trung bình ${avgEmojis.toFixed(1)} emoji/tin) hoặc từ ngữ thân mật.`,
      recommended_stage: 'G2',
      emotion_score: 0.85,
      risk_level: hasSensitiveWord ? 'medium' : 'low',
    };
  }

  // 6. Default fallback to Unknown if no rules are met
  return {
    fan_type: 'Unknown',
    confidence: 0.5,
    reasoning: `Hội thoại chưa khớp với bất kỳ đặc trưng phân loại cụ thể nào của Rule-based.`,
    recommended_stage: 'G1',
    emotion_score: 0.5,
    risk_level: hasSensitiveWord ? 'medium' : 'low',
  };
}

/**
 * Hybrid Fan Classifier
 * Calls static rule-based first. If confidence < 0.65 or type is 'Unknown',
 * falls back to Groq Llama 3.1 8B API.
 * Includes graceful error handling to guarantee responses.
 */
export async function classifyFanHybrid(
  recentMessages: { role: 'fan' | 'you'; content: string }[],
  currentProfile?: FanProfile
): Promise<ClassifierOutput> {
  // 1. Run cost-effective rule-based classifier first
  const ruleResult = classifyFanRuleBased(recentMessages);

  // 2. If rule-based has high confidence, return immediately to save API cost
  if (ruleResult.fan_type !== 'Unknown' && ruleResult.confidence >= 0.65) {
    return ruleResult;
  }

  console.log(`[Classifier] Low confidence (${ruleResult.confidence}) or Unknown fan_type. Triggering LLM Fallback (Llama 3.1 8B)...`);

  try {
    // 3. Trigger Groq LLM Fallback
    const response = await groqClient.complete(
      [
        { role: 'system', content: classifierPrompt.system },
        { role: 'user', content: classifierPrompt.user({ recent_messages: recentMessages }) }
      ],
      {
        model: AI_MODELS.CLASSIFY,
        temperature: 0.1,
        jsonMode: true
      }
    );

    if (response.error || !response.data?.content) {
      console.warn(`[Classifier] Groq Fallback failed: ${response.error || 'Empty response'}. Falling back to rule result.`);
      return ruleResult;
    }

    // 4. Parse and validate LLM JSON response
    const data = JSON.parse(response.data.content);
    
    // Safety check fields to match ClassifierOutput
    const finalResult: ClassifierOutput = {
      fan_type: (['Luy', 'Cool', 'Whale', 'Drainer', 'Unknown'].includes(data.fan_type) ? data.fan_type : 'Unknown') as FanType,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.7,
      reasoning: typeof data.reasoning === 'string' ? data.reasoning : 'Phân loại bằng mô hình AI Fallback.',
      recommended_stage: (['G1', 'G2', 'G3'].includes(data.recommended_stage) ? data.recommended_stage : 'G1') as ConversationStage,
      emotion_score: typeof data.emotion_score === 'number' ? data.emotion_score : 0.5,
      risk_level: (['low', 'medium', 'high'].includes(data.risk_level) ? data.risk_level : 'low') as RiskLevel,
    };

    if (response.data?.usage) {
      finalResult.usage = {
        promptTokens: response.data.usage.promptTokens,
        completionTokens: response.data.usage.completionTokens,
        totalTokens: response.data.usage.totalTokens,
      };
    }

    console.log(`[Classifier] Successful LLM Fallback classification: ${finalResult.fan_type} (conf: ${finalResult.confidence})`);
    return finalResult;
  } catch (err) {
    console.error('[Classifier] Error in Hybrid Classifier fallback, returning rule-based result:', err);
    return ruleResult;
  }
}

/**
 * Detects if a fan's behavior has changed significantly, which justifies
 * running the hybrid classifier again even if they already have a classified type.
 * Adheres to Reclassification Triggers compliance.
 *
 * @param profile The current FanProfile
 * @param recentMessages The recent conversation history (including the incoming message)
 * @returns boolean indicating if we should trigger reclassification
 */
export function shouldReclassifyFan(
  profile: FanProfile,
  recentMessages: { role: 'fan' | 'you'; content: string }[]
): boolean {
  // 1. If currently Unknown, always classify
  if (profile.fanType === 'Unknown') {
    return true;
  }

  const fanMessages = recentMessages.filter((m) => m.role === 'fan');
  if (fanMessages.length === 0) return false;

  const latestFanMsg = fanMessages[fanMessages.length - 1].content;

  // 2. Condition to trigger Whale reclassification:
  // If not already a Whale, but suddenly asks for prices, packages, payment/bank account
  if (profile.fanType !== 'Whale' && WHALE_KEYWORDS.test(latestFanMsg)) {
    console.log(`🎯 [Classifier] Behavioral shift detected: Fan might be a Whale! Triggering reclassification.`);
    return true;
  }

  // 3. Condition to trigger Drainer reclassification:
  // If not already a Drainer, but starts constantly demanding freebies
  if (profile.fanType !== 'Drainer' && DRAINER_KEYWORDS.test(latestFanMsg)) {
    console.log(`🎯 [Classifier] Behavioral shift detected: Fan might be a Drainer! Triggering reclassification.`);
    return true;
  }

  // 4. Condition to trigger Luy (Warm/Emotional) reclassification:
  // If previously classified as Cool, but they show high emotional signaling (emojis, intimate keywords)
  if (profile.fanType === 'Cool') {
    const hasLuyKeywords = LUY_KEYWORDS.test(latestFanMsg);
    const emojiCount = countEmojis(latestFanMsg);
    if (hasLuyKeywords || emojiCount >= 2 || profile.emotionScore >= 0.75) {
      console.log(`🎯 [Classifier] Behavioral shift detected: Cool fan warming up! Triggering reclassification.`);
      return true;
    }
  }

  // 5. Condition to trigger Cool (Cold/Unresponsive) reclassification:
  // If previously classified as Luy or Whale, but they become extremely short, unresponsive, and emotionScore drops significantly
  if (profile.fanType === 'Luy' || profile.fanType === 'Whale') {
    const wordCount = countWords(latestFanMsg);
    const emojiCount = countEmojis(latestFanMsg);
    if (wordCount <= 3 && emojiCount === 0 && profile.emotionScore < 0.45) {
      console.log(`🎯 [Classifier] Behavioral shift detected: Active fan cooling down! Triggering reclassification.`);
      return true;
    }
  }

  // 6. Periodic re-check every 15 messages to ensure classification hasn't gone stale
  if (profile.messageCount > 0 && profile.messageCount % 15 === 0) {
    console.log(`🎯 [Classifier] Periodic reclassification check triggered (messageCount: ${profile.messageCount}).`);
    return true;
  }

  return false;
}

