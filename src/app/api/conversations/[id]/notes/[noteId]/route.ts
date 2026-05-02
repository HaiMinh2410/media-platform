import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * DELETE /api/conversations/[id]/notes/[noteId]
 * Deletes a specific note.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: conversationId, noteId } = await params;

    // Optional: Verify the note belongs to the conversation
    const note = await db.conversationNote.findUnique({
      where: { id: noteId }
    });

    if (!note || note.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Note not found or does not belong to this conversation' }, { status: 404 });
    }

    await db.conversationNote.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NOTE_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/conversations/[id]/notes/[noteId]
 * Updates a specific note.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: conversationId, noteId } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await db.conversationNote.findUnique({
      where: { id: noteId }
    });

    if (!note || note.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Note not found or does not belong to this conversation' }, { status: 404 });
    }

    const updatedNote = await db.conversationNote.update({
      where: { id: noteId },
      data: { content }
    });

    return NextResponse.json({ data: updatedNote });
  } catch (error) {
    console.error('[NOTE_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
