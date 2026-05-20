export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'threads';

export interface PlatformLimits {
  maxLength: number;
  maxHashtags: number | null; // null means no hard limit
  maxMedia: number;
  allowedMediaTypes: ('image' | 'video')[];
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformLimits> = {
  facebook: {
    maxLength: 63206,
    maxHashtags: null,
    maxMedia: 10,
    allowedMediaTypes: ['image', 'video'],
  },
  instagram: {
    maxLength: 2200,
    maxHashtags: 30,
    maxMedia: 10,
    allowedMediaTypes: ['image', 'video'],
  },
  tiktok: {
    maxLength: 2200,
    maxHashtags: null,
    maxMedia: 35, // TikTok photo mode allows up to 35 images
    allowedMediaTypes: ['video', 'image'],
  },
  youtube: {
    maxLength: 5000, // Description length
    maxHashtags: 15,
    maxMedia: 1, // Usually 1 video
    allowedMediaTypes: ['video'],
  },
  threads: {
    maxLength: 500,
    maxHashtags: null,
    maxMedia: 10,
    allowedMediaTypes: ['image', 'video'],
  }
};
