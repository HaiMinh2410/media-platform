// scripts/test-ab-test.ts
//
// Script kiểm thử liên thông cho Nhiệm vụ T163 — Thử nghiệm A/B tuần tự,
// định tuyến prompt, thu thập log phân rã, và tự động thăng cấp prompt thắng cuộc.
//

import { db } from '../src/lib/db';
import { generateResponse } from '../src/application/ai-agent/response-generator';
import { evaluateABTest, promoteWinnerIfAny } from '../src/application/ai-agent/ab-test-manager';
import type { FanProfile, ResponseStrategy } from '../src/domain/types/ai-agent';

async function runABTestSimulation() {
  console.log(`\n🧪 Starting T163 A/B Testing simulation...`);

  // 1. Tìm một Workspace thực tế trong DB để chạy test
  const workspace = await db.workspace.findFirst({
    select: { id: true, name: true, settings: true }
  });

  if (!workspace) {
    console.error(`❌ No workspaces found in database. Please run seed first!`);
    return;
  }

  const workspaceId = workspace.id;
  console.log(`🔍 Using Workspace: "${workspace.name}" (${workspaceId})`);

  // Lưu cấu hình cài đặt gốc để khôi phục sau khi chạy thử nghiệm
  const originalSettings = workspace.settings;

  try {
    // 2. Thiết lập cấu hình A/B Testing mô phỏng vào settings của Workspace
    console.log(`\n⚙️  Setting up mock active A/B testing configuration...`);
    const mockABTestConfig = {
      enabled: true,
      variant_a_prompt: 'SYSTEM PROMPT VARIANT A (Default Persona): You are sweet and polite.',
      variant_b_prompt: 'SYSTEM PROMPT VARIANT B (Super Flirty Persona): You are super cute, flirty, and use romantic emojis ❤️.',
      variant_b_model: 'llama-3.1-8b-instant', // Thử nghiệm model 8B cho B
      started_at: new Date().toISOString(),
      winner_selected: null,
    };

    const newSettings = {
      ...(workspace.settings as any || {}),
      ab_test: mockABTestConfig,
    };

    await db.workspace.update({
      where: { id: workspaceId },
      data: { settings: newSettings }
    });
    console.log(`✅ Mock A/B Testing configuration saved successfully!`);

    // 3. Khởi tạo fan profile giả lập để test luồng sinh phản hồi (Response Generation)
    const mockProfile: FanProfile = {
      id: 'mock-ab-fan-profile-id',
      conversationId: 'mock-ab-conversation-id',
      workspaceId: workspaceId,
      platformUserId: 'mock_ab_user_123',
      fanType: 'Luy',
      fanTypeConfidence: 0.9,
      stage: 'G2',
      riskLevel: 'low',
      nextAction: 'continue',
      messageCount: 5,
      dayCount: 5,
      linkSentCount: 0,
      lastLinkSentAt: null,
      flirtLevel: 2,
      emotionScore: 0.75,
      emotionTrend: 'stable',
      purchaseHistory: [],
      objectionsSeen: [],
      keyInsights: [],
      notes: 'Testing A/B routing.',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSummary: null,
    };

    const mockMessages = [
      { role: 'fan' as const, content: 'Anh nhớ em nhiều lắm á!' }
    ];

    console.log(`\n💬 Testing A/B prompt routing for Variant A...`);
    const resA = await generateResponse({
      fanProfile: mockProfile,
      recentMessages: mockMessages,
      incomingMessage: 'Anh nhớ em nhiều lắm á!',
      strategy: 'EmotionalBanking',
      decision: {
        action: 'continue',
        strategy: 'EmotionalBanking',
        shouldSendLink: false,
        linkToSend: null,
        flirtLevelTarget: 2
      },
      abTestVariant: 'A'
    });
    console.log(`✅ Variant A response successfully created using system prompt A!`);

    console.log(`\n💬 Testing A/B prompt routing for Variant B...`);
    const resB = await generateResponse({
      fanProfile: mockProfile,
      recentMessages: mockMessages,
      incomingMessage: 'Anh nhớ em nhiều lắm á!',
      strategy: 'EmotionalBanking',
      decision: {
        action: 'continue',
        strategy: 'EmotionalBanking',
        shouldSendLink: false,
        linkToSend: null,
        flirtLevelTarget: 3
      },
      abTestVariant: 'B'
    });
    console.log(`✅ Variant B response successfully created using custom system prompt B!`);

    // 4. Giả lập hội thoại và tạo một vài bản ghi log thử nghiệm của cả 2 nhóm (AIReplyLog)
    console.log(`\n📊 Creating mock conversational AI Reply Logs for Variant A & B in database...`);

    // Lấy một conversation thực tế để gán làm khóa ngoại cho log
    const realConv = await db.conversation.findFirst({
      select: { id: true, messages: { select: { id: true }, take: 1 } }
    });

    if (!realConv || realConv.messages.length === 0) {
      console.warn(`⚠️  No conversations/messages found to attach mock logs. Creating a temporary message...`);
      return;
    }

    const messageId = realConv.messages[0].id;
    const conversationId = realConv.id;

    // Cập nhật FanProfile thực tế tương ứng với conversation để kiểm thử đối sánh mua hàng
    await db.fanProfile.upsert({
      where: { conversation_id: conversationId },
      update: {
        emotion_score: 0.8,
        purchase_history: JSON.stringify([
          { order_id: 'ord_mock_ab_1', amount: 350000, created_at: new Date().toISOString() }
        ])
      },
      create: {
        conversation_id: conversationId,
        workspace_id: workspaceId,
        platform_user_id: 'user_mock_ab_test_active',
        fan_type: 'Luy',
        stage: 'G2',
        emotion_score: 0.8,
        purchase_history: JSON.stringify([
          { order_id: 'ord_mock_ab_1', amount: 350000, created_at: new Date().toISOString() }
        ])
      }
    });

    // Tạo logs giả lập cho Variant A (Chỉ số kém hơn)
    const logA = await db.aIReplyLog.create({
      data: {
        messageId: messageId,
        prompt: 'Simulated input A',
        response: 'Simulated output A',
        model: 'llama-3.1-8b-instant',
        status: 'suggested',
        fanType: 'Luy',
        stage: 'G2',
        strategy: 'EmotionalBanking',
        action: 'continue',
        emotionScoreBefore: 0.5,
        emotionScoreAfter: 0.55, // tăng rất ít
        riskLevel: 'low',
        safetyViolations: [],
        promptTokens: 120,
        completionTokens: 45,
        latencyMs: 150,
        abTestVariant: 'A',
      }
    });

    // Tạo logs giả lập cho Variant B (Chỉ số vượt trội rực rỡ!)
    const logB = await db.aIReplyLog.create({
      data: {
        messageId: messageId,
        prompt: 'Simulated input B',
        response: 'Simulated output B',
        model: 'llama-3.1-8b-instant',
        status: 'suggested',
        fanType: 'Luy',
        stage: 'G2',
        strategy: 'EmotionalBanking',
        action: 'continue',
        emotionScoreBefore: 0.5,
        emotionScoreAfter: 0.88, // tăng vượt trội
        riskLevel: 'low',
        safetyViolations: [],
        promptTokens: 130,
        completionTokens: 50,
        latencyMs: 160,
        abTestVariant: 'B',
      }
    });

    console.log(`✅ Simulated logs registered in database!`);

    // 5. Chạy đánh giá đối sánh thủ công A/B (Min sample size = 1 để kích hoạt khớp nhanh)
    console.log(`\n📈 Running performance evaluation & automated promotion check...`);
    const evaluation = await evaluateABTest(workspaceId, 1);
    console.log(`📊 Evaluation Results:`);
    console.log(JSON.stringify(evaluation, null, 2));

    console.log(`\n🏆 Promoting the winner & updating default prompt settings...`);
    const promotionResult = await promoteWinnerIfAny(workspaceId, 1);
    console.log(`📊 Promotion Result Snapshot:`);
    console.log(JSON.stringify(promotionResult, null, 2));

    // Kiểm tra cấu hình settings mới của Workspace xem prompt B đã được lưu làm prompt mặc định (A) hay chưa
    const updatedWorkspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true }
    });
    console.log(`\n🧐 Final Updated Workspace settings:`);
    console.log(JSON.stringify(updatedWorkspace?.settings, null, 2));

    // Dọn dẹp logs thử nghiệm giả lập trong database
    console.log(`\n🧹 Cleaning up mock test resources in database...`);
    await db.aIReplyLog.deleteMany({
      where: { id: { in: [logA.id, logB.id] } }
    });
    console.log(`✅ Simulated logs cleaned successfully.`);

  } finally {
    // Khôi phục settings ban đầu của Workspace để không ảnh hưởng dữ liệu thực tế
    console.log(`\n🔄 Restoring original Workspace settings...`);
    await db.workspace.update({
      where: { id: workspaceId },
      data: { settings: originalSettings || {} }
    });
    console.log(`✅ Original settings successfully restored!`);
  }

  console.log(`\n🌟 T163 simulation completed successfully! 🌟\n`);
}

runABTestSimulation().catch((err) => {
  console.error(`❌ Simulation failed with error:`, err);
});
