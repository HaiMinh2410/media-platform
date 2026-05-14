/**
 * Service quản lý các Feature Flags cho ứng dụng.
 * Hỗ trợ cơ chế Canary Rollout (triển khai dần) dựa trên mã hash của User ID.
 */
export class FeatureFlagService {
  /**
   * Kiểm tra xem một tính năng có đang được kích hoạt cho người dùng cụ thể hay không.
   * @param userId ID của người dùng.
   * @param flag Tên của tính năng (ví dụ: 'SOCIAL_PUBLISHER_PRO').
   * @param rolloutPercentage Tỷ lệ kích hoạt (0 - 100).
   */
  static isEnabled(userId: string | undefined, flag: string, rolloutPercentage: number = 0): boolean {
    if (!userId) return false;

    // 1. Kiểm tra ghi đè qua biến môi trường (để DEV hoặc ADMIN ép bật/tắt)
    const envKey = `NEXT_PUBLIC_FLAG_${flag.toUpperCase()}`;
    // Lưu ý: Trong Client-side, process.env.NEXT_PUBLIC_... được inline lúc build.
    // Ở Server-side, chúng ta có thể check process.env.
    const envValue = process.env[envKey];
    if (envValue === 'true') return true;
    if (envValue === 'false') return false;

    // 2. Canary Rollout logic (Deterministic Hashing)
    // Đảm bảo cùng một người dùng sẽ luôn thấy cùng một trạng thái bật/tắt cho cùng một flag.
    if (rolloutPercentage > 0) {
      const hash = this.simpleHash(userId + flag);
      const score = hash % 100;
      return score < rolloutPercentage;
    }

    return false;
  }

  /**
   * Tạo mã hash đơn giản từ chuỗi để phân nhóm người dùng.
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Chuyển thành số nguyên 32-bit
    }
    return Math.abs(hash);
  }
}

// Danh sách các Flags hiện tại
export const FLAGS = {
  SOCIAL_PUBLISHER_PRO: 'SOCIAL_PUBLISHER_PRO'
} as const;
