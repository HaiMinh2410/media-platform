// src/application/ai-agent/ab-test-manager.ts
//
// A/B Test Manager - Phase 3 Autonomous + Learning
// Tự động phân tích, so sánh hiệu năng giữa hai nhóm thử nghiệm Variant A và B.
// Lựa chọn Winner dựa trên số mẫu tối thiểu, tỷ lệ chuyển đổi, chỉ số cảm xúc và an toàn.
//

import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export interface ABTestMetrics {
  totalConversations: number;
  purchasedConversations: number;
  conversionRate: number;
  avgEmotionScore: number;
  flagIncidents: number;
  escalationCount: number;
}

export interface ABTestResult {
  workspaceId: string;
  metricsA: ABTestMetrics;
  metricsB: ABTestMetrics;
  meetsSample: boolean;
  winner: 'A' | 'B' | 'NONE';
  reason: string;
  evaluatedAt: Date;
}

/**
 * Ghi vết quyết định của A/B test vào file lịch sử bộ nhớ dự án
 */
export function logABTestDecision(decision: any) {
  try {
    const logPath = path.resolve(process.cwd(), '.antigravity/memory/ab_test_decisions.jsonl');
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(logPath, JSON.stringify({ ...decision, logged_at: new Date().toISOString() }) + '\n');
    console.log(`📝 [ABTestManager] Appended decision log to .antigravity/memory/ab_test_decisions.jsonl`);
  } catch (err) {
    console.error('⚠️ [ABTestManager] Failed to write A/B test decision log to file:', err);
  }
}

/**
 * Thực hiện đối sánh hiệu năng chi tiết giữa Variant A và Variant B trong 7 ngày qua
 *
 * @param workspaceId ID của workspace cần phân tích
 * @param minSampleSize Cỡ mẫu hội thoại tối thiểu ở mỗi nhóm để xác định chiến thắng
 */
export async function evaluateABTest(
  workspaceId: string,
  minSampleSize = 50
): Promise<ABTestResult> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log(`📊 [ABTestManager] Starting evaluation for Workspace ${workspaceId} (Min sample: ${minSampleSize})`);

  // 1. Lấy toàn bộ AI Reply Log trong 7 ngày qua của Workspace
  const logs = await db.aIReplyLog.findMany({
    where: {
      created_at: { gte: oneWeekAgo },
      message: {
        conversation: {
          platform_accounts: {
            workspaceId: workspaceId,
          },
        },
      },
    },
    include: {
      message: {
        select: {
          conversationId: true,
        },
      },
    },
  });

  // 2. Lấy toàn bộ Fan Profiles thuộc workspace để check purchase history và cảm xúc hiện tại
  const fanProfiles = await db.fanProfile.findMany({
    where: { workspace_id: workspaceId },
    select: {
      conversation_id: true,
      emotion_score: true,
      purchase_history: true,
    },
  });

  const profileMap = new Map(fanProfiles.map((p) => [p.conversation_id, p]));

  // 3. Phân bổ hội thoại và các log theo nhóm Variant A / Variant B
  const variantConversations = {
    A: new Set<string>(),
    B: new Set<string>(),
  };

  const logsByVariant = {
    A: [] as typeof logs,
    B: [] as typeof logs,
  };

  for (const log of logs) {
    const variant = (log.abTestVariant || 'A') as 'A' | 'B';
    logsByVariant[variant].push(log);
    if (log.message?.conversationId) {
      variantConversations[variant].add(log.message.conversationId);
    }
  }

  // Helper tính toán các chỉ số cho từng Variant
  const getMetrics = (variant: 'A' | 'B'): ABTestMetrics => {
    const convIds = Array.from(variantConversations[variant]);
    const totalConvs = convIds.length;

    let purchasedConvsCount = 0;
    let totalEmotion = 0;
    let totalFlagged = 0;
    let totalEscalated = 0;

    // Đếm số lần vi phạm an toàn và chuyển tiếp con người dựa trên logs
    for (const log of logsByVariant[variant]) {
      const violations = log.safetyViolations as any[] || [];
      if (violations.length > 0) {
        totalFlagged++;
      }
      if (log.action === 'escalate_to_human') {
        totalEscalated++;
      }
    }

    // Duyệt qua từng cuộc hội thoại thuộc nhóm để kiểm tra đơn hàng & điểm cảm xúc
    for (const cid of convIds) {
      const profile = profileMap.get(cid);
      if (profile) {
        totalEmotion += profile.emotion_score;

        let hasPurchase = false;
        try {
          const purchases = typeof profile.purchase_history === 'string'
            ? JSON.parse(profile.purchase_history)
            : (profile.purchase_history as any[] || []);

          // Có đơn hàng nào được tạo trong 7 ngày qua không
          hasPurchase = purchases.some((p: any) => {
            const dateStr = p.created_at || p.date;
            if (!dateStr) return false;
            const date = new Date(dateStr);
            return date >= oneWeekAgo;
          });
        } catch {
          // Bỏ qua lỗi parse JSON thô
        }

        if (hasPurchase) {
          purchasedConvsCount++;
        }
      }
    }

    const conversionRate = totalConvs > 0 ? parseFloat((purchasedConvsCount / totalConvs).toFixed(4)) : 0;
    const avgEmotionScore = totalConvs > 0 ? parseFloat((totalEmotion / totalConvs).toFixed(4)) : 0.5;

    return {
      totalConversations: totalConvs,
      purchasedConversations: purchasedConvsCount,
      conversionRate,
      avgEmotionScore,
      flagIncidents: totalFlagged,
      escalationCount: totalEscalated,
    };
  };

  const metricsA = getMetrics('A');
  const metricsB = getMetrics('B');

  // 4. Đối sánh để quyết định Winner
  let winner: 'A' | 'B' | 'NONE' = 'NONE';
  let reason = '';

  const meetsSample = metricsA.totalConversations >= minSampleSize && metricsB.totalConversations >= minSampleSize;

  if (!meetsSample) {
    reason = `Chưa đủ kích cỡ mẫu tối thiểu hàng tuần (Cần tối thiểu ${minSampleSize} cuộc hội thoại cho mỗi nhóm. Hiện tại: Variant A = ${metricsA.totalConversations}, Variant B = ${metricsB.totalConversations}). Thử nghiệm vẫn đang tiếp diễn.`;
  } else {
    const convDiff = metricsB.conversionRate - metricsA.conversionRate;
    const emotionDiff = metricsB.avgEmotionScore - metricsA.avgEmotionScore;
    
    // Nếu Variant B tăng đáng kể số vụ vi phạm an toàn (> 25% tuyệt đối hoặc tương đối)
    const safetyViolationIncrease = metricsB.flagIncidents > metricsA.flagIncidents * 1.25;

    if (safetyViolationIncrease) {
      winner = 'A';
      reason = `Giữ nguyên Variant A làm mặc định vì Variant B gây ra sự gia tăng đáng kể số vụ vi phạm an toàn (B: ${metricsB.flagIncidents} lần vs A: ${metricsA.flagIncidents} lần).`;
    } else if (convDiff >= 0.02) {
      // Tỷ lệ chốt đơn của B vượt trội hơn A ít nhất 2% tuyệt đối
      winner = 'B';
      reason = `Variant B chiến thắng vượt trội nhờ tỷ lệ chuyển đổi đơn hàng tốt hơn (B: ${(metricsB.conversionRate * 100).toFixed(2)}% vs A: ${(metricsA.conversionRate * 100).toFixed(2)}%).`;
    } else if (emotionDiff >= 0.05 && convDiff >= -0.01) {
      // Điểm cảm xúc của B tốt hơn hẳn ít nhất 0.05 và không làm tụt đáng kể conversion rate
      winner = 'B';
      reason = `Variant B chiến thắng nhờ khả năng gắn kết cảm xúc tốt hơn hẳn (B: ${metricsB.avgEmotionScore} vs A: ${metricsA.avgEmotionScore}) và giữ vững doanh số chốt đơn.`;
    } else if (convDiff <= -0.02) {
      // Variant A tốt hơn rõ rệt
      winner = 'A';
      reason = `Giữ nguyên Variant A làm mặc định vì có tỷ lệ chuyển đổi đơn hàng vượt xa Variant B (A: ${(metricsA.conversionRate * 100).toFixed(2)}% vs B: ${(metricsB.conversionRate * 100).toFixed(2)}%).`;
    } else {
      winner = 'NONE';
      reason = `Không tìm thấy sự khác biệt vượt trội có ý nghĩa thống kê giữa hai nhóm (Tỷ lệ chuyển đổi chốt đơn lệch nhau không đáng kể: B: ${(metricsB.conversionRate * 100).toFixed(2)}% vs A: ${(metricsA.conversionRate * 100).toFixed(2)}%). Giữ nguyên cấu hình cũ.`;
    }
  }

  return {
    workspaceId,
    metricsA,
    metricsB,
    meetsSample,
    winner,
    reason,
    evaluatedAt: now,
  };
}

/**
 * Đọc kết quả phân tích, tiến hành tự động chọn Winner và cập nhật prompt mặc định nếu Variant B chiến thắng.
 */
export async function promoteWinnerIfAny(
  workspaceId: string,
  minSampleSize = 50
): Promise<ABTestResult | null> {
  try {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true, name: true },
    });

    if (!workspace) {
      console.warn(`⚠️ [ABTestManager] Workspace ${workspaceId} not found!`);
      return null;
    }

    const settings = (workspace.settings || {}) as any;
    const abTest = settings.ab_test;

    if (!abTest || !abTest.enabled) {
      console.log(`ℹ️ [ABTestManager] A/B Testing is not active or enabled for Workspace: ${workspace.name}`);
      return null;
    }

    // Phân tích đối sánh
    const result = await evaluateABTest(workspaceId, minSampleSize);

    if (result.winner === 'B') {
      console.log(`🎉 [ABTestManager] VARIANT B IS THE WINNER for workspace '${workspace.name}'! Promoting prompt...`);

      // Cập nhật cấu hình settings
      settings.ab_test = {
        ...abTest,
        variant_a_prompt: abTest.variant_b_prompt, // Promote B's prompt to be the new default (A)
        variant_b_prompt: null,                    // Xóa prompt thử nghiệm cũ
        variant_b_model: null,                     // Xóa model thử nghiệm cũ
        enabled: false,                            // Kết thúc thử nghiệm này
        winner_selected: 'B',
        ended_at: result.evaluatedAt.toISOString(),
      };

      await db.workspace.update({
        where: { id: workspaceId },
        data: { settings },
      });

      console.log(`✅ [ABTestManager] Successfully updated default prompt with winner Variant B prompt!`);
    } else if (result.winner === 'A') {
      console.log(`🔒 [ABTestManager] VARIANT A (Default) wins for workspace '${workspace.name}'. Disabling A/B test.`);

      settings.ab_test = {
        ...abTest,
        enabled: false, // Kết thúc thử nghiệm, giữ nguyên prompt cũ làm mặc định
        winner_selected: 'A',
        ended_at: result.evaluatedAt.toISOString(),
      };

      await db.workspace.update({
        where: { id: workspaceId },
        data: { settings },
      });

      console.log(`✅ [ABTestManager] Successfully finalized A/B test with Variant A as winner.`);
    } else {
      console.log(`ℹ️ [ABTestManager] Result for '${workspace.name}': NONE (Test remains active)`);
    }

    // Ghi vết quyết định
    logABTestDecision({
      workspaceId,
      workspaceName: workspace.name,
      winner: result.winner,
      reason: result.reason,
      metricsA: result.metricsA,
      metricsB: result.metricsB,
      meetsSample: result.meetsSample,
    });

    return result;
  } catch (error) {
    console.error(`❌ [ABTestManager] Error in promoteWinnerIfAny for workspace ${workspaceId}:`, error);
    return null;
  }
}
