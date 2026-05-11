// src/application/ai-agent/safety-checker.ts
//
// Bộ kiểm tra an toàn và tuân thủ (Safety & Compliance Checker) cho AI DM Agent.
// Mục tiêu:
// 1. Lọc và tự động thay thế các từ khóa nhạy cảm có nguy cơ bị Instagram quét và flag tài khoản.
// 2. Thiết lập độ trễ phản hồi (reply delay) ngẫu nhiên, mô phỏng hành vi nhắn tin của con người để chống spam-check.

import type { FanProfile, SafetyCheckResult, SafetyViolation } from '@/domain/types/ai-agent';
import { KEYWORD_REPLACEMENTS, AI_AGENT_DEFAULTS } from '@/domain/types/ai-agent';

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
 * Tính toán thời gian trì hoãn trả lời (reply delay) ngẫu nhiên.
 * Ưu tiên chạy theo cấu hình trên giao diện (Persona Settings). Nếu không có, hệ thống sẽ áp dụng
 * mốc mặc định tối ưu mới từ 15 phút đến 1 giờ nhằm giả lập hành vi nhắn tin tự nhiên của con người.
 *
 * @param profile FanProfile hiện tại của khách hàng
 * @param persona Đối tượng AIPersona chứa cấu hình của tài khoản (nếu có)
 * @returns Thời gian trì hoãn phản hồi tính bằng miliseconds (ms)
 */
export function calculateDelay(profile: FanProfile, persona?: any): number {
  // 1. Ưu tiên cấu hình trì hoãn trên giao diện (Persona Settings)
  const delayMin = persona?.settings?.delay_min;
  const delayMax = persona?.settings?.delay_max;

  if (typeof delayMin === 'number' && typeof delayMax === 'number' && delayMax >= delayMin) {
    const minMs = delayMin * 1000;
    const maxMs = delayMax * 1000;
    const calculated = minMs + Math.random() * (maxMs - minMs);
    console.log(`⏱️ [SafetyChecker] Calculated delay from Persona settings: min=${delayMin}s, max=${delayMax}s -> chosen=${(calculated / 1000).toFixed(2)}s`);
    return calculated;
  }

  // 2. Dự phòng mặc định: Trì hoãn ngẫu nhiên từ 15 phút đến 1 giờ
  const baseDelay = 15 * 60 * 1000; // 15 phút (ms)
  const maxDelay = 60 * 60 * 1000;  // 1 giờ (ms)

  // - Fan Whale (Khách Vip) -> Trả lời ưu tiên nhanh nhất (Cố định 15 phút)
  if (profile.fanType === 'Whale') {
    return baseDelay;
  }

  // - Fan Lụy (Luy) -> Trì hoãn trung bình từ 15 phút đến 30 phút
  if (profile.fanType === 'Luy') {
    const additionalRandomMs = Math.random() * 15 * 60 * 1000; // Random thêm tối đa 15 phút (ms)
    return baseDelay + additionalRandomMs;
  }

  // - Các nhóm đối tượng khác (Cool, Drainer, Unknown) -> Trì hoãn ngẫu nhiên từ 15 phút đến 1 giờ
  const additionalRandomMs = Math.random() * (maxDelay - baseDelay); // Random thêm tối đa 45 phút (ms)
  return baseDelay + additionalRandomMs;
}

/**
 * Kiểm tra tần suất gửi link (Link Rate Limiter) nhằm bảo vệ tài khoản chống bị spam-check.
 * Tuân thủ quy định tối thiểu LINK_MIN_INTERVAL_DAYS (mặc định là 7 ngày) giữa 2 lần gửi link.
 *
 * @param profile FanProfile hiện tại của khách hàng
 * @returns Kết quả kiểm tra bao gồm trạng thái isSafe và chi tiết vi phạm nếu có
 */
export function checkLinkRateLimit(profile: FanProfile): { isSafe: boolean; violation?: SafetyViolation } {
  if (!profile.lastLinkSentAt) {
    return { isSafe: true };
  }

  const lastSent = new Date(profile.lastLinkSentAt);
  const diffTime = Math.abs(Date.now() - lastSent.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  const minIntervalDays = AI_AGENT_DEFAULTS.LINK_MIN_INTERVAL_DAYS;

  if (diffDays < minIntervalDays) {
    return {
      isSafe: false,
      violation: {
        type: 'link_rate_exceeded',
        detail: `Khoảng cách giữa 2 lần gửi link quá ngắn (${diffDays.toFixed(2)} ngày). Quy định tối thiểu: ${minIntervalDays} ngày.`,
        severity: 'warn'
      }
    };
  }

  return { isSafe: true };
}
