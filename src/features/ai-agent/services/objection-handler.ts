// src/application/ai-agent/objection-handler.ts
//
// AI Objection Handler - Phase 2 Hybrid Rule + LLM
// Mục tiêu: Tự động nhận diện, ghi lại và xử lý các phản đối (objections) của fan theo Playbook 2.0.
//

import type { FanProfile, ObjectionType, NextAction } from '@features/ai-agent/types-agent';
import { AI_MODELS } from '@features/ai-agent/types';
import { groqClient } from '@features/ai-agent/services/groq-client';
import { objectionPrompt } from './prompts/objection.prompt';
import { getDynamicPronouns } from './prompts/response-generator.prompt';

/**
 * Định nghĩa cấu trúc kết quả trả về từ Objection Handler
 */
export type ObjectionHandlerResult = {
  reply: string;
  action: NextAction;
  objectionType: ObjectionType;
  updatedProfile: Partial<FanProfile>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelUsed?: string;
};

// Mẫu Regex quét từ khóa phản đối phổ biến
const OBJECTION_PATTERNS: { type: ObjectionType; pattern: RegExp }[] = [
  {
    type: 'want_free',
    pattern: /(free|miễn phí|cho xin|xin ảnh|gửi ảnh|cho xem|xin video|gửi video|coi free|xin hình|gửi hình|coi thử|xem thử|leak)/i,
  },
  {
    type: 'too_expensive',
    pattern: /((đắt|mắc|cao|phí) quá|không có tiền|hết tiền|giá chát|đắt thế|bớt không|giảm giá|sale)/i,
  },
  {
    type: 'not_trusted',
    pattern: /((chưa|không) tin|ảo|lừa|lừa đảo|thật không|có thật không|tin được không|uy tín|thật hay giả)/i,
  },
  {
    type: 'privacy_concern',
    pattern: /(sợ lộ|bảo mật|an toàn hông|an toàn không|lộ ảnh|lộ hình|lộ video|kín đáo|riêng tư không|bị lộ)/i,
  },
  {
    type: 'too_busy',
    pattern: /((đang|anh) bận|lúc khác|khi khác|sau nha|sau nhen|tí nữa|mai nha|bận quá|bận rồi)/i,
  },
  {
    type: 'asking_price',
    pattern: /(bao nhiêu|nhiêu|giá sao|giá gói|giá cả|nhiêu tiền|gói nào|xin giá|hỏi giá)/i,
  },
];

// Ngân hàng phản hồi mẫu rule-based khi LLM lỗi hoặc fallback với placeholders pronouns động
const FALLBACK_OBJECTION_RESPONSES: Record<ObjectionType, string> = {
  too_expensive: "Dạ, 'tiền nào của nấy' mà {{fan_pronoun}} ơi, hihi. {{agent_pronoun_caps}} cam kết chất lượng và những khoảnh khắc đặc sắc bên kênh riêng tư sẽ hông làm {{fan_pronoun}} thất vọng đâu ạ. Hay {{fan_pronoun}} trải nghiệm thử gói nhỏ tuần này xem sao nhen? 🥰",
  not_trusted: "Dạ, {{agent_pronoun}} hiểu cảm giác lo lắng của {{fan_pronoun}} nè. Nhưng {{agent_pronoun}} làm việc nghiêm túc và uy tín xưa giờ mà {{fan_pronoun}} ơi, hông có chuyện ảo đâu ạ. {{fan_pronoun_caps}} cứ vào trải nghiệm thử, bảo đảm sẽ thích mê luôn á! 😉",
  too_busy: "Dạ hông sao hết nè, {{fan_pronoun}} bận cứ lo công việc trước đi nhen. {{agent_pronoun_caps}} vẫn giữ ưu đãi đặc quyền này cho riêng {{fan_pronoun}} á, khi nào rảnh {{fan_pronoun}} ghé tìm {{agent_pronoun}} nha. Chúc {{fan_pronoun}} làm việc suôn sẻ nè! ❤️",
  privacy_concern: "{{fan_pronoun_caps}} hoàn toàn yên tâm nhen, không gian riêng tư của tụi mình bảo mật tuyệt đối 100% luôn á. Mọi khoảnh khắc thầm kín hay tin nhắn của hai tụi mình đều được giữ kín hoàn toàn nè. 🙏",
  want_free: "Dạ, những hình ảnh và video đặc biệt đó {{agent_pronoun}} chỉ chia sẻ ở kênh riêng tư dành cho các thành viên VIP quý mến {{agent_pronoun}} thui ạ. Trên này {{agent_pronoun}} hông gửi riêng được, mong {{fan_pronoun}} hết sức thông cảm giùm {{agent_pronoun}} nha. 🙏",
  asking_price: "Dạ, chi tiết về các gói đặc quyền và bảng giá hấp dẫn {{agent_pronoun}} có cập nhật đầy đủ và rõ ràng ở không gian riêng tư của {{agent_pronoun}} bên này nè. {{fan_pronoun_caps}} ghé qua xem thử liền nha: {{link}}",
  other: "Dạ {{agent_pronoun}} hiểu ý {{fan_pronoun}} rồi nè, tụi mình trò chuyện vui vẻ bình thường nhen {{fan_pronoun}} ơi. Chúc {{fan_pronoun}} một ngày ngập tràn niềm vui nha! 🥰",
};

/**
 * Nhận biết loại phản đối từ tin nhắn của Fan bằng Regex tĩnh (tối ưu tốc độ)
 *
 * @param messageText Nội dung tin nhắn của fan
 * @returns ObjectionType hoặc null nếu hông phát hiện phản đối
 */
export function detectObjection(messageText: string): ObjectionType | null {
  for (const item of OBJECTION_PATTERNS) {
    if (item.pattern.test(messageText)) {
      return item.type;
    }
  }
  return null;
}

function getFallbackResponse(
  type: ObjectionType,
  link?: string | null,
  agentPronoun: string = 'em',
  fanPronoun: string = 'anh'
): string {
  const template = FALLBACK_OBJECTION_RESPONSES[type] || FALLBACK_OBJECTION_RESPONSES.other;
  const actualLink = link || 'https://exclusive.com/sign-up';
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  return template
    .replace(/\{\{link\}\}/g, actualLink)
    .replace(/\{\{agent_pronoun\}\}/g, agentPronoun)
    .replace(/\{\{fan_pronoun\}\}/g, fanPronoun)
    .replace(/\{\{agent_pronoun_caps\}\}/g, capitalize(agentPronoun))
    .replace(/\{\{fan_pronoun_caps\}\}/g, capitalize(fanPronoun));
}

/**
 * Điều phối chính việc xử lý phản đối: Nhận biết -> Gọi LLM tạo phản hồi uyển chuyển -> Lưu lịch sử phản đối
 *
 * @param messageText Tin nhắn fan vừa gửi
 * @param profile Fan Profile hiện tại
 * @param availableLink Đường link sẵn có để điều hướng (VIP link)
 * @returns ObjectionHandlerResult nếu phát hiện phản đối, ngược lại là null
 */
export async function detectAndHandleObjection(
  messageText: string,
  profile: FanProfile,
  availableLink?: string | null,
  persona?: any,
  customerGender?: string | null
): Promise<ObjectionHandlerResult | null> {
  // 1. Quét nhanh nhận diện loại phản đối
  const detectedType = detectObjection(messageText);
  if (!detectedType) {
    return null;
  }

  console.log(`⚠️ [ObjectionHandler] Detected objection: '${detectedType}' in message: "${messageText}"`);

  // 2. Ghi nhận phản đối vào profile.objectionsSeen để lưu trữ ngữ cảnh
  const updatedObjectionsSeen = [...profile.objectionsSeen];
  if (!updatedObjectionsSeen.includes(detectedType)) {
    updatedObjectionsSeen.push(detectedType);
  }

  const updatedProfile: Partial<FanProfile> = {
    objectionsSeen: updatedObjectionsSeen,
  };

  // 2.5 Lấy đại từ xưng hô động dựa vào cấu hình Persona và Customer Gender
  const { agentPronoun, fanPronoun, isAgentMale } = getDynamicPronouns(persona, customerGender);

  // 3. Gọi LLM sinh phản hồi cá nhân hóa ngọt ngào
  try {
    const userPrompt = objectionPrompt.user({
      objection_type: detectedType,
      incoming_message: messageText,
      fan_type: profile.fanType,
      stage: profile.stage,
      emotion_score: profile.emotionScore,
      agent_pronoun: agentPronoun,
      fan_pronoun: fanPronoun,
    });

    const systemPromptContent = typeof objectionPrompt.system === 'function'
      ? objectionPrompt.system({
          agent_pronoun: agentPronoun,
          fan_pronoun: fanPronoun,
          agent_gender: isAgentMale ? 'male' : 'female',
        })
      : objectionPrompt.system;

    const response = await groqClient.complete(
      [
        { role: 'system', content: systemPromptContent },
        { role: 'user', content: userPrompt }
      ],
      {
        model: AI_MODELS.CLASSIFY, // Sử dụng 8b cho tốc độ nhanh nhất
        temperature: 0.3,
        jsonMode: true,
      }
    );

    if (response.error || !response.data?.content) {
      console.warn(`⚠️ [ObjectionHandler] Groq call failed. Falling back to Rule-based template.`);
      const fallbackReply = getFallbackResponse(detectedType, availableLink, agentPronoun, fanPronoun);
      return {
        reply: fallbackReply,
        action: detectedType === 'want_free' ? 'soft_exit' : 'continue',
        objectionType: detectedType,
        updatedProfile,
        modelUsed: 'Rule-based-Phase-1',
      };
    }

    // Làm sạch và parse đầu ra JSON
    let cleanContent = response.data.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    
    cleanContent = cleanContent.trim();
    const data = JSON.parse(cleanContent);

    let reply = typeof data.reply === 'string' && data.reply.trim() !== ''
      ? data.reply.trim()
      : getFallbackResponse(detectedType, availableLink, agentPronoun, fanPronoun);

    // Thay thế placeholder liên kết nếu LLM giữ nguyên {{link}} trong câu trả lời
    const actualLink = availableLink || 'https://exclusive.com/sign-up';
    reply = reply.replace(/\{\{link\}\}/g, actualLink);

    const action = (['continue', 'soft_exit', 'escalate_to_human'].includes(data.action)
      ? data.action
      : (detectedType === 'want_free' ? 'soft_exit' : 'continue')) as NextAction;

    console.log(`✅ [ObjectionHandler] Elegantly handled objection '${detectedType}' via LLM.`);
    console.log(`📝 [ObjectionHandler] Reply: "${reply}"`);

    const finalObjectionResult: ObjectionHandlerResult = {
      reply,
      action,
      objectionType: detectedType,
      updatedProfile,
      modelUsed: AI_MODELS.CLASSIFY,
    };

    if (response.data?.usage) {
      finalObjectionResult.usage = {
        promptTokens: response.data.usage.promptTokens,
        completionTokens: response.data.usage.completionTokens,
        totalTokens: response.data.usage.totalTokens,
      };
    }

    return finalObjectionResult;
  } catch (err) {
    console.error(`❌ [ObjectionHandler] Exception occurred during handling, defaulting to fallback template:`, err);
    const fallbackReply = getFallbackResponse(detectedType, availableLink, agentPronoun, fanPronoun);
    return {
      reply: fallbackReply,
      action: detectedType === 'want_free' ? 'soft_exit' : 'continue',
      objectionType: detectedType,
      updatedProfile,
      modelUsed: 'Rule-based-Phase-1',
    };
  }
}
