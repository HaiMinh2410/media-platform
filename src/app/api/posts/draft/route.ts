import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';

const DraftSchema = z.object({
  workspaceId: z.string().uuid(),
  content: z.string().optional(),
  selectedAccountIds: z.array(z.string().uuid()),
  mediaFiles: z.array(z.any()), 
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = DraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { workspaceId, content, selectedAccountIds, mediaFiles } = parsed.data;

    // Upsert draft for this user and workspace
    const draft = await prisma.draft.upsert({
      where: {
        workspace_id_profile_id: {
          workspace_id: workspaceId,
          profile_id: user.id,
        },
      },
      update: {
        content,
        selected_account_ids: selectedAccountIds,
        media_files: mediaFiles,
        updated_at: new Date(),
      },
      create: {
        workspace_id: workspaceId,
        profile_id: user.id,
        content,
        selected_account_ids: selectedAccountIds,
        media_files: mediaFiles,
      },
    });

    return NextResponse.json({ data: draft });
  } catch (err: any) {
    console.error('Draft API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const draft = await prisma.draft.findUnique({
      where: {
        workspace_id_profile_id: {
          workspace_id: workspaceId,
          profile_id: user.id,
        },
      },
    });

    return NextResponse.json({ data: draft });
  } catch (err: any) {
    console.error('Draft API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.draft.delete({
      where: {
        workspace_id_profile_id: {
          workspace_id: workspaceId,
          profile_id: user.id,
        },
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err: any) {
    // If not found, just return success
    return NextResponse.json({ data: { success: true } });
  }
}
