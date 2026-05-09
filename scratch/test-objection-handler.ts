// scratch/test-objection-handler.ts
//
// Script thử nghiệm Objection Handler độc lập.
// Chạy bằng lệnh: bun run scratch/test-objection-handler.ts
//

import { detectAndHandleObjection } from '../src/application/ai-agent/objection-handler';
import type { FanProfile } from '../src/domain/types/ai-agent';

async function runTest() {
  console.log("🚀 Bắt đầu thử nghiệm Objection Handler...");

  const mockProfile: FanProfile = {
    id: "test-fan-456",
    conversationId: "test-conv-456",
    workspaceId: "test-workspace-456",
    platformUserId: "test-user-456",
    fanType: "Cool",
    fanTypeConfidence: 0.7,
    stage: "G2",
    flirtLevel: 1,
    emotionScore: 0.6,
    emotionTrend: "stable",
    dayCount: 15,
    messageCount: 8,
    riskLevel: "low",
    purchaseHistory: [],
    objectionsSeen: [],
    keyInsights: [],
    nextAction: "continue",
    notes: "",
    linkSentCount: 0,
    lastLinkSentAt: null,
    lastSummary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testMessages = [
    {
      label: "TEST 1: Đòi xem ảnh miễn phí (want_free)",
      text: "Gửi anh mấy cái hình nóng xem thử đi em ơi, được thì anh mua gói của em chứ nói mồm ai tin."
    },
    {
      label: "TEST 2: Than giá đắt quá (too_expensive)",
      text: "Ủa em ơi gói này tận mấy trăm ngàn á hả, sao đắt quá dị em bớt cho anh xíu đi."
    },
    {
      label: "TEST 3: Lo lắng lộ thông tin bảo mật (privacy_concern)",
      text: "Vào trong đó thanh toán rồi xem hình ảnh có bị lộ thông tin cá nhân hay lộ tin nhắn của anh ra ngoài hông em?"
    }
  ];

  for (const test of testMessages) {
    console.log(`\n--------------------------------------------------`);
    console.log(`👉 [Run] ${test.label}`);
    console.log(`💬 Fan gửi: "${test.text}"`);

    const result = await detectAndHandleObjection(test.text, mockProfile, "https://exclusive.com/special-link");

    if (result) {
      console.log(`✅ Phát hiện Objection: '${result.objectionType}'`);
      console.log(`📝 AI Phản hồi: "${result.reply}"`);
      console.log(`⚙️ Quyết định Action: '${result.action}'`);
      console.log(`🗃️ Cập nhật Profile objectionsSeen:`, result.updatedProfile.objectionsSeen);
    } else {
      console.log(`❌ Không phát hiện bất kỳ phản đối nào trong tin nhắn này.`);
    }
  }
}

runTest().catch(console.error);
