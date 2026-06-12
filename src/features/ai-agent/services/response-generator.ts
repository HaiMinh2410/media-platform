import { db } from "@shared/lib/db";

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
} from '@features/ai-agent/types-agent';
import { AIModel } from '@features/ai-agent/types';
import { groqClient } from '@features/ai-agent/services/groq-client';
import { responseGeneratorPrompt, buildDynamicSystemPrompt, getDynamicPronouns } from './prompts/response-generator.prompt';
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
 * Post-process kiểm tra xưng hô sau khi LLM sinh ra reply.
 * Phát hiện các pattern xưng hô sai phổ biến và tự correct.
 */
function validatePronounConsistency(
  reply: string,
  agentPronoun: string,
  fanPronoun: string,
  incomingMessage: string,
  stage: string = 'G1'
): { correctedReply: string; wasFixed: boolean; issueDetected: string | null } {
  
  // Detect: Khách gọi creator là "anh/chị" nhưng AI vẫn xưng "em" gọi "anh"
  const customerCallsAgentAnh = /\banh\s+ơi\b|\bbên\s+anh\b|\banh\s+có\b/i.test(incomingMessage);
  const customerCallsAgentChi = /\bchị\s+ơi\b|\bbên\s+chị\b|\bchị\s+có\b/i.test(incomingMessage);
  
  // FLIRT OVER RULES: Chỉ áp dụng Pronoun Reversal Rule ở giai đoạn G1 (Build Trust)
  // Nếu ở G2 (Warm-up) hoặc G3 (Upsell), kiên quyết giữ xưng hô thân mật ban đầu.
  if ((customerCallsAgentAnh || customerCallsAgentChi) && agentPronoun === 'em' && stage === 'G1') {
    // Pronoun Reversal Rule bị vi phạm - LLM quên đổi sang mình/bạn
    const fixed = reply
      .replace(/\bem\s+chào\s+anh\b/gi, 'mình chào bạn')
      .replace(/\banh\s+ơi\b/gi, 'bạn ơi')
      .replace(/\bxưng\s+em\b/gi, 'xưng mình')
      // Pattern: "Em là [tên]" → "Mình là [tên]"
      .replace(/\bem\s+là\b/gi, 'mình là')
      // Pattern: "em có thể" → "mình có thể"
      .replace(/\bem\s+có\s+thể\b/gi, 'mình có thể');
    
    return { correctedReply: fixed, wasFixed: fixed !== reply, issueDetected: 'pronoun_reversal_missed' };
  }
  
  // Detect: "xin chào, mình là Em" pattern - AI tự giới thiệu tên sai cách
  const selfIntroPattern = /xin\s+chào[,.]?\s+mình\s+là\s+em/i;
  if (selfIntroPattern.test(reply)) {
    const agentCaps = agentPronoun.charAt(0).toUpperCase() + agentPronoun.slice(1);
    const fixed = reply.replace(
      selfIntroPattern,
      `${agentCaps} chào ${fanPronoun} ạ`
    );
    return { correctedReply: fixed, wasFixed: true, issueDetected: 'wrong_self_intro' };
  }
  
  // Detect: Reply xưng sai pronoun hoàn toàn (agent là "anh" nhưng reply xưng "em")
  if (agentPronoun === 'anh') {
    // Persona là NAM nhưng xưng "em" ở đầu câu
    const wrongPronounPattern = /^"?em\s+chào/i;
    if (wrongPronounPattern.test(reply.trim())) {
      const fixed = reply.replace(/^"?em\s+chào/i, `Anh chào`);
      return { correctedReply: fixed, wasFixed: true, issueDetected: 'agent_pronoun_wrong' };
    }
  }
  
  return { correctedReply: reply, wasFixed: false, issueDetected: null };
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

  // 0. Truy vấn cấu hình AIPersona tương ứng với cuộc hội thoại
  let persona: any = null;
  try {
    const conversation = await db.conversation.findUnique({
      where: { id: input.fanProfile.conversationId },
      include: {
        platform_accounts: {
          include: {
            ai_personas: true,
          },
        },
      },
    });
    persona = conversation?.platform_accounts?.ai_personas || null;
    if (persona) {
      console.log(`👤 [ResponseGenerator] Successfully loaded custom AIPersona: "${persona.name}" for account ${conversation?.account_id}`);
    } else {
      console.log(`👤 [ResponseGenerator] No custom AIPersona found for conversation ${input.fanProfile.conversationId}. Using default.`);
    }
  } catch (err) {
    console.error('⚠️ [ResponseGenerator] Failed to load AIPersona from database:', err);
  }

  // 1. Xác định danh sách các mô hình cần thử nghiệm theo độ ưu tiên (Model Routing & Cascading)
  let modelsToTry: AIModel[] = [];

  // Tải cấu hình A/B Testing hoặc sinh Prompt động dựa trên Persona của tài khoản
  let systemPrompt = buildDynamicSystemPrompt(persona, input.gender);
  let modelOverride: AIModel | null = null;

  try {
    const workspace = await db.workspace.findUnique({
      where: { id: input.fanProfile.workspaceId },
      select: { settings: true },
    });

    const settings = (workspace?.settings || {}) as any;
    const abTest = settings.ab_test;

    if (abTest && abTest.enabled) {
      if (input.abTestVariant === 'B') {
        if (abTest.variant_b_prompt) {
          systemPrompt = buildDynamicSystemPrompt(persona, input.gender, abTest.variant_b_prompt);
          console.log(`📊 [ResponseGenerator] Applying A/B Test Variant B custom system prompt (dynamized).`);
        }
        if (abTest.variant_b_model) {
          modelOverride = abTest.variant_b_model as AIModel;
          console.log(`📊 [ResponseGenerator] Applying A/B Test Variant B custom model override: ${modelOverride}`);
        }
      } else {
        if (abTest.variant_a_prompt) {
          systemPrompt = buildDynamicSystemPrompt(persona, input.gender, abTest.variant_a_prompt);
          console.log(`📊 [ResponseGenerator] Applying A/B Test Variant A custom system prompt (dynamized).`);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ [ResponseGenerator] Error loading workspace settings for A/B testing:', err);
  }

  // Nếu có model override từ A/B test (Variant B), đưa lên ưu tiên hàng đầu
  if (modelOverride) {
    modelsToTry.push(modelOverride);
  }

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
    flirt_level_target: input.decision.flirtLevelTarget,
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
          { role: 'system', content: systemPrompt },
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

      // POST-PROCESS: Validate và correct xưng hô trước khi validation chính thức
      const { agentPronoun, fanPronoun } = getDynamicPronouns(persona, input.gender);
      const { correctedReply, wasFixed, issueDetected } = validatePronounConsistency(
        data.reply || '',
        agentPronoun,
        fanPronoun,
        input.incomingMessage,
        input.fanProfile.stage // Truyền stage vào để áp dụng Flirt Over Rules
      );

      if (wasFixed) {
        console.warn(`⚠️ [ResponseGenerator] Pronoun auto-corrected. Issue: ${issueDetected} | Original: "${data.reply}" | Corrected: "${correctedReply}"`);
        data.reply = correctedReply;
      }

      // Validate và định hình dữ liệu đầu ra để đảm bảo khớp tuyệt đối kiểu dữ liệu AgentResponse
      const finalResponse: AgentResponse = {
        reply: typeof data.reply === 'string' && data.reply.trim() !== '' 
          ? data.reply.trim() 
          : getTemplateResponse(input.fanProfile.fanType, input.fanProfile.stage, input.decision.linkToSend, agentPronoun, fanPronoun),
        
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

      // Thay thế placeholder liên kết {{link}} bằng link thực tế trong finalResponse.reply
      // Việc này chạy sau validatePronounConsistency để tránh sửa nhầm các ký tự xưng hô có thể có trong URL thật.
      if (finalResponse.link) {
        finalResponse.reply = finalResponse.reply.replace(/\{\{link\}\}/g, finalResponse.link);
      } else {
        finalResponse.reply = finalResponse.reply.replace(/\{\{link\}\}/g, '').trim();
      }

      console.log(`✅ [ResponseGenerator] Successful generation using model: '${currentModel}'`);
      console.log(`📝 [ResponseGenerator] Reply: "${finalResponse.reply}"`);

      return {
        data: finalResponse,
        error: null,
        usage: response.data?.usage ? {
          promptTokens: response.data.usage.promptTokens,
          completionTokens: response.data.usage.completionTokens,
          totalTokens: response.data.usage.totalTokens,
        } : undefined,
        modelUsed: currentModel,
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
    const { agentPronoun, fanPronoun } = getDynamicPronouns(persona, input.gender);
    const fallbackReply = getTemplateResponse(
      input.fanProfile.fanType,
      input.fanProfile.stage,
      input.decision.linkToSend,
      agentPronoun,
      fanPronoun
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
      modelUsed: 'Rule-based-Phase-1'
    };
  } catch (err) {
    console.error(`🚨 [ResponseGenerator] CRITICAL: Fallback template engine failed!`, err);
    return {
      data: null,
      error: `Critical response generator failure: ${lastError || 'Unknown'}. Fallback failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
