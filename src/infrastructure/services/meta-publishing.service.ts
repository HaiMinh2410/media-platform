import { getPostRepository } from '../repositories/post.repository';
import { getPlatformAccountRepository } from '../repositories/platform-account.repository';
import { db } from '../../lib/db';

export class MetaPublishingService {
  private GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

  /**
   * Main entry point to publish a post.
   */
  async publishPost(postId: string): Promise<{ success: boolean; platformPostId?: string; error?: string }> {
    const postRepo = getPostRepository();
    const accountRepo = getPlatformAccountRepository();

    // 1. Fetch post details
    const { data: post, error: postErr } = await postRepo.findById(postId);
    if (postErr || !post) {
      return { success: false, error: postErr || 'Post not found' };
    }

    // 2. Fetch account details
    const { data: account, error: accErr } = await accountRepo.findById(post.accountId);
    if (accErr || !account) {
      return { success: false, error: accErr || 'Account not found' };
    }

    if (!account.accessToken) {
      return { success: false, error: 'Access token missing' };
    }

    try {
      let result: { id: string };

      if (account.platform === 'facebook') {
        result = await this.publishToFacebook(
          account.platformId,
          account.accessToken,
          post.content,
          post.mediaUrls
        );
      } else if (account.platform === 'instagram') {
        result = await this.publishToInstagram(
          account.platformId,
          account.accessToken,
          post.content,
          post.mediaUrls
        );
      } else {
        return { success: false, error: 'Unsupported platform' };
      }

      // 3. Update DB on success
      await db.posts.update({
        where: { id: postId },
        data: {
          status: 'published',
          platform_post_id: result.id,
          published_at: new Date(),
          error_message: null,
        },
      });

      return { success: true, platformPostId: result.id };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Meta API error';
      console.error(`[MetaPublishingService] Failed to publish post ${postId}:`, error);

      // 4. Update DB on failure
      await db.posts.update({
        where: { id: postId },
        data: {
          status: 'failed',
          error_message: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  private async publishToFacebook(pageId: string, accessToken: string, content: string, mediaUrls: string[]) {
    // Basic implementation: content + first media as link, or just content
    const params = new URLSearchParams({
      message: content,
      access_token: accessToken,
    });

    if (mediaUrls.length > 0) {
      params.append('link', mediaUrls[0]);
    }

    const response = await fetch(`${this.GRAPH_API_URL}/${pageId}/feed?${params.toString()}`, {
      method: 'POST',
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return { id: data.id };
  }

  private async publishToInstagram(igUserId: string, accessToken: string, content: string, mediaUrls: string[]) {
    if (mediaUrls.length === 0) {
      throw new Error('Instagram requires at least one image or video');
    }

    // Step 1: Create Media Container
    const containerParams = new URLSearchParams({
      image_url: mediaUrls[0], // IG Graph API for single images
      caption: content,
      access_token: accessToken,
    });

    const containerRes = await fetch(`${this.GRAPH_API_URL}/${igUserId}/media?${containerParams.toString()}`, {
      method: 'POST',
    });

    const containerData = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    const creationId = containerData.id;

    // Step 2: Publish Media
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    const publishRes = await fetch(`${this.GRAPH_API_URL}/${igUserId}/media_publish?${publishParams.toString()}`, {
      method: 'POST',
    });

    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    return { id: publishData.id };
  }
}

// Singleton helper
let instance: MetaPublishingService | null = null;
export function getMetaPublishingService() {
  if (!instance) {
    instance = new MetaPublishingService();
  }
  return instance;
}
