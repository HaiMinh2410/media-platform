import { MetaBaseAdapter } from './meta-base.adapter';
import { MetaMediaContainerResponse, MetaPublishResponse } from '@/domain/types/meta';

/**
 * Adapter xử lý việc đăng bài lên Instagram Business.
 * Quy trình Instagram yêu cầu tạo Container trước khi Publish.
 *
 * Tất cả methods nhận:
 * - accountId: UUID nội bộ (dùng để lấy token)
 * - igUserId: Instagram Business Account ID thực (dùng trong endpoint API)
 */
export class IGBusinessAdapter extends MetaBaseAdapter {
  /**
   * Tạo media container cho một ảnh duy nhất.
   * Endpoint: POST /v19.0/{ig_user_id}/media
   */
  async createImageContainer(accountId: string, igUserId: string, imageUrl: string, caption?: string) {
    return this.request<MetaMediaContainerResponse>(accountId, `${igUserId}/media`, {
      image_url: imageUrl,
      caption: caption
    }, 'POST');
  }

  /**
   * Tạo media container cho một video duy nhất.
   * Endpoint: POST /v19.0/{ig_user_id}/media
   */
  async createVideoContainer(accountId: string, igUserId: string, videoUrl: string, caption?: string) {
    return this.request<MetaMediaContainerResponse>(accountId, `${igUserId}/media`, {
      video_url: videoUrl,
      media_type: 'VIDEO',
      caption: caption
    }, 'POST');
  }

  /**
   * Tạo media container cho một item trong Carousel (ảnh hoặc video).
   * Phải set is_carousel_item = true.
   */
  async createCarouselItem(accountId: string, igUserId: string, mediaUrl: string, isVideo: boolean = false) {
    const params: Record<string, any> = {
      is_carousel_item: 'true'
    };

    if (isVideo) {
      params.video_url = mediaUrl;
      params.media_type = 'VIDEO';
    } else {
      params.image_url = mediaUrl;
    }

    return this.request<MetaMediaContainerResponse>(accountId, `${igUserId}/media`, params, 'POST');
  }

  /**
   * Tạo container tổng cho Carousel từ danh sách IDs các items.
   */
  async createCarouselContainer(accountId: string, igUserId: string, childrenIds: string[], caption?: string) {
    return this.request<MetaMediaContainerResponse>(accountId, `${igUserId}/media`, {
      media_type: 'CAROUSEL',
      children: childrenIds.join(','),
      caption: caption
    }, 'POST');
  }

  /**
   * Đăng container (Image/Video/Carousel) đã khởi tạo thành công.
   * Endpoint: POST /v19.0/{ig_user_id}/media_publish
   */
  async publishContainer(accountId: string, igUserId: string, creationId: string) {
    return this.request<MetaPublishResponse>(accountId, `${igUserId}/media_publish`, {
      creation_id: creationId
    }, 'POST');
  }

  /**
   * Kiểm tra trạng thái của container (quan trọng với Video).
   * Endpoint: GET /v19.0/{creation_id}?fields=status_code,status
   */
  async getContainerStatus(accountId: string, creationId: string) {
    return this.request<{ status_code: string; status: string }>(accountId, creationId, {
      fields: 'status_code,status'
    }, 'GET');
  }
}

// Singleton helper
let instance: IGBusinessAdapter | null = null;

export function getIGBusinessAdapter() {
  if (!instance) {
    instance = new IGBusinessAdapter();
  }
  return instance;
}
