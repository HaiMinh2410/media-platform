import { NextRequest, NextResponse } from 'next/server';
import { getPostRepository } from '@features/posts/repositories/post.repository';
import { z } from 'zod';

const UpdatePostSchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(['scheduled', 'published', 'failed']).optional(),
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

import { db } from "@shared/lib/db";
import { getTokenEncryptionService } from "@features/settings/services/token-encryption.service";

/**
 * DELETE /api/posts/[id]
 * Deletes a post.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const postRepo = getPostRepository();
    
    // 1. Fetch post details first
    const { data: post, error: findErr } = await postRepo.findById(id);
    
    if (findErr || !post) {
      return NextResponse.json({ error: findErr || 'Post not found' }, { status: 404 });
    }

    // 2. If the post is published and has a platformPostId, attempt deleting from Meta Graph API
    if (post.status === 'published' && post.platformPostId) {
      const account = await db.platformAccount.findUnique({
        where: { id: post.accountId },
        include: {
          meta_tokens: {
            orderBy: { updated_at: 'desc' },
            take: 1
          }
        }
      });

      if (account && (account.platform === 'instagram' || account.platform === 'facebook')) {
        const encryptedToken = account.meta_tokens?.[0]?.encrypted_access_token;
        if (encryptedToken) {
          const crypto = getTokenEncryptionService();
          const decrypted = await crypto.decrypt(encryptedToken);
          
          if (decrypted.data) {
            let accessToken = decrypted.data; // Default: Page Access Token
            let userAccessToken: string | null = null;

            // A. Attempt to get User Access Token from PlatformAccount metadata
            const metadata = account.metadata as any;
            if (metadata && metadata.encrypted_user_access_token) {
              const decryptedUser = await crypto.decrypt(metadata.encrypted_user_access_token);
              if (decryptedUser.data) {
                userAccessToken = decryptedUser.data;
              }
            }

            // B. Fallback: Get User Access Token from AccountToken refresh_token (new system)
            if (!userAccessToken) {
              const newAccount = await db.account.findFirst({
                where: {
                  platform: account.platform.toUpperCase(),
                  platform_id: account.platform_user_id
                },
                include: {
                  token: true
                }
              });
              if (newAccount && newAccount.token?.refresh_token) {
                const decryptedUser = await crypto.decrypt(newAccount.token.refresh_token);
                if (decryptedUser.data) {
                  userAccessToken = decryptedUser.data;
                }
              }
            }

            // For Instagram, we MUST use Facebook User Access Token
            if (account.platform === 'instagram') {
              if (!userAccessToken) {
                return NextResponse.json({
                  error: 'REAUTH_REQUIRED',
                  message: 'Vui lòng kết nối lại (Re-authenticate) tài khoản Instagram của bạn trong mục Cài đặt để kích hoạt quyền gỡ bài viết.'
                }, { status: 400 });
              }
              accessToken = userAccessToken;
            } else if (account.platform === 'facebook' && userAccessToken) {
              // For Facebook, Page Access Token is preferred, but User Access Token is also fine
              accessToken = userAccessToken;
            }

            const apiVersion = 'v25.0';
            const url = `https://graph.facebook.com/${apiVersion}/${post.platformPostId}?access_token=${accessToken}`;
            
            const apiRes = await fetch(url, {
              method: 'DELETE'
            });
            
            const apiData = await apiRes.json();
            
            if (!apiRes.ok || apiData.error) {
              const errorMessage = apiData.error?.message || 'Meta API request failed';
              const errorCode = apiData.error?.code;
              console.error('[API Post DELETE] Meta Graph API error:', apiData.error);
              
              // Check if the post was already deleted from the social network (doesn't exist)
              const isAlreadyDeleted = 
                errorCode === 100 && 
                (errorMessage.toLowerCase().includes('does not exist') || 
                 errorMessage.toLowerCase().includes('cannot be loaded') ||
                 errorMessage.toLowerCase().includes('unsupported get request') ||
                 errorMessage.toLowerCase().includes('not found'));

              if (isAlreadyDeleted) {
                console.log('[API Post DELETE] Post already deleted from Meta. Proceeding with local DB deletion.');
              } else {
                // If it's a media type not supported error
                if (errorMessage.includes('Media Type Not Supported')) {
                  return NextResponse.json({ 
                    error: 'Media Type Not Supported', 
                    message: 'Bài viết này không được hỗ trợ để xóa qua API.' 
                  }, { status: 400 });
                }
                
                return NextResponse.json({ 
                  error: 'PLATFORM_DELETE_FAILED', 
                  message: `Không thể xóa bài viết trên mạng xã hội: ${errorMessage}` 
                }, { status: 502 });
              }
            }
            
            console.log('[API Post DELETE] Successfully deleted media from Meta:', apiData);
          }
        }
      }
    }

    // 3. Delete from local database
    console.log('[API Post DELETE] Attempting to delete post from DB with id:', id);
    const { success, error } = await postRepo.deletePost(id);
    console.log('[API Post DELETE] Local DB delete result:', success, error);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API Post DELETE] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
