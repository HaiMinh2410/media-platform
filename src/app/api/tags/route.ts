import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/tags?workspaceId=...
 * Lists all predefined tags for a workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    let tags = await db.workspaceTag.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { name: 'asc' }
    });

    // Fallback: If no system tags defined, scan conversations to find existing ones
    // This provides a smoother transition and ensures filters aren't empty
    if (tags.length === 0) {
      console.log(`[API Tags] No system tags for workspace ${workspaceId}, falling back to conversation scan.`);
      const conversations = await db.conversation.findMany({
        where: {
          platform_accounts: {
            workspaceId: workspaceId
          }
        },
        select: {
          tags: true
        }
      });

      const allTags = new Set<string>();
      conversations.forEach(c => {
        c.tags.forEach(t => allTags.add(t));
      });

      // If still empty, add some defaults to encourage usage
      if (allTags.size === 0) {
        return NextResponse.json({ data: [
          'Ưu tiên::#3b82f6',
          'Hạn chế::#ef4444',
          'Khách hàng mới::#22c55e'
        ] });
      }

      // Return the scanned tags directly
      return NextResponse.json({ data: Array.from(allTags) });
    }

    // Format as name::color for compatibility with current frontend logic
    const formatted = tags.map(t => `${t.name}::${t.color}`);

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error('[API Tags GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Creates a new predefined tag for a workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, name, color } = await request.json();

    if (!workspaceId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tag = await db.workspaceTag.create({
      data: {
        workspace_id: workspaceId,
        name,
        color: color || '#6366f1'
      }
    });

    return NextResponse.json({ data: `${tag.name}::${tag.color}` });
  } catch (error: any) {
    console.error('[API Tags POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/tags
 * Deletes a predefined tag.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const tagName = searchParams.get('name');

    if (!workspaceId || !tagName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.workspaceTag.deleteMany({
      where: {
        workspace_id: workspaceId,
        name: tagName
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Tags DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/tags
 * Updates an existing tag's name or color.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { workspaceId, oldName, newName, color } = await request.json();

    if (!workspaceId || !oldName || !newName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tag = await db.workspaceTag.update({
      where: {
        workspace_id_name: {
          workspace_id: workspaceId,
          name: oldName
        }
      },
      data: {
        name: newName,
        color: color
      }
    });

    return NextResponse.json({ data: `${tag.name}::${tag.color}` });
  } catch (error: any) {
    console.error('[API Tags PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
