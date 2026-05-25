export interface PerformanceInsight {
  rating: 'excellent' | 'good' | 'average' | 'weak';
  evaluation: string;  // Câu 1: đánh giá + so ngưỡng, CÓ số liệu thực
  cause: string;       // Câu 2: nguyên nhân đặc thù platform
  action: string;      // Câu 3-4: hành động cụ thể + cách đo
  expectation: string; // Câu 5: kỳ vọng kết quả sau hành động
}
