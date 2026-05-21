/**
 * Hằng số thời gian tính bằng Mili-giây để tránh Magic Numbers trong logic
 */
export const MILLISECONDS_IN_SECOND = 1000;
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;

export const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE;
export const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * MINUTES_IN_HOUR;
export const MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR * HOURS_IN_DAY;

export const REALTIME_REFRESH_POLL_INTERVAL_MS = 10000;
export const REALTIME_POLL_RETRIES_MS = [1000, 2000, 4000, 6000, 8000];
export const SCHEDULER_CHECK_INTERVAL_MS = 1000;

export const MAX_VISIBLE_SUGGESTIONS = 5;

/**
 * Định dạng tên Model hiển thị thân thiện với người dùng
 */
export function formatModelName(model: string): string {
  if (model.includes('llama-3.3-70b')) return 'LLaMA 3.3 70B';
  if (model.includes('llama-3.1-8b')) return 'LLaMA 3.1 8B';
  if (model.includes('qwen-qwq-32b')) return 'Qwen3 32B';
  if (model.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
  return model;
}

/**
 * Tính toán thời gian đã trôi qua
 */
export function calculateTimeAgo(isoString: string): string {
  const timeDifferenceInMilliseconds = Date.now() - new Date(isoString).getTime();
  const minutesDifference = Math.floor(timeDifferenceInMilliseconds / MILLISECONDS_IN_MINUTE);
  
  if (minutesDifference < 1) {
    return 'vừa xong';
  }
  if (minutesDifference < MINUTES_IN_HOUR) {
    return `${minutesDifference} phút trước`;
  }
  
  const hoursDifference = Math.floor(timeDifferenceInMilliseconds / MILLISECONDS_IN_HOUR);
  if (hoursDifference < HOURS_IN_DAY) {
    return `${hoursDifference} giờ trước`;
  }
  
  const daysDifference = Math.floor(timeDifferenceInMilliseconds / MILLISECONDS_IN_DAY);
  return `${daysDifference} ngày trước`;
}

/**
 * Cấu hình Kiểu tính cách của Fan (Fan Personality Type)
 */
export type FanPersonalityConfiguration = {
  label: string;
  styleClass: string;
  description: string;
};

export const FAN_PERSONALITY_CONFIG: Record<string, FanPersonalityConfiguration> = {
  luy: {
    label: 'Lụy (Emotional)',
    styleClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]',
    description: 'Thân thiện, nhiều cảm xúc, nhắn tin dài, dùng nhiều emoji. Cần xoa dịu bằng cảm xúc (Emotional Banking).'
  },
  cool: {
    label: 'Lạnh lùng (Cool)',
    styleClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]',
    description: 'Trả lời ngắn (1-3 từ), ít emoji, ít hỏi han. Áp dụng kỹ thuật Tease & Withdraw.'
  },
  whale: {
    label: 'VIP (Whale)',
    styleClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] font-black',
    description: 'Hỏi thẳng giá, dịch vụ cao cấp, chốt nhanh. Ưu tiên gửi liên kết chốt đơn ngay lập tức.'
  },
  drainer: {
    label: 'Bào sức (Drainer)',
    styleClass: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
    description: 'Đòi nội dung/ảnh miễn phí, né tránh mua hàng. Giới hạn tương tác, rút lui lịch sự.'
  },
  default: {
    label: 'Chưa rõ (Unknown)',
    styleClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    description: 'Đang thu thập và phân tích lịch sử trò chuyện để phân loại Fan.'
  }
};

export function getFanPersonalityConfiguration(personalityType: string): FanPersonalityConfiguration {
  const normalizedType = personalityType ? personalityType.toLowerCase() : 'default';
  return FAN_PERSONALITY_CONFIG[normalizedType] || FAN_PERSONALITY_CONFIG.default;
}

/**
 * Cấu hình Giai đoạn hội thoại (Conversation Stage)
 */
export type ConversationStageConfiguration = {
  label: string;
  styleClass: string;
  targetGoal: string;
};

export const CONVERSATION_STAGE_CONFIG: Record<string, ConversationStageConfiguration> = {
  G1: {
    label: 'G1 - Kết nối',
    styleClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    targetGoal: 'Xây dựng lòng tin (Build Trust)'
  },
  G2: {
    label: 'G2 - Làm ấm',
    styleClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    targetGoal: 'Khơi gợi nhu cầu (Warm-up)'
  },
  G3: {
    label: 'G3 - Gửi Link',
    styleClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    targetGoal: 'Chốt đơn/Bán hàng (Upsell)'
  },
  default: {
    label: 'Chưa rõ',
    styleClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    targetGoal: 'Không xác định'
  }
};

export function getConversationStageConfiguration(stage: string): ConversationStageConfiguration {
  const normalizedStage = stage ? stage.toUpperCase() : 'DEFAULT';
  return CONVERSATION_STAGE_CONFIG[normalizedStage] || {
    label: stage,
    styleClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    targetGoal: 'Không xác định'
  };
}

/**
 * Cấu hình Hành động khuyên dùng tiếp theo (Next Action)
 */
export type NextActionConfiguration = {
  label: string;
  styleClass: string;
};

export const NEXT_ACTION_CONFIG: Record<string, NextActionConfiguration> = {
  continue: {
    label: 'Tiếp tục trò chuyện tự nhiên',
    styleClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20 border'
  },
  send_link: {
    label: 'Gửi liên kết chốt đơn',
    styleClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold border animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.1)]'
  },
  soft_exit: {
    label: 'Giãn cách, rút lui lịch sự',
    styleClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 border'
  },
  escalate_to_human: {
    label: 'Chuyển giao cho Nhân viên xử lý',
    styleClass: 'text-red-400 bg-red-500/15 border-red-500/30 font-bold border shadow-[0_0_12px_rgba(239,68,68,0.1)]'
  },
  wait: {
    label: 'Đợi khách hàng phản hồi',
    styleClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20 border'
  },
  default: {
    label: 'Không xác định',
    styleClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20 border'
  }
};

export function getNextActionConfiguration(action: string): NextActionConfiguration {
  const normalizedAction = action ? action.toLowerCase() : 'default';
  return NEXT_ACTION_CONFIG[normalizedAction] || {
    label: action,
    styleClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20 border'
  };
}
