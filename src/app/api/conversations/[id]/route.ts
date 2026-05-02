import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * DELETE /api/conversations/[id]
 * Deletes a conversation locally from the database.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.conversation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONVERSATION_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
