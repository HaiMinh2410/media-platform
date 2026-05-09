// src/application/ai-agent/response-generator.ts
//
// AI Response Generator - Phase 2 Hybrid Rule + LLM
// Mục tiêu: Phản hồi tự nhiên bám sát DM Script Playbook 2.0, hỗ trợ Model Routing và Cascading Fallback.
//

import type {
  ResponseGeneratorInput,
  ResponseGeneratorResult,
  AgentResponse,
  NextAction,
  FanType,
} from '@/domain/types/ai-agent';
import { AIModel } from '@/domain/types/ai';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { responseGeneratorPrompt } from './prompts/response-generator.prompt';
import { getTemplateResponse } from './templates';

/**
 * Hàm làm sạch chuỗi JSON thô từ đầu ra của LLM
 * Hỗ trợ bóc tách khối code markdown ```json ... ``` hoặc ``` ... ``` nếu mô hình lỡ trả về.
 */
function sanitizeJsonContent(content: string): string {
  let clean = content.trim();
  
  if (clean.startsWith('```json')) {
    clean = clean.slice(7);
  } else if (clean.startsWith('```')) {
    clean = clean.slice(3);
  }
  
  if (clean.endsWith('```')) {
    clean = clean.slice(0, -3);
  }
  
  return clean.trim();
}

/**
 * AI Response Generator
 * Sinh câu trả lời cá nhân hóa theo từng nhóm Fan và Stage, định tuyến model thông minh (Model Routing).
 * Tích hợp cơ chế dự phòng nhiều tầng (Model Cascading Fallback) bảo đảm phản hồi luôn thông suốt.
 *
 * @param input Tham số đầu vào ResponseGeneratorInput chứa profile, history, strategy và decision
 * @returns ResponseGeneratorResult chứa AgentResponse hoặc thông tin lỗi
 */
export async function generateResponse(
  input: ResponseGeneratorInput
): Promise<ResponseGeneratorResult> {
  console.log(`\n💬 [ResponseGenerator] Starting generation for Fan Type: '${input.fanProfile.fanType}', Stage: '${input.fanProfile.stage}'`);
  console.log(`🎯 [ResponseGenerator] Decided Strategy: '${input.strategy}'`);

  // 1. Xác định danh sách các mô hình cần thử nghiệm theo độ ưu tiên (Model Routing & Cascading)
  let modelsToTry: AIModel[] = [];

  // Nếu người gọi chỉ định một model cụ thể, đưa lên ưu tiên hàng đầu
  if (input.model) {
    modelsToTry.push(input.model);
  }

  const fanType = input.fanProfile.fanType;
  if (fanType === 'Whale') {
    // Whale: Phân khúc siêu VIP, ưu tiên mô hình reasoning cao cấp nhất gpt-oss-120b
    modelsToTry.push('openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant');
  } else if (fanType === 'Luy' || fanType === 'Cool') {
    // Luy/Cool: Đang ở giai đoạn xây dựng quan hệ quan trọng, ưu tiên mô hình 70B
    modelsToTry.push('llama-3.3-70b-versatile', 'llama-3.1-8b-instant');
  } else {
    // Drainer/Unknown: Ưu tiên mô hình 8B nhanh gọn, tiết kiệm chi phí
    modelsToTry.push('llama-3.1-8b-instant');
  }

  // Loại bỏ các model trùng lặp nếu có
  modelsToTry = Array.from(new Set(modelsToTry));

  // Chuẩn bị tham số cuộc hội thoại để truyền vào prompt
  const mappedRecentMessages = input.recentMessages.map((msg) => ({
    role: msg.role === 'agent' ? 'you' as const : 'fan' as const,
    content: msg.content,
  }));

  const userPrompt = responseGeneratorPrompt.user({
    fan_type: input.fanProfile.fanType,
    stage: input.fanProfile.stage,
    emotion_score: input.fanProfile.emotionScore,
    strategy: input.strategy,
    recent_messages: mappedRecentMessages,
    incoming_message: input.incomingMessage,
    should_send_link: input.decision.shouldSendLink,
    link_to_send: input.decision.linkToSend,
    context_summary: input.contextSummary?.fullSummary || null,
  });

  // 2. Vòng lặp thử gọi qua từng model (Model Cascading Fallback)
  let lastError: string | null = null;

  for (const currentModel of modelsToTry) {
    console.log(`🤖 [ResponseGenerator] Trying model: '${currentModel}'...`);
    
    try {
      const response = await groqClient.complete(
        [
          { role: 'system', content: responseGeneratorPrompt.system },
          { role: 'user', content: userPrompt }
        ],
        {
          model: currentModel,
          temperature: 0.7, // Tăng nhẹ nhiệt độ giúp ngôn từ bay bổng, quyến rũ, đậm chất cá nhân hơn
          jsonMode: true,
          maxTokens: 1024,
        }
      );

      if (response.error || !response.data?.content) {
        console.warn(`⚠️ [ResponseGenerator] Model '${currentModel}' failed: ${response.error || 'Empty content'}`);
        lastError = response.error || 'Empty response';
        continue; // Thử model tiếp theo trong chuỗi cascading
      }

      // 3. Phân tích kết quả đầu ra
      const cleanContent = sanitizeJsonContent(response.data.content);
      const data = JSON.parse(cleanContent);

      // Validate và định hình dữ liệu đầu ra để đảm bảo khớp tuyệt đối kiểu dữ liệu AgentResponse
      const finalResponse: AgentResponse = {
        reply: typeof data.reply === 'string' && data.reply.trim() !== '' 
          ? data.reply.trim() 
          : getTemplateResponse(input.fanProfile.fanType, input.fanProfile.stage, input.decision.linkToSend),
        
        action: (['continue', 'send_link', 'soft_exit', 'hard_exit', 'escalate_to_human', 'wait'].includes(data.action)
          ? data.action
          : input.decision.action) as NextAction,
        
        link: typeof data.link === 'string' ? data.link : input.decision.linkToSend,
        
        update_fan_type: (['Luy', 'Cool', 'Whale', 'Drainer', 'Unknown'].includes(data.update_fan_type)
          ? data.update_fan_type
          : null) as FanType | null,
        
        update_emotion_score: typeof data.update_emotion_score === 'number'
          ? Math.max(0, Math.min(1, data.update_emotion_score)) // Giới hạn float từ 0.0 đến 1.0
          : input.fanProfile.emotionScore,
        
        notes_for_next: typeof data.notes_for_next === 'string' && data.notes_for_next.trim() !== ''
          ? data.notes_for_next.trim()
          : 'Sinh phản hồi thành công từ AI.',
      };

      // Đảm bảo có link nếu hành động là gửi link
      if (finalResponse.action === 'send_link' && !finalResponse.link) {
        finalResponse.link = input.decision.linkToSend;
      }

      console.log(`✅ [ResponseGenerator] Successful generation using model: '${currentModel}'`);
      console.log(`📝 [ResponseGenerator] Reply: "${finalResponse.reply}"`);

      return {
        data: finalResponse,
        error: null,
      };
    } catch (err) {
      console.error(`❌ [ResponseGenerator] Error occurred when running model '${currentModel}':`, err);
      lastError = err instanceof Error ? err.message : 'Unknown exception';
      continue; // Thử model tiếp theo trong chuỗi cascading
    }
  }

  // 4. Nếu toàn bộ model đều thất bại, hạ cấp về Rule-based Template (Graceful Degradation)
  console.warn(`🚨 [ResponseGenerator] All LLM models failed! Falling back to Rule-based templates.`);
  
  try {
    const fallbackReply = getTemplateResponse(
      input.fanProfile.fanType,
      input.fanProfile.stage,
      input.decision.linkToSend
    );

    const fallbackResponse: AgentResponse = {
      reply: fallbackReply,
      action: input.decision.action,
      link: input.decision.linkToSend,
      update_fan_type: null,
      update_emotion_score: input.fanProfile.emotionScore,
      notes_for_next: `Dự phòng rule-based tự động do lỗi toàn bộ LLM: ${lastError || 'Unknown API Error'}`,
    };

    return {
      data: fallbackResponse,
      error: null,
    };
  } catch (err) {
    console.error(`🚨 [ResponseGenerator] CRITICAL: Fallback template engine failed!`, err);
    return {
      data: null,
      error: `Critical response generator failure: ${lastError || 'Unknown'}. Fallback failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
