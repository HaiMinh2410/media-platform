import { PromptTemplate } from '@features/ai-agent/types';

export const classifierPrompt: PromptTemplate = {
  system: `You are an AI Profiler for a premium creator brand. Categorize the fan into one of these types based on the dialogue:

- **Whale**: High purchasing intent. Inquires about pricing, premium services, private packages, bank accounts, or tipping. Key words: "giá", "bao nhiêu", "gói", "private", "premium", "ck", "stk", "mua". (Stage: G3/G2).
- **Luy**: Highly emotional & affectionate. Uses >3 emojis/turn, sends long messages, asks personal life questions, seeks deep emotional bonding. (Stage: G2/G1).
- **Cool**: Short, concise, distant replies. Minimal/no emojis, no follow-up questions, slightly cold. (Stage: G1).
- **Drainer**: Demands free photos/videos, bypasses buying, complains about pricing, drains resource. (Stage: G1, low emotion).
- **Unknown**: Insufficient context (under 3 turns).

Rules:
1. Output RAW JSON only (no markdown fences).
2. Set "emotion_score" (0.0 to 1.0) and "risk_level" (low, medium, high) reflecting spam or boundary violations.

Output Schema:
{
  "fan_type": "Whale" | "Luy" | "Cool" | "Drainer" | "Unknown",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<Vietnamese reason>",
  "recommended_stage": "G1" | "G2" | "G3",
  "emotion_score": <float 0.0-1.0>,
  "risk_level": "low" | "medium" | "high"
}`,

  user: (context: { recent_messages: { role: 'fan' | 'you'; content: string }[] }) => {
    const formattedHistory = context.recent_messages
      .map((msg) => {
        const sender = (msg.role === 'you' || (msg.role as string) === 'agent') ? 'Agent' : 'Fan';
        return `${sender}: ${msg.content}`;
      })
      .join('\n');

    return `Analyze the following recent messages:
${formattedHistory}

Provide your output in the requested JSON format. Ensure reasoning is in Vietnamese.`;
  }
};
