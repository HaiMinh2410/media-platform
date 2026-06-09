import { db } from "@shared/lib/db";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/api/supabase/server';
import { getTokenEncryptionService } from "@features/settings/services/token-encryption.service";

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
          scheduledAt: job.scheduled_at,
          status: 'SUCCESS', // Default, will recalculate
          accounts: []
        });
      }

      const batch = batchesMap.get(bId);
      
      let accountStatus: 'SUCCESS' | 'FAILED' | 'SCHEDULED' | 'PROCESSING' = 'FAILED';
      if (job.status === 'COMPLETED') {
        accountStatus = 'SUCCESS';
      } else if (job.status === 'RUNNING') {
        accountStatus = 'PROCESSING';
      } else if (job.status === 'PENDING') {
        const isFuture = job.scheduled_at && new Date(job.scheduled_at) > new Date();
        accountStatus = isFuture ? 'SCHEDULED' : 'PROCESSING';
      }

      const avatarUrl = job.account.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.account.name)}&background=random&size=150`;

      batch.accounts.push({
        id: job.account_id,
        name: job.account.name,
        platform: job.platform,
        status: accountStatus,
        avatarUrl: avatarUrl,
        platformId: job.account.platform_id
      });
    });

    const batches = Array.from(batchesMap.values()).map((batch: any) => {
      const total = batch.accounts.length;
      const success = batch.accounts.filter((a: any) => a.status === 'SUCCESS').length;
      const failed = batch.accounts.filter((a: any) => a.status === 'FAILED').length;
      const processing = batch.accounts.filter((a: any) => a.status === 'PROCESSING').length;
      const scheduled = batch.accounts.filter((a: any) => a.status === 'SCHEDULED').length;

      if (processing > 0) {
        batch.status = 'PROCESSING';
      } else if (scheduled > 0) {
        batch.status = 'SCHEDULED';
      } else if (success === total) {
        batch.status = 'SUCCESS';
      } else if (failed === total) {
        batch.status = 'FAILED';
      } else {
        batch.status = 'PARTIAL';
      }

      return batch;
    });

    return NextResponse.json({ data: batches });
  } catch (error: any) {
    console.error('[API Publish History] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/publish/history?id=...
 * Deletes a batch of publish jobs.
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // 1. Fetch completed jobs with platform_post_id to delete on Meta first
    const jobs = await db.publishJob.findMany({
      where: {
        OR: [
          { batch_id: id },
          { id: id }
        ],
        status: 'COMPLETED',
        platform_post_id: { not: null }
      },
      include: {
        account: {
          include: {
            token: true
          }
        }
      }
    });

    const crypto = getTokenEncryptionService();
    const errors: Array<{ jobId: string; platform: string; message: string }> = [];

    // 2. Loop through each job and call Meta Graph API to delete
    for (const job of jobs) {
      if ((job.platform === 'instagram' || job.platform === 'facebook') && job.platform_post_id) {
        const encryptedToken = job.account?.token?.access_token;
        if (encryptedToken) {
          try {
            const decrypted = await crypto.decrypt(encryptedToken);
            if (decrypted.data) {
              const accessToken = decrypted.data;
              const apiVersion = 'v25.0';
              const url = `https://graph.facebook.com/${apiVersion}/${job.platform_post_id}?access_token=${accessToken}`;
              
              console.log(`[API Publish History DELETE] Attempting to delete media ${job.platform_post_id} from Meta for job ${job.id}`);
              const apiRes = await fetch(url, { method: 'DELETE' });
              const apiData = await apiRes.json();
              
              if (!apiRes.ok || apiData.error) {
                const errorMessage = apiData.error?.message || 'Meta API request failed';
                const errorCode = apiData.error?.code;
                console.error(`[API Publish History DELETE] Meta Graph API error for job ${job.id}:`, apiData.error);
                
                // Check if the post was already deleted from the social network (doesn't exist)
                const isAlreadyDeleted = 
                  errorCode === 100 && 
                  (errorMessage.toLowerCase().includes('does not exist') || 
                   errorMessage.toLowerCase().includes('cannot be loaded') ||
                   errorMessage.toLowerCase().includes('unsupported get request') ||
                   errorMessage.toLowerCase().includes('not found'));
                
                if (isAlreadyDeleted) {
                  console.log(`[API Publish History DELETE] Media ${job.platform_post_id} already deleted from Meta.`);
                } else {
                  errors.push({
                    jobId: job.id,
                    platform: job.platform,
                    message: errorMessage
                  });
                }
              } else {
                console.log(`[API Publish History DELETE] Successfully deleted media ${job.platform_post_id} from Meta.`);
              }
            } else {
              console.error(`[API Publish History DELETE] Failed to decrypt token for job ${job.id}`);
              errors.push({
                jobId: job.id,
                platform: job.platform,
                message: 'Failed to decrypt access token'
              });
            }
          } catch (decryptErr: any) {
            console.error(`[API Publish History DELETE] Error processing Meta delete for job ${job.id}:`, decryptErr);
            errors.push({
              jobId: job.id,
              platform: job.platform,
              message: decryptErr.message || 'Error processing delete'
            });
          }
        }
      }
    }

    // 3. If there are failure errors (except 'already deleted'), return the error without deleting from DB
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'PLATFORM_DELETE_FAILED',
        message: `Không thể gỡ bài viết trên một số tài khoản mạng xã hội: ${errors.map(e => `${e.platform.toUpperCase()}: ${e.message}`).join(', ')}`,
        details: errors
      }, { status: 502 });
    }

    // 4. Delete jobs belonging to the batch or matching the specific job ID from DB
    console.log('[API Publish History DELETE] Attempting to delete jobs from DB with id:', id);
    const deleteResult = await db.publishJob.deleteMany({
      where: {
        OR: [
          { batch_id: id },
          { id: id }
        ]
      }
    });
    console.log('[API Publish History DELETE] Delete result count:', deleteResult.count);

    return NextResponse.json({ success: true, count: deleteResult.count });
  } catch (error: any) {
    console.error('[API Publish History DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
