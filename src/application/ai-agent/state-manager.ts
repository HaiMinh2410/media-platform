import type { FanProfile, ConversationStage, RiskLevel } from '@/domain/types/ai-agent';

// Regex for checking high-risk or sensitive patterns in incoming chat messages
const SENSITIVE_PATTERNS = /(gọi video|video call|cam show|show cam|gặp trực tiếp|gặp ngoài đời|free photo|free video|ảnh miễn phí|video miễn phí|ảnh nude|nude photo|hack|scam|lừa đảo|đòi tiền|chuyển khoản riêng|bị phốt|bóc phốt|phốt|tống tiền|bắt cóc|tố cáo|báo công an)/i;

/**
 * Determines and updates the conversation stage ('G1' | 'G2' | 'G3') based on 
 * interactions day count and emotional banking score (early promotion).
 *
 * @param profile The current FanProfile
 * @returns The calculated ConversationStage
 */
export function determineStage(profile: FanProfile): ConversationStage {
  let baseStage: ConversationStage = 'G1';

  // 1. Determine baseline stage from dayCount
  if (profile.dayCount <= 30) {
    baseStage = 'G1';
  } else if (profile.dayCount <= 60) {
    baseStage = 'G2';
  } else {
    baseStage = 'G3';
  }

  // 2. Early promotion logic based on emotionScore
  if (baseStage === 'G1' && profile.emotionScore >= 0.85) {
    console.log(`🚀 [StateManager] Early promotion from G1 to G2 (Emotion Score: ${profile.emotionScore})`);
    return 'G2';
  }
  
  if (baseStage === 'G2' && profile.emotionScore >= 0.80) {
    console.log(`🚀 [StateManager] Early promotion from G2 to G3 (Emotion Score: ${profile.emotionScore})`);
    return 'G3';
  }

  return baseStage;
}

/**
 * Assesses conversation risk level ('low' | 'medium' | 'high') based on 
 * sensitive topics trigger and the type of fan.
 *
 * @param profile The current FanProfile
 * @param lastMessages Array of recent incoming message contents
 * @returns The determined RiskLevel
 */
export function assessRisk(profile: FanProfile, lastMessages: string[]): RiskLevel {
  if (!lastMessages || lastMessages.length === 0) {
    return 'low';
  }

  // Check if any of the recent messages match high-risk sensitive patterns
  const hasSensitiveRequest = lastMessages.some((msg) => SENSITIVE_PATTERNS.test(msg));

  if (hasSensitiveRequest) {
    // Escalate immediately to 'high' risk if the fan is a known 'Drainer'
    if (profile.fanType === 'Drainer') {
      console.warn(`⚠️ [StateManager] High risk detected: Drainer asking for sensitive info/actions.`);
      return 'high';
    }
    console.warn(`⚠️ [StateManager] Medium risk detected: Sensitive request keyword matched.`);
    return 'medium';
  }

  return 'low';
}
