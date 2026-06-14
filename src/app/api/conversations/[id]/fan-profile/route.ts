import { db } from "@shared/lib/db";

import { NextRequest, NextResponse } from 'next/server';
import { calculateInteractiveDays, determineStage } from '@features/ai-agent';

/**
 * GET /api/conversations/[id]/fan-profile
 * Fetches the Fan Profile associated with the conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const fanProfile = await db.fanProfile.findUnique({
      where: { conversation_id: conversationId },
    });

    if (!fanProfile) {
      return NextResponse.json({ data: null });
    }

    // Tính toán lại day_count thực tế dựa trên tin nhắn đầu tiên
    const firstMessage = await db.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    let dayCount = fanProfile.day_count;
    let firstInteractedAt = fanProfile.created_at;

    if (firstMessage) {
      firstInteractedAt = firstMessage.createdAt;
      
      // Tính số ngày có tương tác thực tế (đếm số ngày duy nhất có tin nhắn)
      dayCount = await calculateInteractiveDays(conversationId);

      // Tính lại stage dựa trên dayCount mới
      const currentStage = determineStage({
        ...fanProfile,
        dayCount,
      } as any);
      
      // Cập nhật lại DB nếu day_count hoặc stage có sự thay đổi
      if (dayCount !== fanProfile.day_count || currentStage !== fanProfile.stage) {
        await db.fanProfile.update({
          where: { id: fanProfile.id },
          data: { 
            day_count: dayCount,
            stage: currentStage,
          },
        });
        fanProfile.day_count = dayCount;
        fanProfile.stage = currentStage;
      }
    }

    return NextResponse.json({ 
      data: {
        ...fanProfile,
        firstInteractedAt,
      } 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[API FanProfile GET] Unexpected error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
