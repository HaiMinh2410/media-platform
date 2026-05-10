import { db } from '@/lib/db';

export type AIAgentWeeklyMetrics = {
  workspaceId: string;
  recordedAt: Date;
  fanTypeDistribution: Record<string, number>;
  conversionRateByType: Record<string, number>;
  avgMessagesToClose: number;
  totalConversations: number;
  totalPurchases: number;
  revenue: number;
  flagIncidents: number;
  escalationCount: number;
};

/**
 * Thu thập và tính toán các chỉ số hiệu năng hàng tuần của AI Agent cho một Workspace cụ thể.
 * @param workspaceId ID của workspace cần tổng hợp chỉ số
 * @param now Thời điểm kết thúc (mặc định là hiện tại)
 */
export async function collectWeeklyMetricsForWorkspace(
  workspaceId: string,
  now = new Date()
): Promise<AIAgentWeeklyMetrics> {
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Phân bổ loại fan (fan_type_distribution) - tính tổng số fan của từng loại hiện có
  const fanTypeCounts = await db.fanProfile.groupBy({
    by: ['fan_type'],
    where: { workspace_id: workspaceId },
    _count: { _all: true },
  });

  const fanTypeDistribution: Record<string, number> = {
    Luy: 0,
    Cool: 0,
    Whale: 0,
    Drainer: 0,
    Unknown: 0,
  };

  for (const group of fanTypeCounts) {
    const type = group.fan_type || 'Unknown';
    fanTypeDistribution[type] = group._count._all;
  }

  // 2. Tính số cuộc hội thoại có hoạt động của AI (total_conversations) trong tuần qua
  const activeLogs = await db.aIReplyLog.findMany({
    where: {
      created_at: {
        gte: oneWeekAgo,
        lte: now,
      },
      message: {
        conversation: {
          platform_accounts: {
            workspaceId: workspaceId,
          }
        }
      }
    },
    select: {
      message: {
        select: {
          conversationId: true,
        }
      }
    }
  });

  const uniqueConvoIds = new Set(
    activeLogs.map((log) => log.message?.conversationId).filter(Boolean)
  );
  const totalConversations = uniqueConvoIds.size;

  // 3. Phân tích lịch sử mua hàng trong tuần qua từ các fan_profiles
  const fanProfilesWithPurchases = await db.fanProfile.findMany({
    where: {
      workspace_id: workspaceId,
      NOT: {
        purchase_history: {
          equals: [],
        },
      },
    },
    select: {
      id: true,
      fan_type: true,
      message_count: true,
      purchase_history: true,
    },
  });

  let totalPurchases = 0;
  let revenue = 0.0;
  let totalMessagesForClosedFans = 0;
  let closedFansCount = 0;

  const fansWhoPurchasedThisWeekByType: Record<string, Set<string>> = {
    Luy: new Set(),
    Cool: new Set(),
    Whale: new Set(),
    Drainer: new Set(),
    Unknown: new Set(),
  };

  for (const profile of fanProfilesWithPurchases) {
    const history = (profile.purchase_history || []) as any[];
    const type = profile.fan_type || 'Unknown';

    let hasPurchaseThisWeek = false;
    for (const purchase of history) {
      const purchasedAt = new Date(purchase.purchasedAt);
      if (purchasedAt >= oneWeekAgo && purchasedAt <= now) {
        totalPurchases++;
        revenue += Number(purchase.amount || 0);
        hasPurchaseThisWeek = true;
      }
    }

    if (hasPurchaseThisWeek) {
      fansWhoPurchasedThisWeekByType[type].add(profile.id);
      totalMessagesForClosedFans += profile.message_count || 0;
      closedFansCount++;
    }
  }

  // 4. Tính tỷ lệ chuyển đổi mua hàng theo từng loại fan (conversion_rate_by_type) trong tuần qua
  const conversionRateByType: Record<string, number> = {
    Luy: 0.0,
    Cool: 0.0,
    Whale: 0.0,
    Drainer: 0.0,
    Unknown: 0.0,
  };

  for (const type of ['Luy', 'Cool', 'Whale', 'Drainer', 'Unknown']) {
    const totalFansOfType = fanTypeDistribution[type] || 0;
    if (totalFansOfType > 0) {
      const purchasedFans = fansWhoPurchasedThisWeekByType[type].size;
      conversionRateByType[type] = parseFloat(
        (purchasedFans / totalFansOfType).toFixed(4)
      );
    }
  }

  // 5. Số tin nhắn trung bình để chốt đơn thành công (avg_messages_to_close)
  const avgMessagesToClose =
    closedFansCount > 0
      ? parseFloat((totalMessagesForClosedFans / closedFansCount).toFixed(2))
      : 0.0;

  // 6. Số vụ vi phạm an toàn / flag_incidents trong tuần qua
  const logsWithViolations = await db.aIReplyLog.findMany({
    where: {
      created_at: {
        gte: oneWeekAgo,
        lte: now,
      },
      message: {
        conversation: {
          platform_accounts: {
            workspaceId: workspaceId,
          }
        }
      }
    },
    select: {
      safetyViolations: true,
    }
  });

  let flagIncidents = 0;
  for (const log of logsWithViolations) {
    const violations = (log.safetyViolations || []) as any[];
    if (violations.length > 0) {
      flagIncidents++;
    }
  }

  // 7. Số lần escalation cho con người (escalation_count) trong tuần qua
  const escalationCount = await db.aIReplyLog.count({
    where: {
      created_at: {
        gte: oneWeekAgo,
        lte: now,
      },
      action: 'escalate_to_human',
      message: {
        conversation: {
          platform_accounts: {
            workspaceId: workspaceId,
          }
        }
      }
    }
  });

  return {
    workspaceId,
    recordedAt: now,
    fanTypeDistribution,
    conversionRateByType,
    avgMessagesToClose,
    totalConversations,
    totalPurchases,
    revenue,
    flagIncidents,
    escalationCount,
  };
}

/**
 * Tổng hợp chỉ số và lưu bản ghi Snapshot mới vào bảng ai_agent_metrics cho tất cả các Workspace.
 * @param now Thời điểm chạy tổng hợp
 */
export async function runWeeklyMetricsAggregation(now = new Date()): Promise<void> {
  console.log(`📊 [MetricsCollector] Starting weekly metrics aggregation at ${now.toISOString()}`);
  
  try {
    const workspaces = await db.workspace.findMany({
      select: { id: true, name: true },
    });

    console.log(`📊 [MetricsCollector] Found ${workspaces.length} workspaces to aggregate.`);

    for (const workspace of workspaces) {
      console.log(`📊 [MetricsCollector] Aggregating metrics for workspace: ${workspace.name} (${workspace.id})`);
      
      const metrics = await collectWeeklyMetricsForWorkspace(workspace.id, now);

      await db.aIAgentMetric.create({
        data: {
          workspace_id: metrics.workspaceId,
          recorded_at: metrics.recordedAt,
          fan_type_distribution: metrics.fanTypeDistribution,
          conversion_rate_by_type: metrics.conversionRateByType,
          avg_messages_to_close: metrics.avgMessagesToClose,
          total_conversations: metrics.totalConversations,
          total_purchases: metrics.totalPurchases,
          revenue: metrics.revenue,
          flag_incidents: metrics.flagIncidents,
          escalation_count: metrics.escalationCount,
        },
      });

      console.log(`✅ [MetricsCollector] Successfully persisted metrics snapshot for workspace: ${workspace.name}`);
    }

    console.log(`📊 [MetricsCollector] Weekly metrics aggregation completed successfully.`);
  } catch (error) {
    console.error('❌ [MetricsCollector] Error during runWeeklyMetricsAggregation:', error);
    throw error;
  }
}
