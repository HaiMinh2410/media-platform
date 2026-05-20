import { Platform, PLATFORM_CONSTRAINTS, PlatformLimits } from './platform-constraints';

export interface ValidationContext {
  platforms: Platform[];
  content: string;
  mediaCount: number;
  mediaTypes: ('image' | 'video')[];
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  platform?: Platform;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  effectiveLimits: PlatformLimits;
}

export class ValidationEngine {
  /**
   * Calculates the strictest limits based on the selected platforms.
   */
  static getEffectiveLimits(platforms: Platform[]): PlatformLimits {
    if (platforms.length === 0) {
      return {
        maxLength: Infinity,
        maxHashtags: null,
        maxMedia: Infinity,
        allowedMediaTypes: ['image', 'video'],
      };
    }

    const limits = platforms.map(p => PLATFORM_CONSTRAINTS[p]);

    const maxLength = Math.min(...limits.map(l => l.maxLength));
    
    // Hashtags: null means no limit. So we only consider numbers.
    const hashtagLimits = limits.map(l => l.maxHashtags).filter((h): h is number => h !== null);
    const maxHashtags = hashtagLimits.length > 0 ? Math.min(...hashtagLimits) : null;

    const maxMedia = Math.min(...limits.map(l => l.maxMedia));

    // Allowed media types should be intersection of all allowed types
    const allowedMediaTypes = limits.reduce((acc, curr) => {
      return acc.filter(type => curr.allowedMediaTypes.includes(type));
    }, ['image', 'video'] as ('image' | 'video')[]);

    return {
      maxLength,
      maxHashtags,
      maxMedia,
      allowedMediaTypes,
    };
  }

  static countHashtags(content: string): number {
    const matches = content.match(/#[\w\u0590-\u05ff]+/g);
    return matches ? matches.length : 0;
  }

  static validate(context: ValidationContext): ValidationResult {
    const limits = this.getEffectiveLimits(context.platforms);
    const issues: ValidationIssue[] = [];
    
    // Text Length
    if (context.content.length > limits.maxLength) {
      issues.push({
        type: 'error',
        message: `Nội dung vượt quá giới hạn tối đa ${limits.maxLength} ký tự.`
      });
    }

    // Hashtags
    if (limits.maxHashtags !== null) {
      const hashtagCount = this.countHashtags(context.content);
      if (hashtagCount > limits.maxHashtags) {
        issues.push({
          type: 'error',
          message: `Quá nhiều hashtag (${hashtagCount}/${limits.maxHashtags}). Vui lòng giảm bớt.`
        });
      }
    }

    // Media count
    if (context.mediaCount > limits.maxMedia) {
      issues.push({
        type: 'error',
        message: `Quá nhiều tệp đính kèm (${context.mediaCount}/${limits.maxMedia}).`
      });
    }

    // Media types
    const uniqueInvalidTypes = Array.from(new Set(context.mediaTypes.filter(type => !limits.allowedMediaTypes.includes(type))));
    if (uniqueInvalidTypes.length > 0) {
      issues.push({
        type: 'error',
        message: `Định dạng không được hỗ trợ: ${uniqueInvalidTypes.join(', ')}. Các nền tảng đã chọn chỉ hỗ trợ: ${limits.allowedMediaTypes.join(', ')}.`
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      effectiveLimits: limits,
    };
  }
}
