// scratch/test-link-rate-limiter.ts
//
// Script kiểm thử bộ kiểm soát tần suất gửi link (Link Rate Limiter) của AI Agent
//

import { checkLinkRateLimit } from '../src/application/ai-agent/safety-checker';
import type { FanProfile } from '../src/domain/types/ai-agent';

console.log("🧪 Testing Link Rate Limiter...\n");

const baseProfile: FanProfile = {
  id: "test-fan",
  conversationId: "test-convo",
  workspaceId: "test-ws",
  platformUserId: "test-user",
  fanType: "Luy",
  fanTypeConfidence: 0.9,
  stage: "G3",
  flirtLevel: 3,
  emotionScore: 0.85,
  emotionTrend: "stable",
  dayCount: 70,
  messageCount: 40,
  riskLevel: "low",
  purchaseHistory: [],
  objectionsSeen: [],
  keyInsights: [],
  nextAction: "continue",
  notes: null,
  linkSentCount: 0,
  lastLinkSentAt: null, // Chưa từng gửi link
  lastSummary: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Kịch bản 1: Gửi link lần đầu tiên (lastLinkSentAt là null)
console.log("----------------------------------------------------------------");
console.log("📌 Kịch bản 1: Gửi link lần đầu tiên");
const res1 = checkLinkRateLimit(baseProfile);
console.log("👉 Kết quả Is Safe:", res1.isSafe); // Kỳ vọng: true
console.log("👉 Chi tiết lỗi:", res1.violation?.detail || "Không có vi phạm");

// Kịch bản 2: Gửi link lại sau 8 ngày (Đã đủ khoảng giãn cách 7 ngày)
console.log("----------------------------------------------------------------");
console.log("📌 Kịch bản 2: Gửi link lại sau 8 ngày");
const eightDaysAgo = new Date();
eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
const profile2: FanProfile = {
  ...baseProfile,
  linkSentCount: 1,
  lastLinkSentAt: eightDaysAgo,
};
const res2 = checkLinkRateLimit(profile2);
console.log("👉 Kết quả Is Safe:", res2.isSafe); // Kỳ vọng: true
console.log("👉 Chi tiết lỗi:", res2.violation?.detail || "Không có vi phạm");

// Kịch bản 3: Gửi link quá sớm chỉ sau 2 ngày (Chưa đủ khoảng giãn cách 7 ngày)
console.log("----------------------------------------------------------------");
console.log("📌 Kịch bản 3: Gửi link quá sớm chỉ sau 2 ngày");
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const profile3: FanProfile = {
  ...baseProfile,
  linkSentCount: 1,
  lastLinkSentAt: twoDaysAgo,
};
const res3 = checkLinkRateLimit(profile3);
console.log("👉 Kết quả Is Safe:", res3.isSafe); // Kỳ vọng: false
console.log("👉 Chi tiết lỗi:", res3.violation?.detail || "Không có vi phạm");
console.log("👉 Mức độ vi phạm (Severity):", res3.violation?.severity || "N/A");
console.log("----------------------------------------------------------------");
