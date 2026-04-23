import { NextRequest, NextResponse } from 'next/server';
import { getPostRepository } from '@/infrastructure/repositories/post.repository';
import { z } from 'zod';

const CreatePostSchema = z.object({
  workspaceId: z.string().uuid(),
  accountIds: z.array(z.string().uuid()).min(1, 'Select at least one account'),
  content: z.string().min(1, 'Post content cannot be empty'),
  mediaUrls: z.array(z.string().url()),
  scheduledAt: z.string().optional(),
  title: z.string().optional(),
});

/**
 * GET /api/posts?workspaceId=...
 * Lists posts for a workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const postRepo = getPostRepository();
    const { data, error } = await postRepo.findByWorkspaceId(workspaceId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[API Posts] GET failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/posts
 * Creates posts for one or more accounts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const postRepo = getPostRepository();
    const { data, error } = await postRepo.createPosts(parsed.data);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[API Posts] POST failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
