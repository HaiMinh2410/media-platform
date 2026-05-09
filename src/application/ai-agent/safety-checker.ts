// src/application/ai-agent/safety-checker.ts
//
// Bộ kiểm tra an toàn và tuân thủ (Safety & Compliance Checker) cho AI DM Agent.
// Mục tiêu:
// 1. Lọc và tự động thay thế các từ khóa nhạy cảm có nguy cơ bị Instagram quét và flag tài khoản.
// 2. Thiết lập độ trễ phản hồi (reply delay) ngẫu nhiên, mô phỏng hành vi nhắn tin của con người để chống spam-check.

import type { FanProfile, SafetyCheckResult, SafetyViolation } from '@/domain/types/ai-agent';
import { KEYWORD_REPLACEMENTS } from '@/domain/types/ai-agent';

/**
 * Lọc và tự động thay thế tất cả các từ khóa nhạy cảm nằm trong danh sách cấm (blacklist).
 * Thực hiện tìm kiếm không phân biệt chữ hoa thường (case-insensitive) và thay thế bằng từ ngữ an toàn hơn.
 *
 * @param text Văn bản phản hồi cần lọc
 * @returns Văn bản đã được làm sạch và thay thế an toàn
 */
export function filterBlacklist(text: string): string {
  if (!text) {
    return '';
  }

  let sanitized = text;

  // Lặp qua các cặp từ khóa cấm và cụm từ thay thế an toàn đã định nghĩa trong domain types
  for (const [keyword, replacement] of Object.entries(KEYWORD_REPLACEMENTS)) {
    // Tạo regular expression không phân biệt chữ hoa chữ thường và thay thế toàn cục
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  }

  return sanitized;
}

/**
 * Kiểm tra an toàn toàn diện cho một phản hồi của AI Agent.
 * Đánh giá xem có vi phạm từ khóa nhạy cảm nào không và sinh kết quả an toàn tương ứng.
 *
 * @param text Văn bản phản hồi của Agent
 * @returns Đối tượng kết quả kiểm tra an toàn SafetyCheckResult
 */
export function checkSafety(text: string): SafetyCheckResult {
  if (!text) {
    return {
      isSafe: true,
      violations: [],
      sanitizedReply: ''
    };
  }

  const sanitizedReply = filterBlacklist(text);
  const violations: SafetyViolation[] = [];

  // So sánh văn bản gốc và văn bản sau khi làm sạch để phát hiện vi phạm từ khóa cấm
  if (text !== sanitizedReply) {
    // Tìm cụ thể từ khóa nào đã bị kích hoạt để đưa vào chi tiết log
    const triggeredKeywords: string[] = [];
    for (const keyword of Object.keys(KEYWORD_REPLACEMENTS)) {
      if (new RegExp(keyword, 'i').test(text)) {
        triggeredKeywords.push(keyword);
      }
    }

    violations.push({
      type: 'blacklist_keyword',
      detail: `Phát hiện từ khóa nhạy cảm bị cấm: [${triggeredKeywords.join(', ')}]`,
      severity: 'warn' // 'warn': Tự động rewrite làm sạch nội dung chứ không block hoàn toàn cuộc chat
    });

    console.warn(
      `🔒 [SafetyChecker] Blacklist violation resolved. Triggered: [${triggeredKeywords.join(
        ', '
      )}]. Output rewritten.`
    );
  }

  return {
    isSafe: true, // Vì chúng ta tự động làm sạch (sanitize/rewrite) nên phản hồi cuối cùng vẫn được coi là an toàn để gửi
    violations,
    sanitizedReply
  };
}

/**
 * Tính toán thời gian trì hoãn trả lời (reply delay) ngẫu nhiên từ 30 phút đến 4 giờ.
 * Nhằm giả lập hành vi nhắn tin của một con người thực sự, tránh hệ thống chống spam của Instagram dán nhãn là bot.
 * Trực tiếp tối ưu hóa thời gian phản hồi có chủ đích theo từng nhóm đối tượng fan cụ thể:
 *
 * - Fan Whale: Eager & Priority -> Cố định 30 phút (trả lời nhanh nhất có thể để giữ chân khách VIP).
 * - Fan Lụy (Luy): Warm & Engaged -> Trì hoãn từ 30 phút đến 1.5 giờ.
 * - Các loại Fan khác (Cool, Drainer, Unknown): Standard -> Trì hoãn ngẫu nhiên từ 30 phút đến 4 giờ.
 *
 * @param profile FanProfile hiện tại của khách hàng
 * @returns Thời gian trì hoãn phản hồi tính bằng miliseconds (ms)
 */
export function calculateDelay(profile: FanProfile): number {
  const baseDelay = 30 * 60 * 1000; // 30 phút (ms)
  const maxDelay = 4 * 60 * 60 * 1000; // 4 giờ (ms)

  // 1. Fan Whale (Khách Vip) -> Trả lời ưu tiên nhanh nhất (Cố định 30 phút)
  if (profile.fanType === 'Whale') {
    return baseDelay;
  }

  // 2. Fan Lụy (Luy) -> Trì hoãn trung bình từ 30 phút đến 1.5 giờ
  if (profile.fanType === 'Luy') {
    const additionalRandomMs = Math.random() * 60 * 60 * 1000; // Random thêm tối đa 1 giờ (ms)
    return baseDelay + additionalRandomMs;
  }

  // 3. Các nhóm đối tượng khác (Cool, Drainer, Unknown) -> Trì hoãn ngẫu nhiên từ 30 phút đến 4 giờ
  const additionalRandomMs = Math.random() * (maxDelay - baseDelay); // Random thêm tối đa 3.5 giờ (ms)
  return baseDelay + additionalRandomMs;
}
