import { groqClient } from '@/infrastructure/ai/groq-client';
import { AI_MODELS } from '@/domain/types/ai';
import type { FanProfile, EmotionTrend } from '@/domain/types/ai-agent';

/**
 * System prompt cho Sentiment Analysis sử dụng llama-3.1-8b-instant.
 */
const EMOTION_SCORER_SYSTEM_PROMPT = `Bạn là một AI chuyên phân tích tình cảm và tâm lý khách hàng bám sát "DM Script Playbook 2.0".
Nhiệm vụ của bạn là đánh giá tin nhắn mới nhất của Fan (khách hàng) kết hợp với bối cảnh trò chuyện gần đây để chấm điểm độ thiện cảm (emotion_score) của họ dành cho Agent (người mẫu/thương hiệu).

Hãy chấm điểm "emotion_score" dưới dạng một số thực từ 0.0 đến 1.0 theo thang đo sau:
- 0.0 - 0.3: LẠNH NHẠT/ĐỀ PHÒNG (Nghi ngờ, cộc lốc, không có emoji, tức giận, hạch sách, né tránh trả lời).
- 0.4 - 0.6: TRUNG TÍNH/LỊCH SỰ (Trả lời vừa đủ, lịch sự nhưng xã giao, chưa mở lòng nhiều, dùng emoji tối thiểu).
- 0.7 - 0.8: THÂN THIỆN/HÀO HỨNG (Cởi mở, dùng nhiều emoji ngọt ngào 😊, viết dài, chủ động chia sẻ, trả lời nhanh).
- 0.9 - 1.0: NỒNG NHIỆT/SAY ĐẮM (Rất nồng nhiệt, dùng emoji yêu thương ❤️, chủ động hỏi han quan tâm đời tư agent, cực kỳ hào hứng).

YÊU CẦU:
1. Bạn phải trả về định dạng JSON chính xác với cấu trúc dưới đây. Không thêm bất kỳ văn bản nào ngoài JSON.
{
  "emotion_score": 0.75,
  "reasoning": "Giải thích ngắn gọn lý do chấm điểm dựa trên ngữ điệu, tần suất emoji và từ ngữ của Fan."
}
`;

/**
 * Phân tích sắc thái cảm xúc thời gian thực (Sentiment Analysis) dựa trên tin nhắn mới từ fan và bối cảnh trò chuyện gần đây.
 *
 * @param params Các tham số bao gồm: conversationHistory (2-3 turn gần đây), currentProfile (profile hiện tại), newMessage (tin nhắn mới)
 */
export async function scoreEmotionAndTrend(params: {
  conversationHistory: { role: 'fan' | 'you'; content: string }[];
  currentProfile: FanProfile;
  newMessage: string;
}): Promise<{
  emotionScore: number;
  emotionTrend: EmotionTrend;
  usage?: { promptTokens: number; completionTokens: number };
}> {
  const { conversationHistory, currentProfile, newMessage } = params;

  try {
    // 1. Chỉ lấy 3 lượt chat gần nhất để làm ngữ cảnh nhẹ nhàng cho llama-3.1-8b-instant
    const recentContext = conversationHistory.slice(-3);
    const formattedContext = recentContext.map(
      (turn) => `${turn.role === 'fan' ? 'Fan' : 'Agent'}: "${turn.content}"`
    ).join('\n');

    const userContent = `Bối cảnh hội thoại gần đây:\n${formattedContext}\n\nTin nhắn mới nhất từ Fan: "${newMessage}"\nĐiểm cảm xúc trước đó: ${currentProfile.emotionScore}`;

    // 2. Gọi Groq API dùng mô hình llama-3.1-8b-instant siêu nhanh
    const { data: completion, error } = await groqClient.complete(
      [
        { role: 'system', content: EMOTION_SCORER_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      {
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        maxTokens: 256,
        jsonMode: true,
      }
    );

    if (error || !completion) {
      console.error(`❌ [EmotionScorer] Groq sentiment analysis failed: ${error}`);
      return {
        emotionScore: currentProfile.emotionScore,
        emotionTrend: 'stable',
      };
    }

    // 3. Parse JSON đầu ra
    let result: { emotion_score: number; reasoning: string };
    try {
      result = JSON.parse(completion.content.trim());
    } catch (parseError) {
      console.error(`❌ [EmotionScorer] Failed to parse output JSON:`, completion.content);
      return {
        emotionScore: currentProfile.emotionScore,
        emotionTrend: 'stable',
      };
    }

    // Đảm bảo score nằm trong [0.0, 1.0]
    let newScore = typeof result.emotion_score === 'number' ? result.emotion_score : currentProfile.emotionScore;
    newScore = Math.max(0.0, Math.min(1.0, newScore));

    // 4. Tính toán Emotion Trend (Tăng > 0.1 -> increasing, Giảm > 0.1 -> decreasing, khác -> stable)
    const oldScore = currentProfile.emotionScore;
    let trend: EmotionTrend = 'stable';

    if (newScore > oldScore + 0.1) {
      trend = 'increasing';
    } else if (newScore < oldScore - 0.1) {
      trend = 'decreasing';
    }

    console.log(`📊 [EmotionScorer] Sentiment Scored: Old=${oldScore} -> New=${newScore} | Trend=${trend} | Reason: ${result.reasoning}`);

    return {
      emotionScore: newScore,
      emotionTrend: trend,
      usage: {
        promptTokens: completion.usage?.promptTokens || 0,
        completionTokens: completion.usage?.completionTokens || 0,
      },
    };
  } catch (err) {
    console.error('❌ [EmotionScorer] Error during sentiment analysis execution:', err);
    return {
      emotionScore: currentProfile.emotionScore,
      emotionTrend: 'stable',
    };
  }
}
