// src/domain/types/ai-agent.ts
//
// Domain types cho AI DM Agent — DM Script Playbook 2.0
// Mục tiêu: Tự động chat tự nhiên, phân loại fan, dẫn dắt theo giai đoạn → chốt sale.
//
// Imports từ các types đã có — không duplicate.
import type { AIModel } from './ai';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: FAN CLASSIFICATION
// Phân loại fan dựa trên hành vi chat (3–5 tin nhắn đầu).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 4 loại fan theo DM Script Playbook 2.0 + trạng thái chưa xác định.
 *
 * - Luy (Emotional): Quan tâm cảm xúc, emoji nhiều, kéo dài chat.
 * - Cool: Trả lời ngắn, ít emoji, ít chủ động.
 * - Whale: Hỏi thẳng giá/gói/private, sẵn sàng chi tiền.
 * - Drainer: Đòi nội dung miễn phí, né mua, vòng vo.
 * - Unknown: Chưa đủ dữ liệu (dưới 3–4 tin nhắn).
 */
export type FanType = 'Luy' | 'Cool' | 'Whale' | 'Drainer' | 'Unknown';

/**
 * Giai đoạn hội thoại — dựa trên số ngày tương tác + emotion_score.
 *
 * - G1 (0–30 ngày): Build Trust — thân thiện, không flirt, không link.
 * - G2 (31–60 ngày): Warm-up & Flirt nhẹ — Flirt Ladder Level 1→3.
 * - G3 (61+ ngày): Upsell & Chốt — gợi mở + send link.
 */
export type ConversationStage = 'G1' | 'G2' | 'G3';

/**
 * Hành động tiếp theo của agent sau khi phân tích hội thoại.
 *
 * - continue        : Tiếp tục chat bình thường.
 * - send_link       : Gửi link sản phẩm/kênh riêng tư.
 * - soft_exit       : Kết thúc nhẹ nhàng, để ngỏ cơ hội.
 * - hard_exit       : Dừng hẳn (Drainer cứng đầu).
 * - escalate_to_human: Chuyển cho người thật xử lý.
 * - wait            : Chờ — không reply ngay (chủ đích).
 */
export type NextAction =
  | 'continue'
  | 'send_link'
  | 'soft_exit'
  | 'hard_exit'
  | 'escalate_to_human'
  | 'wait';

/** Mức độ rủi ro của hội thoại — dùng cho Safety Checker & escalation. */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Xu hướng emotion_score theo thời gian. */
export type EmotionTrend = 'increasing' | 'decreasing' | 'stable';

/**
 * Flirt level theo giai đoạn — tăng dần từ G1 → G3.
 *
 * - 0: Không flirt (G1)
 * - 1: "Nói chuyện với bạn mình thấy dễ chịu lạ" (G2 early)
 * - 2: "Không hiểu sao mình lại thích nói chuyện với bạn đến vậy" (G2 mid)
 * - 3: "Bạn làm mình cười suốt ấy" + gợi mở (G2 late / G3)
 */
export type FlirtLevel = 0 | 1 | 2 | 3;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: FAN PROFILE — Trạng thái hội thoại duy trì xuyên suốt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lịch sử mua hàng của fan.
 */
export type PurchaseRecord = {
  purchasedAt: Date;
  packageName: string;   // Tên gói (Basic / Premium / Custom)
  amount: number;        // Số tiền (VND hoặc USD)
  currency: string;
  notes?: string;
};

/**
 * Fan Profile — record duy nhất mỗi fan, lưu vào DB (bảng fan_profiles).
 * Cập nhật sau mỗi lượt hội thoại.
 */
export type FanProfile = {
  id: string;
  conversationId: string;        // FK → conversations.id
  workspaceId: string;           // FK → workspaces.id
  platformUserId: string;        // IGSID (Instagram) / PSID (Facebook)

  // ── Phân loại ──────────────────────────────────────────────────────────────
  fanType: FanType;
  fanTypeConfidence: number;     // 0.0 – 1.0 — độ chắc chắn của classifier
  stage: ConversationStage;
  flirtLevel: FlirtLevel;

  // ── Cảm xúc & Tương tác ────────────────────────────────────────────────────
  emotionScore: number;          // 0.0 – 1.0 — mức độ gắn bó cảm xúc
  emotionTrend: EmotionTrend;
  dayCount: number;              // Số ngày kể từ lần đầu tương tác
  messageCount: number;          // Tổng số tin đã trao đổi

  // ── Rủi ro ─────────────────────────────────────────────────────────────────
  riskLevel: RiskLevel;

  // ── Lịch sử & Insight ──────────────────────────────────────────────────────
  purchaseHistory: PurchaseRecord[];
  objectionsSeen: string[];      // Các objection đã gặp: ["đắt quá", "chưa tin"]
  keyInsights: string[];         // Chi tiết fan đã chia sẻ: ["nhân viên văn phòng", ...]

  // ── Hành động tiếp theo ────────────────────────────────────────────────────
  nextAction: NextAction;
  notes: string | null;          // Ghi chú thủ công cho lần chat tiếp theo

  // ── Link Rate Limiter ───────────────────────────────────────────────────────
  linkSentCount: number;
  lastLinkSentAt: Date | null;

  // ── Long Context Cache ──────────────────────────────────────────────────────
  lastSummary: ConversationSummary | null;  // Cache tóm tắt hội thoại dài

  // ── Timestamps ─────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: FAN CLASSIFIER — Input / Output
// ─────────────────────────────────────────────────────────────────────────────

/** Một lượt tin nhắn trong lịch sử hội thoại. */
export type ChatTurn = {
  role: 'fan' | 'agent';
  content: string;
  timestamp?: Date;
};

/** Input cho Fan Classifier (rule-based hoặc LLM). */
export type ClassifierInput = {
  conversationHistory: ChatTurn[];   // Lịch sử chat (tối thiểu 3–4 tin)
  currentFanProfile?: FanProfile;    // Profile hiện tại (nếu đã có)
  platform?: string;                 // 'instagram' | 'facebook'
};

/**
 * Output của Fan Classifier.
 * Trả về JSON từ LLM hoặc rule-based engine.
 */
export type ClassifierOutput = {
  fan_type: FanType;
  confidence: number;                // 0.0 – 1.0
  reasoning: string;                 // Giải thích ngắn gọn bằng tiếng Việt
  recommended_stage: ConversationStage;
  emotion_score: number;             // 0.0 – 1.0
  risk_level: RiskLevel;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

/** Service-level result cho Classifier (pattern { data, error }). */
export type ClassifierServiceResult = {
  data: ClassifierOutput | null;
  error: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DECISION ENGINE — Input / Output
// ─────────────────────────────────────────────────────────────────────────────

/** Context đầy đủ để Decision Engine chọn action. */
export type DecisionContext = {
  fanProfile: FanProfile;
  lastMessages: ChatTurn[];          // 4–6 tin nhắn gần nhất
  incomingMessage: string;           // Tin nhắn fan vừa gửi
  availableLink?: string;            // Link sản phẩm (nếu cấu hình)
};

/** Quyết định của engine. */
export type DecisionOutput = {
  action: NextAction;
  strategy: ResponseStrategy;        // Strategy gắn với fan type & stage
  shouldSendLink: boolean;
  linkToSend: string | null;
  flirtLevelTarget: FlirtLevel;      // Flirt level cần đạt trong reply này
};

/**
 * Strategy phản hồi theo ma trận Fan Type × Stage.
 *
 * - EmotionalBanking : Tích lũy cảm xúc — dùng cho Fan Lụy
 * - TeaseWithdraw    : Kích tò mò rồi rút lui — dùng cho Fan Lạnh
 * - StraightVIP      : Thẳng thắn + VIP feeling — dùng cho Whale
 * - GracefulExit     : Kết thúc nhẹ nhàng — dùng cho Drainer
 * - TrustBuilding    : Giai đoạn G1 — tất cả fan type
 */
export type ResponseStrategy =
  | 'TrustBuilding'
  | 'EmotionalBanking'
  | 'TeaseWithdraw'
  | 'StraightVIP'
  | 'GracefulExit';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: RESPONSE GENERATOR — Input / Output
// ─────────────────────────────────────────────────────────────────────────────

/** Input cho Response Generator (LLM). */
export type ResponseGeneratorInput = {
  fanProfile: FanProfile;
  recentMessages: ChatTurn[];        // 4–6 tin gần nhất (hoặc summary thay thế)
  incomingMessage: string;
  strategy: ResponseStrategy;
  decision: DecisionOutput;
  contextSummary?: ConversationSummary; // Dùng khi history > 50 tin
  model?: AIModel;                   // Override model nếu cần (Whale → 120B)
};

/**
 * Output của Response Generator.
 * LLM trả về JSON, được parse và validated.
 */
export type AgentResponse = {
  reply: string;                     // Tin nhắn thực tế gửi cho fan (tối đa 2–3 câu)
  action: NextAction;
  link: string | null;               // Link gửi kèm (nếu action = 'send_link')
  update_fan_type: FanType | null;   // Cập nhật fan type nếu classifier thay đổi
  update_emotion_score: number;      // Emotion score mới sau lượt chat này
  notes_for_next: string;            // Ghi chú cho lần chat tiếp theo
};

/** Service-level result cho Response Generator. */
export type ResponseGeneratorResult = {
  data: AgentResponse | null;
  error: string | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelUsed?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: OBJECTION HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Các loại objection phổ biến theo Playbook 2.0.
 */
export type ObjectionType =
  | 'too_expensive'      // "đắt quá", "mắc quá"
  | 'not_trusted'        // "chưa tin", "không biết có thật không"
  | 'too_busy'           // "bận", "lúc khác"
  | 'privacy_concern'    // "sợ lộ", "lo privacy"
  | 'want_free'          // "gửi ảnh trước", "cho xem thử", "miễn phí"
  | 'asking_price'       // Hỏi giá trực tiếp (không phải objection, cần info)
  | 'other';

/** Pattern để detect objection từ tin nhắn fan. */
export type ObjectionPattern = {
  type: ObjectionType;
  keywords: string[];                // Từ khóa trigger
  regex?: RegExp;                    // Regex pattern (optional)
};

/** Template phản hồi cho từng loại objection. */
export type ObjectionResponse = {
  type: ObjectionType;
  template: string;                  // Script phản hồi
  escalationPath: NextAction;        // Hành động sau khi trả lời objection
  requiresContext?: boolean;         // Cần personalize dựa trên fan profile
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: SAFETY CHECKER
// ─────────────────────────────────────────────────────────────────────────────

/** Kết quả kiểm tra an toàn cho một reply. */
export type SafetyCheckResult = {
  isSafe: boolean;
  violations: SafetyViolation[];
  sanitizedReply: string;            // Reply đã được làm sạch (nếu có vi phạm)
};

export type SafetyViolationType =
  | 'blacklist_keyword'              // Từ khóa bị cấm (nude, sex, xxx…)
  | 'link_rate_exceeded'             // Gửi link quá nhiều
  | 'sensitive_request'             // Fan đòi nội dung nhạy cảm
  | 'spam_pattern';                  // Phát hiện pattern spam

export type SafetyViolation = {
  type: SafetyViolationType;
  detail: string;                    // Mô tả vi phạm cụ thể
  severity: 'warn' | 'block';       // warn: rewrite | block: không gửi
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: LONG CONTEXT SUMMARIZER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tóm tắt hội thoại dài — output của Long Context Summarizer.
 * Lưu cache vào fan_profiles.last_summary.
 * Dùng thay thế cho full history khi history > 50 tin nhắn.
 */
export type ConversationSummary = {
  summaryVersion: string;            // "1.0" — versioning để migrate dễ
  fanType: FanType;
  fanTypeConfidence: number;
  currentStage: ConversationStage;
  dayCount: number;
  emotionScore: number;
  emotionTrend: EmotionTrend;
  flirtLevel: FlirtLevel;
  keyInsights: string[];             // Chi tiết quan trọng fan đã chia sẻ
  purchaseHistory: PurchaseRecord[];
  objections: string[];              // Objection đã gặp
  riskLevel: RiskLevel;
  lastMessages: ChatTurn[];          // 4–6 tin nhắn nguyên văn gần nhất
  recommendedNextAction: string;     // Gợi ý hành động tiếp theo (text mô tả)
  fullSummary: string;               // Tóm tắt toàn bộ bằng 2–3 câu tiếng Việt
  generatedAt: Date;                 // Thời điểm tạo summary
};

/** Service-level result cho Summarizer. */
export type SummaryServiceResult = {
  data: ConversationSummary | null;
  error: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: AI AGENT PIPELINE — Orchestration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input tổng hợp cho toàn bộ AI Agent pipeline.
 * Nhận từ BullMQ job payload (webhook.worker.ts).
 */
export type AgentPipelineInput = {
  conversationId: string;
  workspaceId: string;
  platformUserId: string;           // IGSID / PSID
  incomingMessage: string;
  platform: 'instagram' | 'facebook' | 'messenger';
  pageId: string;
  encryptedToken: string;           // AES-256-GCM — dùng để gửi reply
  aiEnabled: boolean;               // Feature flag per workspace
};

/**
 * Output cuối cùng của pipeline.
 * Được dùng để gửi tin nhắn + cập nhật DB.
 */
export type AgentPipelineOutput = {
  shouldSend: boolean;              // false nếu action = 'wait' hoặc 'hard_exit'
  reply: string | null;
  action: NextAction;
  updatedFanProfile: Partial<FanProfile>;  // Các field cần update vào DB
  delayMs: number;                  // Reply delay (ms) — 0 nếu không cần delay
  logData: AgentLogData;            // Dữ liệu ghi vào ai_reply_logs
};

/**
 * Dữ liệu log ghi vào bảng ai_reply_logs sau mỗi lượt reply.
 * Dùng để tracking, A/B test, và tối ưu prompt.
 */
export type AgentLogData = {
  conversationId: string;
  fanType: FanType;
  stage: ConversationStage;
  strategy: ResponseStrategy;
  action: NextAction;
  model: AIModel;
  emotionScoreBefore: number;
  emotionScoreAfter: number;
  riskLevel: RiskLevel;
  safetyViolations: SafetyViolation[];
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  abTestVariant?: string;           // "A" | "B" — dùng khi A/B test prompt
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: CONSTANTS — Ngưỡng & Cấu hình mặc định
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ngưỡng cấu hình cho toàn bộ AI Agent.
 * Có thể override per-workspace trong tương lai.
 */
export const AI_AGENT_DEFAULTS = {
  // Fan Classifier
  CLASSIFIER_TRIGGER_AFTER_N_MESSAGES: 3,   // Trigger classify sau 3 tin
  CLASSIFIER_MIN_CONFIDENCE: 0.65,          // Dưới ngưỡng này → giữ Unknown

  // Stage transitions (day_count)
  STAGE_G1_MAX_DAYS: 30,
  STAGE_G2_MAX_DAYS: 60,

  // Emotion thresholds
  EMOTION_PROMOTE_G1_TO_G2: 0.85,          // Promote sớm nếu cảm xúc cao
  EMOTION_PROMOTE_G2_TO_G3: 0.80,
  EMOTION_MIN_TO_SEND_LINK: 0.75,          // Tối thiểu để gửi link (Luy/Cool)

  // Link rate limiter
  LINK_MIN_INTERVAL_DAYS: 7,               // Tối thiểu 7 ngày giữa 2 lần gửi link
  LINK_MAX_DAILY_RATIO: 0.20,              // Tối đa 20% tổng DM trong ngày

  // Long context summarizer
  SUMMARY_TRIGGER_MESSAGE_COUNT: 50,       // Trigger summarize khi > 50 tin

  // Reply delay (ms)
  REPLY_DELAY_MIN_MS: 30 * 60 * 1000,     // 30 phút
  REPLY_DELAY_MAX_MS: 4 * 60 * 60 * 1000, // 4 giờ

  // Model routing mặc định theo fan type
  MODEL_CLASSIFY: 'llama-3.1-8b-instant' as AIModel,
  MODEL_DEFAULT: 'llama-3.3-70b-versatile' as AIModel,
  MODEL_WHALE: 'openai/gpt-oss-120b' as AIModel,
  MODEL_LONG_CONTEXT: 'openai/gpt-oss-120b' as AIModel,
} as const;

/**
 * Blacklist keywords — không được xuất hiện trong reply.
 * Safety Checker dùng list này để filter & rewrite.
 */
export const BLACKLIST_KEYWORDS: readonly string[] = [
  'nude', 'sex', 'xxx', 'clip nóng', 'ảnh nóng',
  'video nóng', 'lộ hàng', 'không mặc gì',
] as const;

/**
 * Map từ blacklist keyword → cụm từ thay thế an toàn.
 */
export const KEYWORD_REPLACEMENTS: Record<string, string> = {
  'nude': 'thoải mái hơn',
  'sex': 'riêng tư',
  'xxx': 'nội dung đặc biệt',
  'clip nóng': 'nội dung đặc biệt',
  'ảnh nóng': 'khoảnh khắc riêng',
  'video nóng': 'nội dung riêng tư',
  'lộ hàng': 'gần gũi hơn',
  'không mặc gì': 'thoải mái hơn',
};
