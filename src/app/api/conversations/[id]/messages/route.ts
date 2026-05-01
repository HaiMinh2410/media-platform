import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '../../../../../../message.repository';
import { PaginationParams } from '@/domain/types/messaging';

/**
 * GET /api/conversations/[id]/messages
 * Fetches message history for a specific conversation with pagination.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor') || undefined;
    const limitParams = searchParams.get('limit');
    const limit = limitParams ? parseInt(limitParams, 10) : 50;

    const pagination: PaginationParams = {
      limit,
      cursor,
    };

    const { data, nextCursor, error } = await getMessages(id, pagination);

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
    console.error('[API Messages] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
