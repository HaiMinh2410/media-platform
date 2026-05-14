import { MetaBaseAdapter } from './meta-base.adapter';
import { MetaPublishResponse } from '@/domain/types/meta';

/**
 * Adapter xử lý việc đăng bài lên Facebook Page.
 */
export class FBPageAdapter extends MetaBaseAdapter {
  /**
   * Đăng bài viết (status, link, hoặc kèm ảnh/video đã upload).
   * Endpoint: POST /v19.0/{page_id}/feed
   */
  async publishPost(
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

    return this.request<MetaPublishResponse>(pageId, `${pageId}/feed`, apiParams, 'POST');
  }

  /**
   * Upload ảnh lên Facebook Page (chế độ ẩn - published=false).
   * Trả về media_fbid để dùng cho publishPost.
   * Endpoint: POST /v19.0/{page_id}/photos
   */
  async uploadPhoto(pageId: string, url: string) {
    return this.request<{ id: string }>(pageId, `${pageId}/photos`, {
      url,
      published: 'false'
    }, 'POST');
  }

  /**
   * Upload video lên Facebook Page.
   * Hiện tại hỗ trợ phương thức truyền URL (Meta tự download).
   * Endpoint: POST /v19.0/{page_id}/videos
   */
  async uploadVideo(pageId: string, params: { fileUrl: string; title?: string; description?: string }) {
    return this.request<{ id: string }>(pageId, `${pageId}/videos`, {
      file_url: params.fileUrl,
      title: params.title,
      description: params.description,
    }, 'POST');
  }

  /**
   * Khởi tạo tiến trình Resumable Upload cho Video lớn (>100MB).
   * Note: Đây là bước 1 trong quy trình 3 bước của Meta.
   */
  async startResumableVideoUpload(pageId: string, fileSize: number) {
    return this.request<{ upload_session_id: string; video_id: string }>(pageId, `${pageId}/videos`, {
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
