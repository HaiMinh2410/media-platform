// src/application/ai-agent/templates/index.ts
//
// Quản lý và cung cấp câu thoại mẫu (templates) cho AI Agent dựa trên FanType và ConversationStage.
// Hỗ trợ chọn ngẫu nhiên để tăng tính sinh động và tự động thay thế liên kết (link) nếu có.

import type { FanType, ConversationStage } from '@/domain/types/ai-agent';
import { fanLuyTemplates } from './fan-luy.templates';
import { fanCoolTemplates } from './fan-cool.templates';
import { fanWhaleTemplates } from './fan-whale.templates';
import { fanDrainerTemplates } from './fan-drainer.templates';

/**
 * Lấy một câu thoại mẫu ngẫu nhiên từ ngân hàng mẫu tương ứng với loại fan và giai đoạn hội thoại.
 *
 * @param fanType Loại fan ('Luy' | 'Cool' | 'Whale' | 'Drainer' | 'Unknown')
 * @param stage Giai đoạn hội thoại ('G1' | 'G2' | 'G3')
 * @param link Liên kết sản phẩm/kênh riêng tư để thay thế placeholder {{link}} (nếu có)
 * @returns Câu trả lời mẫu đã được điền liên kết (nếu có) và chọn ngẫu nhiên
 */
export function getTemplateResponse(
  fanType: FanType,
  stage: ConversationStage,
  link?: string | null
): string {
  let templateArray: readonly string[];

  // 1. Lựa chọn bộ template phù hợp theo FanType
  switch (fanType) {
    case 'Luy':
      templateArray = fanLuyTemplates[stage];
      break;
    case 'Cool':
      templateArray = fanCoolTemplates[stage];
      break;
    case 'Whale':
      templateArray = fanWhaleTemplates[stage];
      break;
    case 'Drainer':
      templateArray = fanDrainerTemplates[stage];
      break;
    case 'Unknown':
    default:
      // Đối với fan chưa phân loại (Unknown), sử dụng bộ template lịch sự, nhẹ nhàng của Fan Lạnh (Cool) làm mặc định
      templateArray = fanCoolTemplates[stage];
      break;
  }

  // 2. Dự phòng nếu mảng rỗng (đảm bảo an toàn tuyệt đối)
  if (!templateArray || templateArray.length === 0) {
    console.warn(`⚠️ [TemplateEngine] No templates found for fanType: ${fanType}, stage: ${stage}. Using fallback.`);
    templateArray = [
      "Dạ em chào anh nha, hihi. Em rất vui vì được làm quen và trò chuyện cùng anh ạ! Chúc anh một ngày vui tươi nhen. 🥰"
    ];
  }

  // 3. Chọn ngẫu nhiên một câu thoại trong mảng
  const randomIndex = Math.floor(Math.random() * templateArray.length);
  let selectedTemplate = templateArray[randomIndex];

  // 4. Thay thế placeholder {{link}} bằng link thực tế nếu được cung cấp
  if (link) {
    selectedTemplate = selectedTemplate.replace(/\{\{link\}\}/g, link);
  } else {
    // Nếu hông có link, dọn dẹp các cụm từ liên kết hoặc xóa placeholder đi để tránh hiển thị thô
    selectedTemplate = selectedTemplate.replace(/\{\{link\}\}/g, '').trim();
    // Thay thế khoảng trắng thừa hoặc dấu hai chấm thừa ở cuối nếu có
    selectedTemplate = selectedTemplate.replace(/:\s*$/, '').trim();
  }

  return selectedTemplate;
}

// Re-export tất cả template để các module khác có thể sử dụng trực tiếp nếu cần phân tích nâng cao
export { fanLuyTemplates, fanCoolTemplates, fanWhaleTemplates, fanDrainerTemplates };
