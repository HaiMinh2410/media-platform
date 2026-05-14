import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/infrastructure/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Fetch publish jobs grouped by batch_id
    // Note: In a real app, you might want to fetch only the last 30 days or so
    const jobs = await db.publishJob.findMany({
      where: {
        account: {
          profile: {
            id: user.id
          }
        }
      },
      include: {
        account: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Grouping logic
    const batchesMap = new Map();

    jobs.forEach(job => {
      const bId = job.batch_id || job.id; // Fallback to job id if no batch_id
      if (!batchesMap.has(bId)) {
        batchesMap.set(bId, {
          id: job.id,
          batchId: bId,
          content: job.content || '',
          mediaUrls: job.media_urls || [],
          createdAt: job.created_at,
          status: 'SUCCESS', // Default, will update
          accounts: []
        });
      }

      const batch = batchesMap.get(bId);
      batch.accounts.push({
        id: job.account_id,
        name: job.account.name,
        platform: job.platform,
        status: job.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED'
      });

      // Update aggregate status
      if (job.status === 'FAILED') {
        batch.status = 'PARTIAL';
      }
    });

    const batches = Array.from(batchesMap.values());

    return NextResponse.json({ data: batches });
  } catch (error: any) {
    console.error('[API Publish History] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
