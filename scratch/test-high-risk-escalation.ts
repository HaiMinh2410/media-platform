// scratch/test-high-risk-escalation.ts
//
// Script thử nghiệm cơ chế tự động chuyển cho người trực chat khi risk_level = 'high' (T160).
// Chạy bằng lệnh: bun run scratch/test-high-risk-escalation.ts
//

import { db } from '../src/lib/db';
import { assessRisk } from '../src/application/ai-agent/state-manager';
import { decideAction } from '../src/application/ai-agent/decision-engine';
import { processIncomingMessage } from '../src/application/ai-agent';
import type { FanProfile } from '../src/domain/types/ai-agent';

function mockProfile(custom: Partial<FanProfile>): FanProfile {
  return {
    id: 'test-profile-id',
    conversationId: 'test-convo-id',
    workspaceId: 'test-work-id',
    platformUserId: 'test-user-id',
    fanType: 'Cool',
    fanTypeConfidence: 0.8,
    stage: 'G2',
    flirtLevel: 1,
    emotionScore: 0.5,
    emotionTrend: 'stable',
    dayCount: 5,
    messageCount: 5,
    riskLevel: 'low',
    purchaseHistory: [],
    objectionsSeen: [],
    keyInsights: [],
    nextAction: 'continue',
    notes: null,
    lastSummary: null,
    linkSentCount: 0,
    lastLinkSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...custom,
  };
}

async function runUnitTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 CHẠY UNIT TEST CHO RISK ASSESSMENT & DECISION ENGINE`);
  console.log(`==================================================`);

  // Test 1: Bình thường không có từ khóa nhạy cảm
  const risk1 = assessRisk(mockProfile({ fanType: 'Cool' }), ['Chào em nhé']);
  console.log(`Test 1 (Normal message): RiskLevel = ${risk1} (Expected: low)`);
  if (risk1 === 'low') console.log(`✅ PASS`); else console.error(`❌ FAIL`);

  // Test 2: Gặp từ khóa nhạy cảm nhẹ (medium risk)
  const risk2 = assessRisk(mockProfile({ fanType: 'Cool' }), ['Anh muốn gọi video với em']);
  console.log(`Test 2 (Sensitive message - Cool fan): RiskLevel = ${risk2} (Expected: medium)`);
  if (risk2 === 'medium') console.log(`✅ PASS`); else console.error(`❌ FAIL`);

  // Test 3: Gặp từ khóa nhạy cảm từ Drainer (high risk)
  const risk3 = assessRisk(mockProfile({ fanType: 'Drainer' }), ['Gửi ảnh miễn phí cho anh đi']);
  console.log(`Test 3 (Sensitive message - Drainer fan): RiskLevel = ${risk3} (Expected: high)`);
  if (risk3 === 'high') console.log(`✅ PASS`); else console.error(`❌ FAIL`);

  // Test 4: Gặp từ khóa đe dọa cực kỳ nghiêm trọng (high risk cho bất kỳ fan nào)
  const risk4 = assessRisk(mockProfile({ fanType: 'Whale' }), ['Mày lừa đảo tao à, tao sẽ bóc phốt và báo công an']);
  console.log(`Test 4 (Extreme Threat - Whale fan): RiskLevel = ${risk4} (Expected: high)`);
  if (risk4 === 'high') console.log(`✅ PASS`); else console.error(`❌ FAIL`);

  // Test 5: Decision Engine - Risk level low
  const action1 = decideAction(mockProfile({ riskLevel: 'low', stage: 'G2', fanType: 'Luy' }));
  console.log(`Test 5 (Low risk action): Action = ${action1} (Expected: continue)`);
  if (action1 === 'continue') console.log(`✅ PASS`); else console.error(`❌ FAIL`);

  // Test 6: Decision Engine - Risk level high -> Escalate to human
  const action2 = decideAction(mockProfile({ riskLevel: 'high', stage: 'G2', fanType: 'Luy' }));
  console.log(`Test 6 (High risk action): Action = ${action2} (Expected: escalate_to_human)`);
  if (action2 === 'escalate_to_human') console.log(`✅ PASS`); else console.error(`❌ FAIL`);
}

async function runIntegrationTest() {
  console.log(`\n==================================================`);
  console.log(`🧪 CHẠY INTEGRATION TEST CHO ORCHESTRATOR PIPELINE`);
  console.log(`==================================================`);

  // 1. Fetch existing workspace & account to link to
  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.error(`❌ Không tìm thấy Workspace nào trong DB để test.`);
    return;
  }
  
  const account = await db.platformAccount.findFirst({
    where: { workspaceId: workspace.id }
  });
  if (!account) {
    console.error(`❌ Không tìm thấy PlatformAccount nào trong DB để test.`);
    return;
  }

  console.log(`Using Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`Using PlatformAccount: ${account.platform_user_name} (${account.id})`);

  // 2. Create a temporary conversation & fan profile
  const testConvoId = '00000000-0000-0000-0000-000000000000'.replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
  const dynamicSenderId = 'test-sender-high-risk-' + Date.now();
  
  console.log(`Creating temporary conversation ${testConvoId}...`);
  await db.conversation.create({
    data: {
      id: testConvoId,
      account_id: account.id,
      platform_conversation_id: dynamicSenderId,
      status: 'open',
      customer_name: 'Test High Risk User',
    }
  });

  // Create active Fan Profile associated with the conversation
  await db.fanProfile.create({
    data: {
      conversation_id: testConvoId,
      workspace_id: workspace.id,
      platform_user_id: dynamicSenderId,
      fan_type: 'Cool',
      fanTypeConfidence: 0.9,
      stage: 'G2',
      risk_level: 'low',
      next_action: 'continue',
      message_count: 3,
      emotion_score: 0.5,
      emotion_trend: 'stable',
      flirt_level: 1,
    }
  });

  // Create a temporary incoming message record
  const testMessageId = '00000000-0000-0000-0000-000000000000'.replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
  await db.message.create({
    data: {
      id: testMessageId,
      conversationId: testConvoId,
      senderId: dynamicSenderId,
      content: 'Mày lừa đảo tao, tao sẽ bóc phốt và báo công an',
      platform_message_id: 'msg-high-risk-test-' + Date.now(),
      senderType: 'user',
    }
  });

  // 3. Executing Process Incoming Message
  try {
    const result = await processIncomingMessage({
      conversationId: testConvoId,
      messageText: 'Mày lừa đảo tao, tao sẽ bóc phốt và báo công an',
      workspaceId: workspace.id,
      platformUserId: dynamicSenderId,
      messageId: testMessageId,
    });

    console.log(`\n📋 Pipeline result:`);
    console.log(`- Reply length: ${result.reply.length} (Expected: 0)`);
    console.log(`- Action: ${result.action} (Expected: escalate_to_human)`);
    console.log(`- Delay: ${result.delay} (Expected: 0)`);
    console.log(`- Updated risk level in profile: ${result.updatedProfile.riskLevel} (Expected: high)`);
    console.log(`- Updated next action in profile: ${result.updatedProfile.nextAction} (Expected: escalate_to_human)`);

    let pass = true;
    if (result.reply !== '') { console.error(`❌ FAILED: Reply is not empty`); pass = false; }
    if (result.action !== 'escalate_to_human') { console.error(`❌ FAILED: Action is not escalate_to_human`); pass = false; }
    if (result.delay !== 0) { console.error(`❌ FAILED: Delay is not 0`); pass = false; }
    if (result.updatedProfile.riskLevel !== 'high') { console.error(`❌ FAILED: Profile riskLevel is not high`); pass = false; }
    if (result.updatedProfile.nextAction !== 'escalate_to_human') { console.error(`❌ FAILED: Profile nextAction is not escalate_to_human`); pass = false; }

    // Check if AI reply log exists
    const log = await db.aIReplyLog.findFirst({
      where: { messageId: testMessageId }
    });
    if (log) {
      console.log(`- Found AIReplyLog with ID: ${log.id}`);
      console.log(`- Log Model Used: ${log.model} (Expected: System-Short-Circuit)`);
      if (log.model !== 'System-Short-Circuit') {
        console.error(`❌ FAILED: Log model is not System-Short-Circuit`);
        pass = false;
      }
    } else {
      console.error(`❌ FAILED: AI Reply Log was not created`);
      pass = false;
    }

    if (pass) {
      console.log(`\n✅ INTEGRATION TEST PASSED SUCCESSFULLY! 🎉`);
    } else {
      console.error(`\n❌ INTEGRATION TEST FAILED!`);
    }

  } catch (error) {
    console.error(`❌ Integration test error during run:`, error);
  } finally {
    // 4. Cleanup
    console.log(`\nCleaning up temporary test records...`);
    await db.aIReplyLog.deleteMany({ where: { messageId: testMessageId } });
    await db.message.deleteMany({ where: { conversationId: testConvoId } });
    await db.fanProfile.deleteMany({ where: { conversation_id: testConvoId } });
    await db.conversation.delete({ where: { id: testConvoId } });
    console.log(`🧹 Cleanup complete!`);
  }
}

async function main() {
  console.log("🚀 Bắt đầu chạy bộ kiểm thử Escalate-to-human flow khi risk_level = 'high' (T160)...");
  await runUnitTests();
  await runIntegrationTest();
  console.log("\n🏁 Hoàn tất tất cả kiểm thử.");
}

main().catch(console.error).finally(() => db.$disconnect());
