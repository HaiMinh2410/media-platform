// scratch/test-reclassification.ts
//
// Script thử nghiệm cơ chế tự động phân loại lại Fan (Fan Type Reclassification - T159)
// dựa trên sự thay đổi hành vi rõ rệt (Behavioral Shifts).
// Chạy bằng lệnh: bun run scratch/test-reclassification.ts
//

import { shouldReclassifyFan, classifyFanRuleBased } from '../src/application/ai-agent/fan-classifier';
import type { FanProfile, FanType, ConversationStage } from '../src/domain/types/ai-agent';

function mockProfile(custom: Partial<FanProfile>): FanProfile {
  return {
    id: 'test-profile-id',
    conversationId: 'test-convo-id',
    workspaceId: 'test-work-id',
    platformUserId: 'test-user-id',
    fanType: 'Unknown',
    fanTypeConfidence: 0.0,
    stage: 'G2',
    flirtLevel: 0,
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

function runScenario(params: {
  title: string;
  profile: FanProfile;
  incomingMessage: string;
  expectedShouldTrigger: boolean;
  expectedTypeShift?: FanType;
  priorMessages?: string[];
}) {
  console.log(`\n==================================================`);
  console.log(`🧪 Scenario: ${params.title}`);
  console.log(`📋 Input Profile: FanType=${params.profile.fanType}, MessageCount=${params.profile.messageCount}, Emotion=${params.profile.emotionScore}`);
  console.log(`💬 Incoming message: "${params.incomingMessage}"`);

  const updatedMessages = [
    { role: 'you' as const, content: 'Chào anh yêu ạ!' },
    { role: 'fan' as const, content: params.incomingMessage }
  ];

  const shouldTrigger = shouldReclassifyFan(params.profile, updatedMessages);
  console.log(`📊 Detection Result: shouldReclassifyFan = ${shouldTrigger} (Expected = ${params.expectedShouldTrigger})`);
  
  if (shouldTrigger === params.expectedShouldTrigger) {
    console.log(`✅ DETECTION PASSED`);
  } else {
    console.error(`❌ DETECTION FAILED`);
  }

  if (shouldTrigger) {
    const defaultPrior = ['Bắt đầu hội thoại', 'Hội thoại tiếp diễn'];
    const actualPrior = params.priorMessages || defaultPrior;

    // Thử chạy rule-based classifier để kiểm chứng hướng dịch chuyển
    const classification = classifyFanRuleBased([
      { role: 'fan' as const, content: actualPrior[0] },
      { role: 'fan' as const, content: actualPrior[1] },
      { role: 'fan' as const, content: params.incomingMessage }
    ]);
    
    console.log(`🔄 Reclassification Outcome: New Type = ${classification.fan_type} (Expected = ${params.expectedTypeShift || 'Any'})`);
    console.log(`📝 Reasoning: ${classification.reasoning}`);
    if (params.expectedTypeShift && classification.fan_type === params.expectedTypeShift) {
      console.log(`✅ TRANSITION PASSED`);
    } else if (params.expectedTypeShift) {
      console.error(`❌ TRANSITION FAILED (New Type: ${classification.fan_type}, Expected: ${params.expectedTypeShift})`);
    }
  }
}

async function main() {
  console.log("🚀 Bắt đầu kiểm thử cơ chế Phân loại lại Fan (T159)...");

  // 1. Giai đoạn Unknown: Luôn luôn kích hoạt phân loại
  runScenario({
    title: "Unknown profile always triggers classification",
    profile: mockProfile({ fanType: 'Unknown' }),
    incomingMessage: "Chào em, em khỏe không?",
    expectedShouldTrigger: true,
  });

  // 2. Chuyển từ Cool/Luy sang Whale (Hỏi giá/mua hàng)
  runScenario({
    title: "Shift from Cool to Whale via buying intent",
    profile: mockProfile({ fanType: 'Cool', emotionScore: 0.4 }),
    incomingMessage: "Bên em có bảng giá gói private không, anh muốn mua gói tháng?",
    expectedShouldTrigger: true,
    expectedTypeShift: 'Whale',
  });

  // 3. Chuyển từ Luy sang Drainer (Đòi nội dung miễn phí liên tục)
  runScenario({
    title: "Shift from Luy to Drainer via constant freebie demands",
    profile: mockProfile({ fanType: 'Luy', emotionScore: 0.8 }),
    incomingMessage: "Cho xin hình free đi em ơi, gửi ảnh vú to qua đây nhé",
    expectedShouldTrigger: true,
    expectedTypeShift: 'Drainer',
  });

  // 4. Chuyển từ Cool sang Luy (Cool warming up)
  runScenario({
    title: "Shift from Cool to Luy when fan becomes highly warm & interactive",
    profile: mockProfile({ fanType: 'Cool', emotionScore: 0.8 }),
    incomingMessage: "Hihi em nói chuyện ngọt ngào quá đi hà ❤️🥰!",
    expectedShouldTrigger: true,
    expectedTypeShift: 'Luy',
  });

  // 5. Chuyển từ Luy sang Cool (Active fan cooling down)
  runScenario({
    title: "Shift from Luy to Cool when fan becomes cold & silent",
    profile: mockProfile({ fanType: 'Luy', emotionScore: 0.35 }),
    incomingMessage: "ok em",
    expectedShouldTrigger: true,
    expectedTypeShift: 'Cool',
    priorMessages: ["ừ", "ok"]
  });

  // 6. Định kỳ kiểm tra (Periodic Reclassification Check mỗi 15 tin nhắn)
  runScenario({
    title: "Periodic check at messageCount 15",
    profile: mockProfile({ fanType: 'Cool', messageCount: 15, emotionScore: 0.5 }),
    incomingMessage: "Anh bận tí nha em",
    expectedShouldTrigger: true,
  });

  runScenario({
    title: "No trigger for typical message if no shift and not periodic (messageCount 14)",
    profile: mockProfile({ fanType: 'Cool', messageCount: 14, emotionScore: 0.5 }),
    incomingMessage: "Anh bận tí nha em",
    expectedShouldTrigger: false,
  });

  console.log("\n🏁 Hoàn tất tất cả các kịch bản kiểm thử T159.");
}

main().catch(console.error);
