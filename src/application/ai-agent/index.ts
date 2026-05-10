// src/application/ai-agent/index.ts
//
// Entry point / Orchestrator chính cho AI DM Agent Pipeline — Phase 2 Hybrid Rule + LLM.
// Điều phối toàn bộ vòng lặp xử lý tin nhắn từ nạp ngữ cảnh, phân loại, quyết định hành động,
// tạo nội dung phản hồi bằng LLM/Templates, bộ lọc an toàn, ghi log chi tiết, và tính toán trì hoãn.

import * as crypto from 'crypto';
import { retrieveContext } from './context-retriever';
import { determineStage, assessRisk, determineFlirtLevel } from './state-manager';
import { scoreEmotionAndTrend } from './emotion-scorer';
import { classifyFanHybrid, shouldReclassifyFan } from './fan-classifier';
import { decideAction } from './decision-engine';
import { getTemplateResponse } from './templates';
import { filterBlacklist, calculateDelay, checkLinkRateLimit, checkSafety } from './safety-checker';
import { upsertFanProfile } from '@/infrastructure/repositories/fan-profile.repository';
import { generateResponse } from './response-generator';
import { detectAndHandleObjection } from './objection-handler';
import { db } from '@/lib/db';
import type { FanProfile, NextAction, ResponseStrategy, ConversationStage, FanType } from '@/domain/types/ai-agent';

/**
 * Định nghĩa cấu trúc AgentResponse trả về từ orchestrator.
 */
export type AgentResponse = {
  reply: string;               // Tin nhắn mẫu phản hồi đã được lọc sạch từ khóa nhạy cảm
  action: NextAction;          // Hành động tiếp theo quyết định bởi Decision Engine
  link: string | null;         // Liên kết gửi cho khách hàng (VIP/private) nếu hành động là send_link, ngược lại là null
  delay: number;               // Thời gian trì hoãn phản hồi tính bằng miliseconds (ms)
  updatedProfile: FanProfile;  // Trạng thái profile khách hàng sau khi đã cập nhật hoàn chỉnh trong DB
  aiLogId: string;             // ID của bản ghi log trong bảng ai_reply_logs
};

/**
 * Hàm xác định chiến lược phản hồi (ResponseStrategy) dựa trên nhóm đối tượng và giai đoạn trò chuyện.
 */
export function determineStrategy(fanType: FanType, stage: ConversationStage): ResponseStrategy {
  if (stage === 'G1') {
    return 'TrustBuilding';
  }
  
  switch (fanType) {
    case 'Whale':
      return 'StraightVIP';
    case 'Luy':
      return 'EmotionalBanking';
    case 'Cool':
      return 'TeaseWithdraw';
    case 'Drainer':
      return 'GracefulExit';
    default:
      return 'TrustBuilding';
  }
}

/**
 * Hàm điều phối chính (Pipeline Orchestrator) xử lý tin nhắn đầu vào từ khách hàng.
 * Thực thi tuần tự các bước xử lý khép kín nhằm tối ưu chuyển đổi và duy trì an toàn tài khoản.
 *
 * @param params Các tham số nhận từ webhook worker bao gồm: conversationId, messageText, workspaceId, platformUserId, messageId
 */
export async function processIncomingMessage(params: {
  conversationId: string;
  messageText: string;
  workspaceId: string;
  platformUserId: string;
  messageId: string;
}): Promise<AgentResponse> {
  console.log(`\n🌀 [Orchestrator] Starting AI Pipeline for Conversation: ${params.conversationId}`);
  console.log(`💬 [Orchestrator] Incoming message: "${params.messageText}"`);

  const pipelineStart = Date.now();
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed = 'Rule-based-Phase-1';
  let latencyMs = 0;

  try {
    // 1. Nạp ngữ cảnh (Retrieve Context)
    const context = await retrieveContext(params.conversationId);
    const { fanProfile, recentMessages } = context;

    // Cập nhật tin nhắn hiện tại vào mảng recentMessages để các bộ phân loại phân tích chính xác nhất
    const updatedMessages = [
      ...recentMessages,
      { role: 'fan' as const, content: params.messageText }
    ];

    const emotionScoreBefore = fanProfile.emotionScore;

    // Chấm điểm cảm xúc thời gian thực (Sentiment Analysis - T157)
    console.log(`🔍 [Orchestrator] Scoring sentiment of incoming message...`);
    const emotionResult = await scoreEmotionAndTrend({
      conversationHistory: recentMessages,
      currentProfile: fanProfile,
      newMessage: params.messageText,
    });

    if (emotionResult.usage) {
      promptTokens += emotionResult.usage.promptTokens;
      completionTokens += emotionResult.usage.completionTokens;
    }

    // 2. Xác định Giai đoạn (Stage) & Đánh giá Rủi ro (Risk Level) từ StateManager
    const currentStage = determineStage(fanProfile);
    
    // Thu thập nội dung tin nhắn của fan từ lịch sử cập nhật để phân tích rủi ro
    const fanMessageContents = updatedMessages
      .filter((msg) => msg.role === 'fan')
      .map((msg) => msg.content);
    
    const currentRisk = assessRisk(fanProfile, fanMessageContents);

    // Tính toán Flirt Level ban đầu trước khi phân loại (hoặc nếu đã có sẵn phân loại)
    const initialFlirtLevel = determineFlirtLevel({
      stage: currentStage,
      fanType: fanProfile.fanType,
      emotionScore: emotionResult.emotionScore,
      flirtLevel: fanProfile.flirtLevel,
    });

    // Chuẩn bị profile tạm thời chứa các trạng thái vừa tính toán
    const tempProfile: FanProfile = {
      ...fanProfile,
      stage: currentStage,
      riskLevel: currentRisk,
      emotionScore: emotionResult.emotionScore,
      emotionTrend: emotionResult.emotionTrend,
      flirtLevel: initialFlirtLevel,
    };

    // 2.5 Early Short-circuit if Risk Level is High (Escalate-to-human)
    if (tempProfile.riskLevel === 'high') {
      console.warn(`🚨 [Orchestrator] High risk level detected! Short-circuiting and escalating immediately to human.`);
      tempProfile.nextAction = 'escalate_to_human';
      // Update FanProfile state immediately
      const savedProfile = await upsertFanProfile({
        conversationId: params.conversationId,
        workspaceId: params.workspaceId,
        platformUserId: params.platformUserId,
        fanType: tempProfile.fanType,
        fanTypeConfidence: tempProfile.fanTypeConfidence,
        stage: tempProfile.stage,
        riskLevel: 'high',
        nextAction: 'escalate_to_human',
        messageCount: tempProfile.messageCount + 1, // Count this message as received
        linkSentCount: tempProfile.linkSentCount,
        lastLinkSentAt: tempProfile.lastLinkSentAt,
        emotionScore: tempProfile.emotionScore,
        emotionTrend: tempProfile.emotionTrend,
        flirtLevel: tempProfile.flirtLevel,
        keyInsights: tempProfile.keyInsights as string[],
        objectionsSeen: tempProfile.objectionsSeen as string[],
        lastSummary: tempProfile.lastSummary ?? undefined,
      });

      if (!savedProfile) {
        throw new Error(`[Orchestrator] Failed to save updated FanProfile in database for conversation: ${params.conversationId}`);
      }

      // Log the AI Reply Log for tracking and human review
      const promptSummary = `Short-circuited due to high risk assessment. Incoming: "${params.messageText}"`;
      const log = await db.aIReplyLog.create({
        data: {
          messageId: params.messageId,
          prompt: promptSummary,
          response: '',
          model: 'System-Short-Circuit',
          status: 'suggested',
          fanType: tempProfile.fanType,
          stage: tempProfile.stage,
          strategy: 'GracefulExit',
          action: 'escalate_to_human',
          emotionScoreBefore: tempProfile.emotionScore,
          emotionScoreAfter: tempProfile.emotionScore,
          riskLevel: 'high',
          safetyViolations: ['HIGH_RISK_KEYWORDS'] as any,
          promptTokens: 0,
          completionTokens: 0,
          latencyMs: Date.now() - pipelineStart,
          abTestVariant: 'A',
        }
      });

      return {
        reply: '',
        action: 'escalate_to_human',
        link: null,
        delay: 0,
        updatedProfile: savedProfile,
        aiLogId: log.id,
      };
    }

    // 3. Phân loại đối tượng Fan (Fan Classification) hoặc Phân loại lại nếu hành vi thay đổi rõ rệt (T159)
    const isUnknown = tempProfile.fanType === 'Unknown';
    const needsReclassify = shouldReclassifyFan(tempProfile, updatedMessages);

    if (isUnknown || needsReclassify) {
      if (isUnknown) {
        console.log(`🔍 [Orchestrator] Fan type is 'Unknown'. Running hybrid classification...`);
      } else {
        console.log(`🔍 [Orchestrator] Triggering Fan Type reclassification from '${tempProfile.fanType}'...`);
      }
      
      const classification = await classifyFanHybrid(updatedMessages, tempProfile);
      
      if (classification.fan_type !== tempProfile.fanType) {
        console.log(
          `🎯 [Orchestrator] Fan Type changed from '${tempProfile.fanType}' to '${classification.fan_type}' (Confidence: ${classification.confidence})`
        );
        tempProfile.fanType = classification.fan_type;
        tempProfile.fanTypeConfidence = classification.confidence;
        tempProfile.emotionScore = classification.emotion_score;

        // Tính toán lại Flirt Level sau khi đã xác định/cập nhật được Fan Type thực tế
        tempProfile.flirtLevel = determineFlirtLevel({
          stage: tempProfile.stage,
          fanType: tempProfile.fanType,
          emotionScore: tempProfile.emotionScore,
          flirtLevel: fanProfile.flirtLevel,
        });
      } else {
        console.log(`🎯 [Orchestrator] Fan Type confirmed as '${tempProfile.fanType}' (No change)`);
      }

      if (classification.usage) {
        promptTokens += classification.usage.promptTokens;
        completionTokens += classification.usage.completionTokens;
      }
    }

    // 4. Quyết định hành động tiếp theo (Decision Engine) & Xác định chiến lược (Response Strategy)
    let action = decideAction(tempProfile);
    tempProfile.nextAction = action;
    const strategy = determineStrategy(tempProfile.fanType, tempProfile.stage);

    // 4.5 Áp dụng Link Rate Limiter (Bộ kiểm soát tần suất gửi link bảo vệ tài khoản)
    let link: string | null = null;
    if (action === 'send_link') {
      const linkSafety = checkLinkRateLimit(tempProfile);
      if (!linkSafety.isSafe) {
        console.warn(`⚠️ [Orchestrator] Link rate limit exceeded. Demoting 'send_link' to 'continue'. Reason: ${linkSafety.violation?.detail}`);
        action = 'continue';
        tempProfile.nextAction = 'continue';
      } else {
        link = 'https://exclusive.com/sign-up';
        tempProfile.linkSentCount += 1;
        tempProfile.lastLinkSentAt = new Date();
        console.log(`🔒 [Orchestrator] Sending link to fan approved. linkSentCount: ${tempProfile.linkSentCount}`);
      }
    }

    // Tăng số lượng tin nhắn tương tác trong profile lên 1
    tempProfile.messageCount += 1;

    let rawReply = '';
    let emotionScoreAfter = tempProfile.emotionScore;

    // 5. Objection Handling - Early Intercept (Xử lý các tin nhắn phản đối bám sát Playbook 2.0)
    console.log(`🔍 [Orchestrator] Running Objection Handler for message...`);
    const objectionResult = await detectAndHandleObjection(params.messageText, tempProfile, link);

    if (objectionResult) {
      console.log(`⚠️ [Orchestrator] Objection detected: '${objectionResult.objectionType}'. Intercepting and responding...`);
      rawReply = objectionResult.reply;
      action = objectionResult.action;
      tempProfile.nextAction = action;

      // Cập nhật objectionsSeen từ kết quả của Objection Handler
      if (objectionResult.updatedProfile.objectionsSeen) {
        tempProfile.objectionsSeen = objectionResult.updatedProfile.objectionsSeen;
      }

      if (objectionResult.usage) {
        promptTokens += objectionResult.usage.promptTokens;
        completionTokens += objectionResult.usage.completionTokens;
      }
      modelUsed = objectionResult.modelUsed || 'llama-3.1-8b-instant';
    } else {
      // 6. Response Generator - LLM-based Generation if no objection
      console.log(`🤖 [Orchestrator] Generating response via Response Generator...`);
      
      const mappedRecentMessages = updatedMessages.map((msg) => ({
        role: msg.role === 'you' ? 'agent' as const : 'fan' as const,
        content: msg.content,
      }));

      const genResult = await generateResponse({
        fanProfile: tempProfile,
        recentMessages: mappedRecentMessages,
        incomingMessage: params.messageText,
        strategy,
        decision: {
          action,
          strategy,
          shouldSendLink: action === 'send_link',
          linkToSend: link,
          flirtLevelTarget: tempProfile.flirtLevel
        },
        contextSummary: tempProfile.lastSummary ? (tempProfile.lastSummary as any) : undefined
      });

      if (genResult.data) {
        rawReply = genResult.data.reply;
        action = genResult.data.action;
        tempProfile.nextAction = action;

        if (genResult.data.update_fan_type) {
          tempProfile.fanType = genResult.data.update_fan_type;
        }
        if (genResult.data.update_emotion_score !== undefined) {
          tempProfile.emotionScore = genResult.data.update_emotion_score;
          emotionScoreAfter = genResult.data.update_emotion_score;
        }
        
        if (genResult.usage) {
          promptTokens += genResult.usage.promptTokens;
          completionTokens += genResult.usage.completionTokens;
        }
        modelUsed = genResult.modelUsed || 'Rule-based-Phase-1';
      } else {
        // Fallback to Rule-based template
        rawReply = getTemplateResponse(tempProfile.fanType, tempProfile.stage, link);
        modelUsed = 'Rule-based-Phase-1';
      }
    }

    // 7. Kiểm tra và lọc từ khóa nhạy cảm qua Safety & Compliance Checker
    const safetyCheck = checkSafety(rawReply);
    const reply = safetyCheck.sanitizedReply;
    const safetyViolations = safetyCheck.violations;

    // 8. Tính toán thời gian trì hoãn phản hồi ngẫu nhiên (Reply Delay)
    const delay = calculateDelay(tempProfile);
    console.log(`⏱️ [Orchestrator] Calculated delay: ${delay / 1000}s (${delay / 60000} mins)`);

    // 9. Lưu trữ / Cập nhật trạng thái mới nhất của FanProfile xuống Database
    const savedProfile = await upsertFanProfile({
      conversationId: params.conversationId,
      workspaceId: params.workspaceId,
      platformUserId: params.platformUserId,
      fanType: tempProfile.fanType,
      fanTypeConfidence: tempProfile.fanTypeConfidence,
      stage: tempProfile.stage,
      riskLevel: tempProfile.riskLevel,
      nextAction: tempProfile.nextAction,
      messageCount: tempProfile.messageCount,
      linkSentCount: tempProfile.linkSentCount,
      lastLinkSentAt: tempProfile.lastLinkSentAt,
      flirtLevel: tempProfile.flirtLevel,
      emotionScore: tempProfile.emotionScore,
      emotionTrend: tempProfile.emotionTrend,
      objectionsSeen: tempProfile.objectionsSeen,
    });

    if (!savedProfile) {
      throw new Error(`[Orchestrator] Failed to save updated FanProfile in database for conversation: ${params.conversationId}`);
    }

    // Đo lường latency
    latencyMs = Date.now() - pipelineStart;
    const abTestVariant = Math.random() < 0.5 ? 'A' : 'B';
    const promptSummary = `Incoming: "${params.messageText}" | Action: ${action} | Stage: ${savedProfile.stage} | FanType: ${savedProfile.fanType}`;

    // 10. Ghi log đầy đủ AgentLogData sau mỗi reply (Yêu cầu T153)
    let aiLogId = '';
    try {
      const createdLog = await db.aIReplyLog.create({
        data: {
          messageId: params.messageId,
          prompt: promptSummary,
          response: reply,
          model: modelUsed,
          status: 'suggested',
          fanType: savedProfile.fanType,
          stage: savedProfile.stage,
          strategy,
          action,
          emotionScoreBefore,
          emotionScoreAfter,
          riskLevel: savedProfile.riskLevel,
          safetyViolations: safetyViolations as any,
          promptTokens,
          completionTokens,
          latencyMs,
          abTestVariant,
        },
      });
      aiLogId = createdLog.id;
      console.log(`📊 [Orchestrator] AI Reply Log created successfully with ID: ${aiLogId} | Model: ${modelUsed} | Latency: ${latencyMs}ms | Tokens: P=${promptTokens} C=${completionTokens}`);
    } catch (logErr) {
      console.error('⚠️ [Orchestrator] Non-blocking error: Failed to create AI Reply Log in DB:', logErr);
      aiLogId = crypto.randomUUID();
    }

    console.log(`✅ [Orchestrator] AI Pipeline executed successfully. Action decided: ${action}`);

    // 11. Trả về kết quả đầu ra
    return {
      reply,
      action,
      link,
      delay,
      updatedProfile: savedProfile,
      aiLogId,
    };
  } catch (error) {
    console.error('❌ [Orchestrator] Error occurred in AI Agent Pipeline Orchestrator:', error);
    throw error;
  }
}
