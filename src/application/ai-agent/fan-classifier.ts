import type { FanType, ConversationStage, RiskLevel, ClassifierOutput } from '@/domain/types/ai-agent';

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
