import { MetaBaseAdapter } from './meta-base.adapter';
import { MetaPublishResponse } from '@/domain/types/meta';

/**
 * Adapter xử lý việc đăng bài lên Facebook Page.
 *
 * Tất cả methods nhận:
 * - accountId: UUID nội bộ (dùng để lấy token)
 * - pageId: Facebook Page ID thực (dùng trong endpoint API)
 */
export class FBPageAdapter extends MetaBaseAdapter {
  /**
   * Đăng bài viết lên Facebook Page.
   * Endpoint: POST /v19.0/{page_id}/feed
   */
  async publishPost(
    accountId: string,
    pageId: string,
    params: {
      message?: string;
      link?: string;
      mediaIds?: string[];
    }
  ) {
    const apiParams: Record<string, any> = {};

    if (params.message) apiParams.message = params.message;
    if (params.link) apiParams.link = params.link;

    if (params.mediaIds && params.mediaIds.length > 0) {
      // attached_media format: [{"media_fbid":"123"},{"media_fbid":"456"}]
      apiParams.attached_media = JSON.stringify(
        params.mediaIds.map(id => ({ media_fbid: id }))
      );
    }

    return this.request<MetaPublishResponse>(accountId, `${pageId}/feed`, apiParams, 'POST');
  }

  /**
   * Upload ảnh lên Facebook Page (chế độ ẩn - published=false).
   * Trả về media_fbid để dùng cho publishPost.
   * Endpoint: POST /v19.0/{page_id}/photos
   */
  async uploadPhoto(accountId: string, pageId: string, url: string) {
    return this.request<{ id: string }>(accountId, `${pageId}/photos`, {
      url,
      published: 'false'
    }, 'POST');
  }

  /**
   * Upload video lên Facebook Page.
   * Endpoint: POST /v19.0/{page_id}/videos
   */
  async uploadVideo(accountId: string, pageId: string, params: { fileUrl: string; title?: string; description?: string }) {
    return this.request<{ id: string }>(accountId, `${pageId}/videos`, {
      file_url: params.fileUrl,
      title: params.title,
      description: params.description,
    }, 'POST');
  }

  /**
   * Khởi tạo tiến trình Resumable Upload cho Video lớn (>100MB).
   */
  async startResumableVideoUpload(accountId: string, pageId: string, fileSize: number) {
    return this.request<{ upload_session_id: string; video_id: string }>(accountId, `${pageId}/videos`, {
      upload_phase: 'start',
      file_size: fileSize
    }, 'POST');
  }
}

// Singleton helper
let instance: FBPageAdapter | null = null;

export function getFBPageAdapter() {
  if (!instance) {
    instance = new FBPageAdapter();
  }
  return instance;
}
