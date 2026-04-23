import { db } from '../../lib/db';
import type { CreatePostInput, Post, PostStatus } from '../../domain/types/posts';

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
              status: scheduledAt ? 'scheduled' : 'draft',
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
          metadata: r.metadata as any,
          platformPostId: r.platform_post_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        error: null,
      };
    } catch (error: any) {
      console.error('[PostRepository] createPosts failed:', error);
      return { data: null, error: `DATABASE_ERROR: ${error.message}` };
    }
  }

  /**
   * Fetches posts for a workspace.
   */
  async findByWorkspaceId(workspaceId: string): Promise<{ data: Post[] | null, error: string | null }> {
    try {
      const results = await db.posts.findMany({
        where: {
          platform_accounts: {
            workspaceId: workspaceId,
          },
        },
        orderBy: { created_at: 'desc' },
      });

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
          metadata: r.metadata as any,
          platformPostId: r.platform_post_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        error: null,
      };
    } catch (error: any) {
      console.error('[PostRepository] findByWorkspaceId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
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
