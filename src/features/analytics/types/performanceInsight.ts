export interface PerformanceInsight {
  rating: 'excellent' | 'good' | 'average' | 'weak';
  evaluation: string;  // Câu 1: đánh giá + so ngưỡng, CÓ số liệu thực
  cause?: string;      // Câu 2: nguyên nhân đặc thù platform
  expectation: string; // Câu 3: kỳ vọng kết quả
}
