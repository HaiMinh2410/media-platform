import { NextRequest, NextResponse } from 'next/server';
import { getPostRepository } from '@/infrastructure/repositories/post.repository';
import { z } from 'zod';

const UpdatePostSchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/posts/[id]
 * Updates a post's content or schedule.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const postRepo = getPostRepository();
    const { data, error } = await postRepo.updatePost(id, {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    } as any);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[API Post PATCH] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/[id]
 * Deletes a post.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const postRepo = getPostRepository();
    const { success, error } = await postRepo.deletePost(id);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API Post DELETE] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
