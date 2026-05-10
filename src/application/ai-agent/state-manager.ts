import type { FanProfile, ConversationStage, RiskLevel, FlirtLevel, FanType } from '@/domain/types/ai-agent';

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
 * Automatically determines and updates the flirt level (0 | 1 | 2 | 3) based on 
 * current stage, fan type, emotion score, and previous flirt level.
 * Adheres to Flirt Ladder Compliance from DM Script Playbook 2.0.
 *
 * @param profile Profile context containing updated stage, fanType, emotionScore, and flirtLevel
 * @returns The calculated FlirtLevel
 */
export function determineFlirtLevel(profile: {
  stage: ConversationStage;
  fanType: FanType;
  emotionScore: number;
  flirtLevel: FlirtLevel;
}): FlirtLevel {
  const { stage, fanType, emotionScore, flirtLevel } = profile;

  // 1. G1 Stage: Strictly no flirting (Trust Building only)
  if (stage === 'G1') {
    if (flirtLevel !== 0) {
      console.log(`💖 [StateManager] FlirtLevel reset to 0 because stage is G1`);
    }
    return 0;
  }

  // 2. Drainer: Strictly no flirting (Graceful Exit only)
  if (fanType === 'Drainer') {
    if (flirtLevel !== 0) {
      console.log(`💖 [StateManager] FlirtLevel reset to 0 for Energy Drainer`);
    }
    return 0;
  }

  // 3. Natural progression/regression for G2 and G3 Stages
  let nextFlirt = flirtLevel;

  if (flirtLevel === 0) {
    // Stage is G2/G3, progress to Level 1 if emotion score is decent (>= 0.55)
    if (emotionScore >= 0.55) {
      nextFlirt = 1;
      console.log(`💖 [StateManager] FlirtLevel progressed from 0 to 1 (Emotion Score: ${emotionScore})`);
    }
  } else if (flirtLevel === 1) {
    // Progress to Level 2 if emotion score is high (>= 0.70)
    if (emotionScore >= 0.70) {
      nextFlirt = 2;
      console.log(`💖 [StateManager] FlirtLevel progressed from 1 to 2 (Emotion Score: ${emotionScore})`);
    } 
    // Demote to Level 0 if emotion score drops significantly (< 0.45)
    else if (emotionScore < 0.45) {
      nextFlirt = 0;
      console.log(`💔 [StateManager] FlirtLevel demoted from 1 to 0 (Emotion Score dropped to: ${emotionScore})`);
    }
  } else if (flirtLevel === 2) {
    // Progress to Level 3 if emotion score is exceptional (>= 0.82)
    if (emotionScore >= 0.82) {
      nextFlirt = 3;
      console.log(`💖 [StateManager] FlirtLevel progressed from 2 to 3 (Emotion Score: ${emotionScore})`);
    } 
    // Demote to Level 1 if emotion score drops significantly (< 0.55)
    else if (emotionScore < 0.55) {
      nextFlirt = 1;
      console.log(`💔 [StateManager] FlirtLevel demoted from 2 to 1 (Emotion Score dropped to: ${emotionScore})`);
    }
  } else if (flirtLevel === 3) {
    // Demote to Level 2 if emotion score drops heavily (< 0.65)
    if (emotionScore < 0.65) {
      nextFlirt = 2;
      console.log(`💔 [StateManager] FlirtLevel demoted from 3 to 2 (Emotion Score dropped to: ${emotionScore})`);
    }
  }

  return nextFlirt;
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
    // Check for extreme threat keywords that are immediately HIGH risk for anyone
    const EXTREME_THREAT_PATTERNS = /(bị phốt|bóc phốt|phốt|tống tiền|tố cáo|báo công an|lừa đảo|scam|hack)/i;
    const hasExtremeThreat = lastMessages.some((msg) => EXTREME_THREAT_PATTERNS.test(msg));
    
    if (hasExtremeThreat) {
      console.warn(`🚨 [StateManager] CRITICAL HIGH RISK DETECTED: Extreme threat keyword matched!`);
      return 'high';
    }

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
