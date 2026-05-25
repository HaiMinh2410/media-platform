export type Platform = 'facebook' | 'instagram' | 'tiktok';
export type ViewMode = 'reach' | 'views';

interface Benchmark {
  excellent: number;
  good: number;
  average: number;
  label: string; // Tên hiển thị trong prompt
}

// Nguồn cập nhật: Socialinsider, Metricool, Rival IQ (Dữ liệu mới nhất)
// Chỉ số đại diện cho tỷ lệ % tương tác dựa trên Reach (Reach Rate) hoặc Views (View Interaction Rate)
export const PLATFORM_BENCHMARKS: Record<Platform, Record<ViewMode, Benchmark>> = {
  facebook: {
    reach: {
      excellent: 2.5,   // Facebook Reach tốt hiện tại khó vượt mốc 3% organic
      good: 0.8,
      average: 0.15,    // Mức trung bình của đa số các ngành hiện tại quanh 0.15% - 0.2%
      label: 'Facebook Reach → Engagement',
    },
    views: {
      excellent: 4.0,
      good: 1.5,
      average: 0.3,
      label: 'Facebook Views → Interaction',
    },
  },
  instagram: {
    reach: {
      excellent: 5.0,   // Instagram tổng thể giảm nhẹ, mức xuất sắc đạt khoảng 5%
      good: 2.2,
      average: 0.7,     // Trung bình ngành dao động từ 0.45% đến 0.8%
      label: 'Instagram Reach → Engagement',
    },
    views: {
      excellent: 8.5,   // Chủ yếu gánh bởi Reels
      good: 3.5,
      average: 1.2,
      label: 'Instagram Views → Interaction',
    },
  },
  tiktok: {
    reach: {
      excellent: 7.5,   // Tài khoản nhỏ vẫn có thể đạt reach-to-engagement cao
      good: 3.5,
      average: 1.5,     // Mức trung bình ổn định toàn nền tảng
      label: 'TikTok Reach → Engagement',
    },
    views: {
      excellent: 5.5,   // TikTok view phân phối rất rộng (Mass view) nhưng tỷ lệ chuyển đổi thành hành động (like/comment) trên view thực tế sẽ loãng hơn
      good: 1.8,
      average: 0.4,
      label: 'TikTok Views → Interaction',
    },
  },
};

export function getRatingLabel(rate: number, platform: Platform, mode: ViewMode): string {
  const b = PLATFORM_BENCHMARKS[platform]?.[mode];
  if (!b) return `không xác định`;
  if (rate >= b.excellent) return `xuất sắc (top tier ${platform}, chuẩn ngành >${b.excellent}%)`;
  if (rate >= b.good)      return `tốt (trên chuẩn ${platform} >${b.good}%)`;
  if (rate >= b.average)   return `trung bình (chuẩn ${platform} >${b.average}%)`;
  return `yếu (dưới chuẩn ${platform} ${b.average}%, cần cải thiện ngay)`;
}

// Platform-specific context để inject vào prompt - Phân tích sâu chuyên biệt theo Rival IQ, Metricool và Socialinsider
export const PLATFORM_CONTEXT: Record<Platform, string> = {
  facebook:  'Facebook (Ưu tiên Direct Share qua Messenger, Content-First Reels; bóp mạnh Reach của link ngoài và bài đăng thuần text)',
  instagram: 'Instagram (Trọng số lớn nhất đặt vào Gửi tin nhắn/DM Share; Carousel và Reels dẫn đầu khả năng giữ chân; ưu tiên SEO từ khóa hơn Hashtag)',
  tiktok:    'TikTok (Thời gian xem trung bình và Tỷ lệ xem hết quyết định phân phối; SEO tìm kiếm lên ngôi; Share và Lưu là tín hiệu tăng trưởng mạnh)',
};

export function getRatingKey(
  rate: number,
  platform: Platform,
  mode: ViewMode
): 'excellent' | 'good' | 'average' | 'weak' {
  const b = PLATFORM_BENCHMARKS[platform]?.[mode];
  if (!b) return 'weak';
  if (rate >= b.excellent) return 'excellent';
  if (rate >= b.good)      return 'good';
  if (rate >= b.average)   return 'average';
  return 'weak';
}

