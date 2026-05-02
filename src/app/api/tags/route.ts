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

    let systemTags = await db.workspaceTag.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { name: 'asc' }
    });

    // 4 standard default tags that should always be available
    const defaultTags = [
      'Ưu tiên::#3b82f6',
      'Hạn chế::#ef4444',
      'Khách hàng mới::#22c55e',
      `Ngày hôm nay (${new Date().toLocaleDateString('en-US', { month: '2-digit', day: 'numeric' })})::#f59e0b`
    ];

    // Format system tags as name::color
    const formattedSystem = systemTags.map(t => `${t.name}::${t.color}`);

    // Merge and ensure uniqueness by name
    const allTagsMap = new Map<string, string>();
    
    // 1. Add defaults first
    defaultTags.forEach(t => {
      const [name] = t.split('::');
      allTagsMap.set(name, t);
    });

    // 2. Add system tags (overwrite defaults if they have same name to use system color/config)
    formattedSystem.forEach(t => {
      const [name] = t.split('::');
      allTagsMap.set(name, t);
    });

    // 3. Optional: Scan conversations to find any other tags (limit for performance)
    const conversations = await db.conversation.findMany({
      where: { platform_accounts: { workspaceId } },
      select: { tags: true },
      take: 20 
    });
    conversations.forEach(c => {
      c.tags.forEach(t => {
        const [name] = t.split('::');
        if (!allTagsMap.has(name)) allTagsMap.set(name, t);
      });
    });

    return NextResponse.json({ data: Array.from(allTagsMap.values()) });
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
