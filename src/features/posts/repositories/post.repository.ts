import { db } from "@shared/lib/db";

import type { CreatePostInput, Post, PostStatus } from '../types';

export class PostRepository {
  /**
   * Creates a post entry for each account specified.
   */
  async createPosts(input: CreatePostInput): Promise<{ data: Post[] | null, error: string | null }> {
    try {
      const { accountIds, workspaceId, content, mediaUrls, scheduledAt, title } = input;

      const results = await db.$transaction(
        accountIds.map((accountId) =>
          db.posts.create({
            data: {
              account_id: accountId,
              title: title || null,
              content: content,
              media_urls: mediaUrls,
              status: 'scheduled',
              scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
              metadata: {},
            },
          })
        )
      );

      return {
        data: results.map((r) => ({
          id: r.id,
          accountId: r.account_id,
          title: r.title,
          content: r.content,
          mediaUrls: r.media_urls,
          status: r.status as PostStatus,
          scheduledAt: r.scheduled_at,
          publishedAt: r.published_at,
          errorMessage: r.error_message,
          metadata: r.metadata as Record<string, unknown>,
          platformPostId: r.platform_post_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        error: null,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PostRepository] createPosts failed:', error);
      return { data: null, error: `DATABASE_ERROR: ${errorMessage}` };
    }
  }

  /**
   * Fetches posts for a workspace.
   */
  async findByWorkspaceId(workspaceId: string): Promise<{ data: (Post & { account?: { name: string; platform: string; avatarUrl?: string } })[] | null, error: string | null }> {
    try {
      const results = await db.posts.findMany({
        where: {
          platform_accounts: {
            workspaceId: workspaceId,
          },
        },
        include: {
          platform_accounts: true,
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        data: results.map((r) => {
          const meta = r.platform_accounts?.metadata as any;
          const avatarUrl = meta?.avatar_url || meta?.picture?.data?.url || undefined;
          return {
            id: r.id,
            accountId: r.account_id,
            title: r.title,
            content: r.content,
            mediaUrls: r.media_urls,
            status: r.status as PostStatus,
            scheduledAt: r.scheduled_at,
            publishedAt: r.published_at,
            errorMessage: r.error_message,
            metadata: r.metadata as Record<string, unknown>,
            platformPostId: r.platform_post_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            account: r.platform_accounts ? {
              name: r.platform_accounts.platform_user_name,
              platform: r.platform_accounts.platform,
              avatarUrl: avatarUrl
            } : undefined
          };
        }),
        error: null,
      };
    } catch (error: unknown) {
      console.error('[PostRepository] findByWorkspaceId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Finds a post by ID.
   */
  async findById(id: string): Promise<{ data: Post | null, error: string | null }> {
    try {
      const r = await db.posts.findUnique({
        where: { id },
      });

      if (!r) return { data: null, error: 'POST_NOT_FOUND' };

      return {
        data: {
          id: r.id,
          accountId: r.account_id,
          title: r.title,
          content: r.content,
          mediaUrls: r.media_urls,
          status: r.status as PostStatus,
          scheduledAt: r.scheduled_at,
          publishedAt: r.published_at,
          errorMessage: r.error_message,
          metadata: r.metadata as Record<string, unknown>,
          platformPostId: r.platform_post_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        },
        error: null,
      };
    } catch (error: unknown) {
      console.error('[PostRepository] findById failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Updates a post.
   */
  async updatePost(id: string, data: Partial<Post>): Promise<{ data: Post | null, error: string | null }> {
    try {
      const r = await db.posts.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          media_urls: data.mediaUrls,
          status: data.status,
          scheduled_at: data.scheduledAt,
          metadata: data.metadata || undefined,
        },
      });

      return {
        data: {
          id: r.id,
          accountId: r.account_id,
          title: r.title,
          content: r.content,
          mediaUrls: r.media_urls,
          status: r.status as PostStatus,
          scheduledAt: r.scheduled_at,
          publishedAt: r.published_at,
          errorMessage: r.error_message,
          metadata: r.metadata as Record<string, unknown>,
          platformPostId: r.platform_post_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        },
        error: null,
      };
    } catch (error: unknown) {
      console.error('[PostRepository] updatePost failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Deletes a post.
   */
  async deletePost(id: string): Promise<{ success: boolean, error: string | null }> {
    try {
      await db.posts.delete({
        where: { id },
      });
      return { success: true, error: null };
    } catch (error: unknown) {
      console.error('[PostRepository] deletePost failed:', error);
      return { success: false, error: 'DATABASE_ERROR' };
    }
  }
}

// Singleton helper
let instance: PostRepository | null = null;

export function getPostRepository() {
  if (!instance) {
    instance = new PostRepository();
  }
  return instance;
}
