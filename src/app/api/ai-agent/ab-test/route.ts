// src/app/api/ai-agent/ab-test/route.ts
//
// API quản lý & phân tích thử nghiệm A/B Testing cho AI Agent - Phase 3 Autonomous + Learning
//

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { evaluateABTest, promoteWinnerIfAny } from '@/application/ai-agent/ab-test-manager';

/**
 * GET /api/ai-agent/ab-test
 * 
 * Tra cứu cấu hình và kết quả thống kê hiệu năng thử nghiệm A/B hiện tại của Workspace.
 * 
 * Query Params:
 *   - workspaceId: string (bắt buộc)
 *   - minSampleSize: number (tùy chọn, mặc định 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const minSampleSize = parseInt(searchParams.get('minSampleSize') || '50', 10);

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId query parameter.' }, { status: 400 });
    }

    // Kiểm tra xem Workspace có tồn tại không
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, settings: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
    }

    const settings = (workspace.settings || {}) as any;
    const abTest = settings.ab_test || { enabled: false };

    // Nếu cuộc thử nghiệm đang kích hoạt hoặc đã hoàn thành, thực hiện phân tích nhanh
    let analysis = null;
    try {
      analysis = await evaluateABTest(workspaceId, minSampleSize);
    } catch (analysisErr) {
      console.error('⚠️ Failed to calculate A/B test analysis:', analysisErr);
    }

    return NextResponse.json({
      data: {
        workspaceName: workspace.name,
        config: abTest,
        analysis,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API ABTest GET] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/ai-agent/ab-test
 * 
 * Quản lý khởi chạy, dừng hoặc kích hoạt phân tích thủ công A/B Testing.
 * 
 * Body Params:
 *   - workspaceId: string (bắt buộc)
 *   - action: 'start' | 'stop' | 'trigger_evaluation' (bắt buộc)
 *   - config: { variant_b_prompt?: string, variant_b_model?: string, variant_a_prompt?: string } (dùng khi action='start')
 *   - minSampleSize: number (dùng khi action='trigger_evaluation', mặc định 50)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, action, config, minSampleSize = 50 } = body;

    if (!workspaceId || !action) {
      return NextResponse.json({ error: 'Missing workspaceId or action in request body.' }, { status: 400 });
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, settings: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
    }

    const settings = (workspace.settings || {}) as any;

    if (action === 'start') {
      if (!config || !config.variant_b_prompt) {
        return NextResponse.json({ error: 'Missing variant_b_prompt in config for action start.' }, { status: 400 });
      }

      // Khởi chạy cuộc thử nghiệm A/B mới
      settings.ab_test = {
        enabled: true,
        variant_a_prompt: config.variant_a_prompt || settings.ab_test?.variant_a_prompt || null, // Prompt hiện tại làm A
        variant_b_prompt: config.variant_b_prompt,                                              // Prompt mới thử nghiệm làm B
        variant_b_model: config.variant_b_model || null,                                        // Model mới thử nghiệm làm B
        winner_selected: null,
        started_at: new Date().toISOString(),
        ended_at: null,
      };

      await db.workspace.update({
        where: { id: workspaceId },
        data: { settings },
      });

      return NextResponse.json({
        message: `Successfully configured and started a new A/B testing session for '${workspace.name}'.`,
        data: settings.ab_test,
      });
    }

    if (action === 'stop') {
      if (!settings.ab_test || !settings.ab_test.enabled) {
        return NextResponse.json({ error: 'A/B Testing is not currently running.' }, { status: 400 });
      }

      settings.ab_test.enabled = false;
      settings.ab_test.ended_at = new Date().toISOString();

      await db.workspace.update({
        where: { id: workspaceId },
        data: { settings },
      });

      return NextResponse.json({
        message: `Successfully stopped the current A/B testing session for '${workspace.name}'.`,
        data: settings.ab_test,
      });
    }

    if (action === 'trigger_evaluation') {
      console.log(`🚀 [API ABTest] Manually triggering weekly evaluation & winner selection for Workspace: ${workspaceId}`);
      const result = await promoteWinnerIfAny(workspaceId, minSampleSize);

      if (!result) {
        return NextResponse.json({
          error: 'A/B Testing is not active, or failed to evaluate the workspace.',
        }, { status: 400 });
      }

      return NextResponse.json({
        message: `Evaluation completed successfully for Workspace: ${workspace.name}.`,
        data: result,
      });
    }

    return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API ABTest POST] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
