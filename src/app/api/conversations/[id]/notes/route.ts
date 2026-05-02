import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/conversations/[id]/notes
 * Adds a new note to a conversation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { content, authorId } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await db.conversationNote.create({
      data: {
        conversationId,
        content,
        authorId,
      }
    });

    return NextResponse.json({ data: note });
  } catch (error) {
    console.error('[NOTES_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
