// scratch/test-response-generator.ts
//
// Script thử nghiệm Response Generator độc lập.
// Có thể chạy bằng lệnh: bun run scratch/test-response-generator.ts
//

import { generateResponse } from '../src/application/ai-agent/response-generator';
import type { ResponseGeneratorInput, FanProfile } from '../src/domain/types/ai-agent';

async function runTest() {
  console.log("🚀 Bắt đầu chạy thử nghiệm generateResponse...");

  // Tạo mock fan profile cho một Fan Lụy (Emotional Fan) ở Stage G2
  const mockFanProfile: FanProfile = {
    id: "test-fan-123",
    conversationId: "test-conv-123",
    workspaceId: "test-workspace-123",
    platformUserId: "test-user-123",
    fanType: "Luy",
    fanTypeConfidence: 0.85,
    stage: "G2",
    flirtLevel: 1,
    emotionScore: 0.75,
    emotionTrend: "increasing",
    dayCount: 35,
    messageCount: 15,
    riskLevel: "low",
    purchaseHistory: [],
    objectionsSeen: [],
    keyInsights: ["hay online buổi tối", "thích khen hình của em"],
    nextAction: "continue",
    notes: "Fan rất thân thiện và nhiệt tình",
    linkSentCount: 0,
    lastLinkSentAt: null,
    lastSummary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const input: ResponseGeneratorInput = {
    fanProfile: mockFanProfile,
    recentMessages: [
      { role: "fan", content: "Chào em nhen, tối nay em có đi đâu chơi hông?" },
      { role: "agent", content: "Dạ em mới làm việc xong nè, chuẩn bị nghỉ ngơi thôi ạ. Anh hôm nay có bận lắm hông?" },
    ],
    incomingMessage: "Anh cũng vừa xong việc nè. Thấy mệt mỏi mà vô nhắn tin với em tự dưng thấy hết mệt liền hà. Nhớ em quá!",
    strategy: "EmotionalBanking",
    decision: {
      action: "continue",
      strategy: "EmotionalBanking",
      shouldSendLink: false,
      linkToSend: null,
      flirtLevelTarget: 2,
    },
  };

  // Chúng ta sẽ chạy thử generateResponse
  // Để tránh lỗi nếu GROQ_API_KEY chưa được thiết lập, chúng ta bọc trong try/catch
  const result = await generateResponse(input);
  
  console.log("\n📊 KẾT QUẢ THỬ NGHIỆM:");
  console.log(JSON.stringify(result, null, 2));
}

runTest().catch(console.error);
