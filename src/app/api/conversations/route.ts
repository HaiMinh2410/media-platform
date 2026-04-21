import { NextRequest, NextResponse } from 'next/server';
import { getConversations } from '@/infrastructure/repositories/conversation.repository';
import { ConversationFilter, PaginationParams } from '@/domain/types/messaging';

/**
 * GET /api/conversations
 * List conversations for a workspace with filters and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const platform = searchParams.get('platform') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter: ConversationFilter = {
      workspaceId,
      platform,
      status,
      search,
    };

    const pagination: PaginationParams = {
      limit,
      cursor,
    };

    const { data, nextCursor, error } = await getConversations(filter, pagination);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: {
        nextCursor,
      }
    });
  } catch (error: any) {
    console.error('[API Conversations] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
