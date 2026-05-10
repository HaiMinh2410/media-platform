// scratch/test-flirt-progression.ts
//
// Script thử nghiệm tự động hóa quá trình tăng/giảm flirtLevel (Flirt Level Progression).
// Có thể chạy bằng lệnh: bun run scratch/test-flirt-progression.ts
//

import { determineFlirtLevel } from '../src/application/ai-agent/state-manager';
import type { ConversationStage, FanType, FlirtLevel } from '../src/domain/types/ai-agent';

function runScenario(params: {
  title: string;
  stage: ConversationStage;
  fanType: FanType;
  emotionScore: number;
  currentFlirt: FlirtLevel;
  expectedFlirt: FlirtLevel;
}) {
  console.log(`\n==================================================`);
  console.log(`🧪 Scenario: ${params.title}`);
  console.log(`📋 Input: Stage=${params.stage}, FanType=${params.fanType}, Emotion=${params.emotionScore}, CurrentFlirt=${params.currentFlirt}`);

  const result = determineFlirtLevel({
    stage: params.stage,
    fanType: params.fanType,
    emotionScore: params.emotionScore,
    flirtLevel: params.currentFlirt,
  });

  const success = result === params.expectedFlirt;
  console.log(`📊 Result: Calculated FlirtLevel = ${result} (Expected = ${params.expectedFlirt})`);
  if (success) {
    console.log(`✅ PASSED`);
  } else {
    console.error(`❌ FAILED`);
  }
}

async function main() {
  console.log("🚀 Bắt đầu kiểm thử FlirtLevel progression tự động...");

  // 1. Giai đoạn G1 - Luôn là flirt level 0
  runScenario({
    title: "G1 Stage reset flirt level to 0",
    stage: "G1",
    fanType: "Luy",
    emotionScore: 0.95,
    currentFlirt: 2,
    expectedFlirt: 0,
  });

  // 2. Fan Drainer - Luôn là flirt level 0
  runScenario({
    title: "Energy Drainer reset flirt level to 0 in G2",
    stage: "G2",
    fanType: "Drainer",
    emotionScore: 0.85,
    currentFlirt: 1,
    expectedFlirt: 0,
  });

  // 3. Từ 0 lên 1 (Emotion Score >= 0.55)
  runScenario({
    title: "Progress 0 to 1 when emotion score is high enough",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.60,
    currentFlirt: 0,
    expectedFlirt: 1,
  });

  runScenario({
    title: "Stay at 0 when emotion score is not high enough",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.50,
    currentFlirt: 0,
    expectedFlirt: 0,
  });

  // 4. Từ 1 lên 2 (Emotion Score >= 0.70)
  runScenario({
    title: "Progress 1 to 2 when emotion score >= 0.70",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.75,
    currentFlirt: 1,
    expectedFlirt: 2,
  });

  runScenario({
    title: "Stay at 1 when emotion score is moderate (0.60)",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.60,
    currentFlirt: 1,
    expectedFlirt: 1,
  });

  // 5. Từ 1 xuống 0 (Emotion Score < 0.45)
  runScenario({
    title: "Demote 1 to 0 when emotion score drops < 0.45",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.40,
    currentFlirt: 1,
    expectedFlirt: 0,
  });

  // 6. Từ 2 lên 3 (Emotion Score >= 0.82)
  runScenario({
    title: "Progress 2 to 3 when emotion score >= 0.82",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.85,
    currentFlirt: 2,
    expectedFlirt: 3,
  });

  // 7. Từ 2 xuống 1 (Emotion Score < 0.55)
  runScenario({
    title: "Demote 2 to 1 when emotion score drops < 0.55",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.50,
    currentFlirt: 2,
    expectedFlirt: 1,
  });

  // 8. Từ 3 xuống 2 (Emotion Score < 0.65)
  runScenario({
    title: "Demote 3 to 2 when emotion score drops < 0.65",
    stage: "G2",
    fanType: "Luy",
    emotionScore: 0.60,
    currentFlirt: 3,
    expectedFlirt: 2,
  });

  console.log("\n🏁 Hoàn tất tất cả các scenario kiểm thử.");
}

main().catch(console.error);
