import type { FanProfile, NextAction } from '@/domain/types/ai-agent';

/**
 * Checks if a link can be sent to the fan based on the rate limit constraint.
 * The distance between two link transmissions must be at least 7 days to avoid Instagram spam flagging.
 *
 * @param profile The current FanProfile
 * @returns true if allowed, false otherwise
 */
export function canSendLink(profile: FanProfile): boolean {
  if (!profile.lastLinkSentAt) {
    return true;
  }

  const lastSentTime = new Date(profile.lastLinkSentAt).getTime();
  const diffMs = Date.now() - lastSentTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 7;
}

/**
 * Executes a static decision matrix mapping FanType and ConversationStage to NextAction.
 * Integrates an anti-spam safeguard that overrides 'send_link' to 'continue' if link frequency is violated.
 *
 * @param profile The current FanProfile
 * @returns The determined NextAction
 */
export function decideAction(profile: FanProfile): NextAction {
  // Immediately escalate to human if risk level is high
  if (profile.riskLevel === 'high') {
    return 'escalate_to_human';
  }

  let action: NextAction = 'continue';

  switch (profile.stage) {
    case 'G1':
      // G1: Build Trust - No flirting, no links, polite interaction.
      // Exception: Whale fans who ask directly can get links immediately.
      if (profile.fanType === 'Whale') {
        action = 'send_link';
      } else {
        action = 'continue';
      }
      break;

    case 'G2':
      // G2: Warm-up & Light Flirting.
      if (profile.fanType === 'Luy') {
        action = 'continue';
      } else if (profile.fanType === 'Cool') {
        // If Cool fan does not respond well (emotionScore is too low), soft exit to save bandwidth
        if (profile.emotionScore < 0.35) {
          action = 'soft_exit';
        } else {
          action = 'continue';
        }
      } else if (profile.fanType === 'Whale') {
        action = 'send_link';
      } else if (profile.fanType === 'Drainer') {
        // Drainers are soft exited in G2 to prevent resource depletion
        action = 'soft_exit';
      } else {
        action = 'continue';
      }
      break;

    case 'G3':
      // G3: Upsell & Close.
      if (profile.fanType === 'Luy' || profile.fanType === 'Cool') {
        // Only pitch links in G3 if banking emotional score >= 0.75
        if (profile.emotionScore >= 0.75) {
          action = 'send_link';
        } else {
          action = 'continue';
        }
      } else if (profile.fanType === 'Whale') {
        action = 'send_link';
      } else if (profile.fanType === 'Drainer') {
        // Drainers in G3 are hard exited if high risk, else escalated to agents
        if (profile.riskLevel === 'high') {
          action = 'hard_exit';
        } else {
          action = 'escalate_to_human';
        }
      } else {
        action = 'continue';
      }
      break;

    default:
      action = 'continue';
  }

  // 2. Anti-Spam Link Frequency Check Override
  if (action === 'send_link' && !canSendLink(profile)) {
    console.warn(
      `🔒 [DecisionEngine] Overriding 'send_link' to 'continue'. Reason: Link sending rate limit violated. (Last sent at: ${profile.lastLinkSentAt})`
    );
    return 'continue';
  }

  return action;
}
