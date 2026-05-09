// src/application/ai-agent/index.ts
//
// Entry point / Orchestrator chính cho AI DM Agent Pipeline — Phase 1 MVP.
// Điều phối toàn bộ vòng lặp xử lý tin nhắn từ nạp ngữ cảnh, phân loại, quyết định hành động,
// tạo nội dung phản hồi, bộ lọc an toàn và tính toán thời gian trì hoãn ngẫu nhiên.

import { retrieveContext } from './context-retriever';
import { determineStage, assessRisk } from './state-manager';
import { classifyFanRuleBased } from './fan-classifier';
import { decideAction } from './decision-engine';
import { getTemplateResponse } from './templates';
import { filterBlacklist, calculateDelay } from './safety-checker';
import { upsertFanProfile } from '@/infrastructure/repositories/fan-profile.repository';
import type { FanProfile, NextAction } from '@/domain/types/ai-agent';

/**
 * Định nghĩa cấu trúc AgentResponse trả về từ orchestrator.
 */
export type AgentResponse = {
  reply: string;               // Tin nhắn mẫu phản hồi đã được lọc sạch từ khóa nhạy cảm
  action: NextAction;          // Hành động tiếp theo quyết định bởi Decision Engine
  link: string | null;         // Liên kết gửi cho khách hàng (VIP/private) nếu hành động là send_link, ngược lại là null
  delay: number;               // Thời gian trì hoãn phản hồi tính bằng miliseconds (ms)
  updatedProfile: FanProfile;  // Trạng thái profile khách hàng sau khi đã cập nhật hoàn chỉnh trong DB
};

/**
 * Hàm điều phối chính (Pipeline Orchestrator) xử lý tin nhắn đầu vào từ khách hàng.
 * Thực thi tuần tự 9 bước xử lý khép kín nhằm tối ưu chuyển đổi và duy trì an toàn tài khoản.
 *
 * @param params Các tham số nhận từ webhook worker bao gồm: conversationId, messageText, workspaceId, platformUserId
 */
export async function processIncomingMessage(params: {
  conversationId: string;
  messageText: string;
  workspaceId: string;
  platformUserId: string;
}): Promise<AgentResponse> {
  console.log(`\n🌀 [Orchestrator] Starting AI Pipeline for Conversation: ${params.conversationId}`);
  console.log(`💬 [Orchestrator] Incoming message: "${params.messageText}"`);

  try {
    // 1. Nạp ngữ cảnh (Retrieve Context)
    const context = await retrieveContext(params.conversationId);
    const { fanProfile, recentMessages } = context;

    // Cập nhật tin nhắn hiện tại vào mảng recentMessages để các bộ phân loại phân tích chính xác nhất
    const updatedMessages = [
      ...recentMessages,
      { role: 'fan' as const, content: params.messageText }
    ];

    // 2. Xác định Giai đoạn (Stage) & Đánh giá Rủi ro (Risk Level) từ StateManager
    const currentStage = determineStage(fanProfile);
    
    // Thu thập nội dung tin nhắn của fan từ lịch sử cập nhật để phân tích rủi ro
    const fanMessageContents = updatedMessages
      .filter((msg) => msg.role === 'fan')
      .map((msg) => msg.content);
    
    const currentRisk = assessRisk(fanProfile, fanMessageContents);

    // Chuẩn bị profile tạm thời chứa các trạng thái vừa tính toán
    const tempProfile: FanProfile = {
      ...fanProfile,
      stage: currentStage,
      riskLevel: currentRisk,
    };

    // 3. Phân loại đối tượng Fan (Fan Classification) nếu trạng thái hiện tại là Unknown
    if (tempProfile.fanType === 'Unknown') {
      console.log(`🔍 [Orchestrator] Fan type is 'Unknown'. Running fast rule-based classification...`);
      const classification = classifyFanRuleBased(updatedMessages);
      
      if (classification.fan_type !== 'Unknown') {
        tempProfile.fanType = classification.fan_type;
        tempProfile.fanTypeConfidence = classification.confidence;
        tempProfile.emotionScore = classification.emotion_score;
        
        console.log(
          `🎯 [Orchestrator] Fan classified as '${classification.fan_type}' with confidence ${classification.confidence}`
        );
      }
    }

    // 4. Quyết định hành động tiếp theo (Decision Engine)
    const action = decideAction(tempProfile);
    tempProfile.nextAction = action;

    // 5. Cấp link phù hợp và gọi getTemplateResponse
    // Nếu quyết định hành động là 'send_link', cấp link vip đăng ký tài khoản độc quyền của hệ thống
    const link = action === 'send_link' ? 'https://exclusive.com/sign-up' : null;

    // Nếu thực hiện gửi liên kết, tăng chỉ số đếm số lần gửi link và đánh dấu mốc thời gian gửi gần nhất
    if (action === 'send_link') {
      tempProfile.linkSentCount += 1;
      tempProfile.lastLinkSentAt = new Date();
      console.log(`🔒 [Orchestrator] Sending link to fan. linkSentCount: ${tempProfile.linkSentCount}`);
    }

    // Tăng số lượng tin nhắn tương tác trong profile lên 1
    tempProfile.messageCount += 1;

    // Gọi template engine sinh ra câu trả lời ngẫu nhiên sinh động đã được gắn link nếu có
    const rawTemplateResponse = getTemplateResponse(tempProfile.fanType, tempProfile.stage, link);

    // 6. Kiểm tra và lọc từ khóa nhạy cảm qua Safety & Compliance Checker
    const reply = filterBlacklist(rawTemplateResponse);

    // 7. Tính toán thời gian trì hoãn phản hồi ngẫu nhiên (Reply Delay)
    const delay = calculateDelay(tempProfile);

    console.log(`⏱️ [Orchestrator] Calculated delay: ${delay / 1000}s (${delay / 60000} mins)`);

    // 8. Lưu trữ / Cập nhật trạng thái mới nhất của FanProfile xuống Database
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
    });

    if (!savedProfile) {
      throw new Error(`[Orchestrator] Failed to save updated FanProfile in database for conversation: ${params.conversationId}`);
    }

    console.log(`✅ [Orchestrator] AI Pipeline executed successfully. Action decided: ${action}`);

    // 9. Trả về kết quả đầu ra
    return {
      reply,
      action,
      link,
      delay,
      updatedProfile: savedProfile,
    };
  } catch (error) {
    console.error('❌ [Orchestrator] Error occurred in AI Agent Pipeline Orchestrator:', error);
    throw error;
  }
}
