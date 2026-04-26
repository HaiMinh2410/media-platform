import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { priority, sentiment } = await req.json();

    const data: any = {};
    if (priority !== undefined) data.priority = priority;
    if (sentiment !== undefined) data.sentiment = sentiment;

    const updated = await db.conversation.update({
      where: { id },
      data
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[METADATA_PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
