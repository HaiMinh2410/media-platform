import { AIModel, AI_MODELS } from '@/domain/types/ai';

/**
 * AI Model Selector Logic (T073)
 * Automatically selects the best model based on message context.
 */
export function selectModel(params: {
  text: string;
  history?: string[];
  userConfiguredModel?: string;
}): AIModel {
  const { text, history = [], userConfiguredModel } = params;

  // Nếu user cấu hình model cụ thể (không phải "auto"), luôn ưu tiên dùng model đó
  if (userConfiguredModel && userConfiguredModel !== 'auto') {
    return userConfiguredModel as AIModel;
  }

  // 1. Kiểm tra context dài (history nhiều hoặc text dài)
  // Ngưỡng: history > 5 câu hoặc tổng text > 2000 chars
  const totalHistoryText = history.join('\n');
  const isLongContext = history.length > 5 || (text.length + totalHistoryText.length) > 2000;
  
  if (isLongContext) {
    return AI_MODELS.REASONING; // openai/gpt-oss-120b
  }

  // 2. Kiểm tra tiếng Việt / multilingual
  // Regex kiểm tra các ký tự có dấu đặc trưng của tiếng Việt
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const isVietnamese = vietnameseRegex.test(text) || vietnameseRegex.test(totalHistoryText);
  
  if (isVietnamese) {
    return AI_MODELS.CONVERSATION; // qwen-qwq-32b
  }

  // 3. Mặc định
  // Nếu có model mặc định từ config (dù là auto) thì trả về GENERATE (llama-3.3-70b-versatile)
  return AI_MODELS.GENERATE;
}
