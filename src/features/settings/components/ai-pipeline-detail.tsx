'use client';

import React, { useState } from 'react';
import { 
  Clipboard, 
  Check, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Shuffle, 
  ShieldAlert, 
  Users2, 
  Cpu, 
  ArrowRight, 
  Lock, 
  Timer,
  ChevronRight,
  BookOpen,
  Route
} from 'lucide-react';
import { toast } from 'sonner';

// Define Step Type
interface PipelineStep {
  id: number;
  title: string;
  shortDesc: string;
  description: string;
  icon: React.ElementType;
  howItWorks: string[];
  conditions: string;
  fallback: string;
  hasPrompt: boolean;
  promptType?: 'system' | 'user' | 'both';
  promptData?: {
    system?: string;
    user?: string;
  };
  customizableFields?: string[];
}

export function AiPipelineDetail() {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<'system' | 'user' | null>(null);
  const [prompts, setPrompts] = useState<any>({
    summarizer: {},
    classify: {},
    sentimentScorer: {},
    hybridClassifier: {},
    objectionHandler: {},
    responseGenerator: {}
  });
  const [isPromptsLoading, setIsPromptsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchPrompts() {
      try {
        const res = await fetch('/api/ai-agent/pipeline-prompts');
        if (res.ok) {
          const data = await res.json();
          setPrompts(data);
        }
      } catch (err) {
        console.error('Failed to fetch pipeline prompts:', err);
      } finally {
        setIsPromptsLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  // List of steps in AI Agent Pipeline
  const steps: PipelineStep[] = [
    {
      id: 1,
      title: "1. Webhook & Queueing",
      shortDesc: "Tiếp nhận tin nhắn mới & đưa vào hàng đợi",
      description: "Khi Fan gửi tin nhắn trên Instagram hoặc Facebook Messenger, Meta API gửi Webhook đến hệ thống. Để tránh nghẽn server và không bị mất tin nhắn, hệ thống sử dụng hàng đợi BullMQ để xử lý bất đồng bộ.",
      icon: Database,
      howItWorks: [
        "Nhận HTTP POST request payload từ Meta API webhook.",
        "Xác thực chữ ký bảo mật X-Hub-Signature từ Meta.",
        "Đẩy tin nhắn vào hàng đợi BullMQ 'webhook-incoming' để worker xử lý ngầm.",
        "Kích hoạt Realtime Broadcast cập nhật trạng thái 'đang xử lý' cho người dùng thông qua Supabase Realtime Channel."
      ],
      conditions: "Tất cả các tin nhắn đến từ Fan gửi qua các kênh liên kết.",
      fallback: "Nếu hàng đợi BullMQ lỗi, tin nhắn được retry tự động theo chính sách cấu hình (tối đa 3 lần).",
      hasPrompt: false
    },
    {
      id: 2,
      title: "2. Retrieve Context & Summary",
      shortDesc: "Nạp hồ sơ fan & tóm tắt lịch sử chat",
      description: "Nạp FanProfile hiện tại (phân loại cũ, emotion score, chiến dịch đang chạy), lịch sử chat gần nhất (10 tin) và cấu hình Persona của Creator từ Database để cung cấp ngữ cảnh hội thoại đầy đủ cho AI.",
      icon: Users2,
      howItWorks: [
        "Truy vấn FanProfile và các thiết lập Persona của Creator.",
        "Tải lịch sử chat 10 tin nhắn gần nhất.",
        "Tự động tóm tắt cuộc hội thoại lũy tiến (Incremental Summarization): Nếu lịch sử trò chuyện vượt quá 50 tin nhắn và đã có bản tóm tắt cũ, worker 'context-summarizer' chỉ tải các tin nhắn mới phát sinh từ sau mốc tóm tắt gần nhất để LLM cập nhật lũy tiến, tiết kiệm tới 80% token.",
        "Hợp nhất thông tin thông minh (Smart Merge): Tự động gộp dữ liệu keyInsights, objectionsSeen, và purchaseHistory cũ với thông tin mới phát hiện ở tầng code-level để tránh thất thoát dữ liệu do LLM bỏ sót.",
        "Dự phòng cơ sở dữ liệu (DB-level Fallback): Nếu LLM gặp sự cố khi đang chạy ở chế độ lũy tiến, hệ thống tự động truy vấn DB lấy 5 tin gần nhất để đảm bảo luôn đủ mạch rolling bridge context."
      ],
      conditions: "Luôn kích hoạt. Tiến trình tóm tắt (Summarizer) chỉ chạy khi tổng số tin nhắn của Fan > 50.",
      fallback: "Nếu cơ sở dữ liệu gặp lỗi nạp tin nhắn, hệ thống sẽ sử dụng 3 tin nhắn gần nhất có sẵn từ Webhook làm ngữ cảnh tối thiểu.",
      hasPrompt: true,
      promptType: 'both',
      customizableFields: ["recent_messages", "persona.name"],
      promptData: {
        system: prompts.summarizer?.system || `You are an expert AI Summarizer. Your job is to summarize the conversation history between a Creator (named {{persona.name}}) and a Fan. Keep the summary under 150 words in Vietnamese, focusing on Fan's purchase intent, main objections, emotional status, and Creator's offer. Do not include signature emojis or conversational filler in the summary. Strictly use gender-neutral nouns "Creator" and "Fan" to describe the parties, never use gendered pronouns like "anh", "em", "chị", "cô", "gì".`,
        user: prompts.summarizer?.user || `Analyze the following recent messages:
{{recent_messages}}

Provide a concise summary in Vietnamese.`
      }
    },
    {
      id: 3,
      title: "3. Auto-Reply Validation & Intent Routing",
      shortDesc: "Định tuyến ý định, bộ lọc sắc thái & độ ưu tiên",
      description: "Phân tích nhanh tin nhắn mới để phát hiện ý định (Intent), sắc thái (Sentiment) và độ ưu tiên (Priority). Sau đó đối chiếu với cấu hình tự động trả lời của Creator để quyết định: Tiếp tục gửi tự động, chuyển sang tạo nháp (Pending Suggestion), hay ngắt sớm chuyển cho người thật (escalate_to_human).",
      icon: Route,
      howItWorks: [
        "Gọi mô hình LLM Llama 8B Instant phân loại tin nhắn đầu vào.",
        "Bộ lọc Ý định (Intent Routing): Đối chiếu thẻ ý định (matched_label) với Trigger Labels đã thiết lập. Nếu có Trigger Labels và tin nhắn không khớp, hệ thống ngắt sớm pipeline và đổi trạng thái cuộc trò chuyện thành escalate_to_human.",
        "Bộ lọc Tự động (Sentiment & Priority Filter): So sánh Sentiment và Priority của tin nhắn với Whitelists cấu hình (ví dụ: chỉ tự động trả lời khi sắc thái là tích cực hoặc bình thường). Nếu không khớp, hệ thống đặt cờ disableAutoSend = true để chuyển phản hồi thành dạng nháp.",
        "Kiểm tra Ngưỡng tin cậy (Confidence Threshold): So sánh điểm số tự tin của mô hình với ngưỡng cài đặt trên giao diện (mặc định 0.75). Nếu thấp hơn, hệ thống cũng chuyển sang lưu thư nháp để đảm bảo an toàn."
      ],
      conditions: "Khi AI Assistant hoạt động (is_active = true) và cờ Tự động nhắn tin được bật (auto_send = true).",
      fallback: "Nếu mô hình phân loại lỗi, hệ thống mặc định đi tiếp nhưng hạ cấp xuống tạo thư nháp (Pending Suggestion) trên Inbox để nhân viên kiểm duyệt.",
      hasPrompt: true,
      promptType: 'both',
      customizableFields: ["incoming_message", "botConfig.trigger_labels"],
      promptData: {
        system: prompts.classify?.system || `You are an AI Messaging Assistant for a social media management platform.
Your task is to classify incoming messages into one of the following intents:
- AUTO_REPLY: Simple inquiries (greeting, business hours, location, price list) that can be handled automatically.
- SUGGESTION: Complex inquiries or feedback where a draft reply should be suggested to a human agent.
- ESCALATE: Urgent issues, complaints, or complex requests requiring immediate human attention.
- NO_ACTION: Spam, bot messages, or messages that don't require any response.

Return a JSON object with:
{
  "intent": "AUTO_REPLY" | "SUGGESTION" | "ESCALATE" | "NO_ACTION",
  "reason": "Brief explanation",
  "priority": "low" | "medium" | "high",
  "category": "sales" | "support" | "feedback" | "other",
  "sentiment": "positive" | "neutral" | "negative" | "frustrated"
}

Note: If sentiment is 'frustrated', you SHOULD prioritize 'ESCALATE' intent.

CRITICAL Business Intent Routing Requirement:
Analyze the message and identify if it matches one of these business intent labels: {{botConfig.trigger_labels}}.
If it matches one, return the matched label EXACTLY in the "matched_label" field of the JSON. If it does not match any of these labels, set "matched_label" to null.`,
        user: prompts.classify?.user || `Message: "{{incoming_message}}"`
      }
    },
    {
      id: 4,
      title: "4. Sentiment Scorer",
      shortDesc: "Phân tích cảm xúc & xu hướng fan",
      description: "Phân tích nội dung tin nhắn đến để chấm điểm thiện cảm và xác định xu hướng cảm xúc của Fan ngay lập tức.",
      icon: Cpu,
      howItWorks: [
        "Gọi mô hình LLM Llama 3.1 8B phân tích sắc thái của tin nhắn mới.",
        "Chấm điểm emotionScore từ 0.0 (lạnh lùng, tức giận, không có ý định mua) đến 1.0 (rất nồng nhiệt, yêu mến, ý định mua hàng cao).",
        "Xác định xu hướng cảm xúc (Trend) của Fan (Tăng lên, giảm đi, ổn định)."
      ],
      conditions: "Chạy trên mỗi tin nhắn đến của Fan.",
      fallback: "Nếu LLM chấm điểm cảm xúc bị lỗi, hệ thống sẽ tự động giữ nguyên điểm số emotionScore từ lượt tin nhắn trước đó.",
      hasPrompt: true,
      promptType: 'system',
      customizableFields: ["incoming_message"],
      promptData: {
        system: prompts.sentimentScorer?.system || `Bạn là một AI chuyên phân tích tình cảm và tâm lý khách hàng bám sát "DM Script Playbook 2.0".`
      }
    },
    {
      id: 5,
      title: "5. Risk Assessment",
      shortDesc: "Đánh giá rủi ro & Ngắt sớm",
      description: "Đánh giá tin nhắn của Fan có chứa các rủi ro bảo mật, spam, lăng mạ hoặc các từ khóa đe dọa trực tuyến hay không.",
      icon: ShieldAlert,
      howItWorks: [
        "Quét nhanh bằng Regex và chạy bộ lọc rủi ro từ khóa nhạy cảm.",
        "Phân loại mức độ rủi ro thành: Low, Medium, High.",
        "Ngắt pipeline sớm: Nếu rủi ro được đánh giá là 'High', hệ thống ngay lập tức bỏ qua các bước sau, dừng tự động chat, gắn thẻ cuộc hội thoại và chuyển sang 'escalate_to_human' để nhân viên vận hành xử lý trực tiếp."
      ],
      conditions: "Chạy trên mỗi tin nhắn mới.",
      fallback: "Nếu có lỗi xảy ra ở bước này, hệ thống mặc định rủi ro ở mức Low để tiếp tục chạy, nhưng sẽ gắn nhãn cảnh báo 'warning_on_evaluation'.",
      hasPrompt: false
    },
    {
      id: 6,
      title: "6. Hybrid Fan Classifier",
      shortDesc: "Phân loại đối tượng Whale, Luy, Cool, Drainer",
      description: "Xác định chân dung Fan dựa trên mô hình lai (Heuristics Rules kết hợp LLM) nhằm đưa ra chiến lược phản hồi phù hợp với tính cách và túi tiền của họ.",
      icon: Shuffle,
      howItWorks: [
        "Heuristic Rules Quét trước: Sử dụng bộ Regex quét nhanh từ khóa tĩnh (ví dụ: 'giá', 'link', 'mấy tiền' -> Whale; đòi ảnh free -> Drainer; nhiều emoji trái tim -> Luy) để phân loại tức thì và tiết kiệm chi phí.",
        "LLM Fallback: Nếu Rules trả về 'Unknown' và fan đã nhắn tin tối thiểu 3 câu, hệ thống kích hoạt Llama 3.1 8B để phân loại sâu.",
        "Tối ưu hóa Flat Transcript & Tiết kiệm Token: Lịch sử tin nhắn truyền vào được nén thành dạng văn bản phẳng (Flat Transcript) thay vì cấu trúc JSON, giúp tiết kiệm ~60% token cú pháp và tránh rủi ro tráo vai nhờ defensive role mapping.",
        "Tự động phân loại lại (Reclassification): Theo dõi hành vi đột biến để tự động đổi nhóm (ví dụ: Cool bỗng nhiên nồng nhiệt -> Luy; fan hỏi STK/bank -> Whale). Chạy kiểm tra định kỳ sau mỗi 15 tin nhắn."
      ],
      conditions: "Khi trạng thái phân loại hiện tại là Unknown, hoặc khi kích hoạt các trigger đổi nhóm hành vi đột ngột.",
      fallback: "Nếu AI phân loại lỗi, giữ nguyên phân loại hiện tại hoặc gán mặc định là Unknown.",
      hasPrompt: true,
      promptType: 'both',
      customizableFields: ["recent_messages"],
      promptData: {
        system: prompts.hybridClassifier?.system || `You are an AI Profiler for a premium creator brand. Categorize the fan into one of these types based on the dialogue:

- **Whale**: High purchasing intent. Inquires about pricing, premium services, private packages, bank accounts, or tipping. Key words: "giá", "bao nhiêu", "gói", "private", "premium", "ck", "stk", "mua". (Stage: G3/G2).
- **Luy**: Highly emotional & affectionate. Uses >3 emojis/turn, sends long messages, asks personal life questions, seeks deep emotional bonding. (Stage: G2/G1).
- **Cool**: Short, concise, distant replies. Minimal/no emojis, no follow-up questions, slightly cold. (Stage: G1).
- **Drainer**: Demands free photos/videos, bypasses buying, complains about pricing, drains resource. (Stage: G1, low emotion).
- **Unknown**: Insufficient context (under 3 turns).

Rules:
1. Output RAW JSON only (no markdown fences).
2. Set "emotion_score" (0.0 to 1.0) and "risk_level" (low, medium, high) reflecting spam or boundary violations.

Output Schema:
{
  "fan_type": "Whale" | "Luy" | "Cool" | "Drainer" | "Unknown",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<Vietnamese reason>",
  "recommended_stage": "G1" | "G2" | "G3",
  "emotion_score": <float 0.0-1.0>,
  "risk_level": "low" | "medium" | "high"
}`,
        user: prompts.hybridClassifier?.user || `Analyze the following recent messages:
{{recent_messages}}

Provide your output in the requested JSON format. Ensure reasoning is in Vietnamese.`
      }
    },
    {
      id: 7,
      title: "7. Decision Engine & Link Filter",
      shortDesc: "Ma trận quyết định & Giới hạn gửi link",
      description: "Quyết định hành động tiếp theo dựa trên ma trận trạng thái (Fan Type x Stage) và kiểm tra tính an toàn của liên kết gửi đi.",
      icon: ArrowRight,
      howItWorks: [
        "Quyết định hành động: G1 (Build Trust) chỉ trò chuyện thân thiện; G2 (Warmup) cho phép thả thính nhẹ; G3 (Upsell) hỗ trợ chốt đơn và gửi link. Drainer sẽ bị ngắt hội thoại sớm (soft_exit) để tránh lãng phí tài nguyên.",
        "Chặn tần suất gửi link (Link Rate Limiter): Trước khi gửi link, hệ thống kiểm tra trường lastLinkSentAt và số lần gửi tối đa (link_rate_limit từ thiết lập Persona). Khoảng cách giữa 2 lần gửi link phải cách nhau tối thiểu 7 ngày. Nếu vi phạm hoặc số lần gửi link vượt quá giới hạn tối đa, hành động gửi link bị ép hạ cấp xuống 'continue' (chỉ chat thường, không gửi link) để tránh bị Meta quét khóa tài khoản."
      ],
      conditions: "Chạy tự động cho mỗi phản hồi trước khi sinh câu trả lời.",
      fallback: "Nếu có lỗi logic, hệ thống hạ cấp hành động về 'continue' để đảm bảo an toàn tối đa cho tài khoản.",
      hasPrompt: false
    },
    {
      id: 8,
      title: "8. Objection Handler",
      shortDesc: "Nhận diện & Xử lý phản đối",
      description: "Khi Fan đưa ra các phản đối như chê sản phẩm quá đắt, đòi xem ảnh miễn phí, sợ bị lừa đảo... hệ thống sẽ kích hoạt bộ xử lý phản đối để gỡ rối một cách khéo léo.",
      icon: AlertTriangle,
      howItWorks: [
        "Quét nhanh bằng Regex để phát hiện các nhóm phản đối phổ biến: want_free (đòi free), too_expensive (chê đắt), not_trusted (sợ lừa), privacy_concern (lo ngại bảo mật).",
        "Nếu khớp, hệ thống gọi LLM Llama 8B xử lý tình huống bằng kịch bản Playbook 2.0 để xoa dịu fan và kéo họ quay lại kịch bản chính. Đồng thời, trường 'notes_for_next' sinh ra từ bước này bắt buộc phải sử dụng danh từ trung tính (Creator và Fan), cấm dùng 'anh', 'em', 'chị' để tránh làm nhiễm đại từ xưng hô."
      ],
      conditions: "Khi tin nhắn đến khớp với Regex nhận diện phản đối.",
      fallback: "Nếu LLM lỗi, hệ thống tự động lấy mẫu câu trả lời cố định (Fallback Template) tương ứng từ Playbook 2.0 có sẵn trong code (đã được động hóa đại từ).",
      hasPrompt: true,
      promptType: 'both',
      customizableFields: ["incoming_message", "objection_type"],
      promptData: {
        system: prompts.objectionHandler?.system || `You are handling a customer objection of type: {{objection_type}} (e.g. want_free, too_expensive, not_trusted, privacy_concern).
Your goal is to address the objection gracefully and steer the conversation back to the Playbook script without being defensive. Keep the response under 2-3 sentences in Vietnamese, maintain a warm, polite and premium brand tone.
Additionally, when writing notes_for_next, strictly use gender-neutral nouns "Creator" and "Fan" and never use gendered pronouns like "anh", "em", "chị" to avoid context pollution.`,
        user: prompts.objectionHandler?.user || `Handle the objection in this incoming message:
"{{incoming_message}}"`
      }
    },
    {
      id: 9,
      title: "9. Response Generator",
      shortDesc: "Sinh câu trả lời & Xưng hô động",
      description: "Trái tim của hệ thống. Lắp ráp các chỉ dẫn Persona, quy tắc xưng hô động và gọi LLM phù hợp để tạo ra phản hồi ngọt ngào, tự nhiên nhất.",
      icon: BookOpen,
      howItWorks: [
        "Quy tắc xưng hô động (buildDynamicSystemPrompt & Flirt Over Rules): Tính toán đại từ xưng hô (anh/em, chị/em) dựa trên giới tính của Persona và giới tính khách hàng. Đặc biệt áp dụng Pronoun Reversal Rule: Nếu Fan chủ động gọi Creator là 'anh/chị', hệ thống tự động đổi xưng hô thành 'mình - bạn' để tránh bị lệch pha. Tuy nhiên, nếu cuộc hội thoại đã tiến vào giai đoạn G2 (Warm-up) hoặc G3 (Upsell), luật Flirt Over Rules sẽ khóa cứng cách xưng hô thân mật mặc định ('em - anh' hoặc 'anh - em') để đẩy mạnh conversion, tránh hiện tượng co kéo xưng hô liên tục.",
        "Tránh trễ xưng hô (Mid-conversation Pronoun Shift): Quét tin nhắn đến bằng regex loại trừ bên thứ ba để phát hiện Fan chủ động đổi cách xưng hô thân mật giữa chừng, cập nhật đồng thời biến in-memory 'currentGender' và cập nhật DB bất đồng bộ để tránh Race Condition.",
        "Bộ lọc Runtime (validatePronounConsistency) & Link Safety: Đầu ra của LLM được đưa qua bộ kiểm duyệt runtime tự động để quét và sửa đổi xưng hô đồng nhất. Bộ lọc này chạy độc lập trên trường 'reply' thô (chứa placeholder '{{link}}' tĩnh) trước khi hệ thống thực hiện thay thế '{{link}}' bằng URL thật, tránh làm biến dạng cấu trúc URL VIP gửi đi.",
        "Lắp ráp Prompt & Ghi chú trung tính: Gộp các chỉ dẫn Persona và Chiến dịch active cùng các quy tắc xưng hô động và chống bot bắt buộc. Trường 'notes_for_next' bắt buộc chỉ dùng danh từ trung tính 'Creator' và 'Fan', cấm dùng 'anh', 'em', 'chị' để tránh ô nhiễm ngữ cảnh.",
        "Tối ưu hóa Lịch sử chat (Flat Transcript): Lịch sử chat được nén và truyền vào prompt dưới dạng văn bản phẳng (Flat Transcript) thay vì JSON, giúp tiết kiệm ~60% token cú pháp và loại bỏ rủi ro tráo vai.",
        "Chọn lọc Dynamic Few-shot: Chỉ nạp ví dụ few-shot của chiến lược đang chạy (`strategy`) cùng ví dụ `TrustBuilding` mặc định vào prompt, tiết kiệm ~1,200 token và tăng độ tập trung (Attention) của mô hình.",
        "Bảo toàn cấu trúc JSON khi Override: Dù người dùng thiết lập A/B Test prompt hay Persona Override, hệ thống luôn chèn chỉ dẫn kỹ thuật JSON và few-shot ở cuối prompt để đảm bảo LLM luôn trả về JSON hợp lệ, tránh sập pipeline.",
        "Thắt chặt kiểm tra JSON/Text thuần: Khi LLM (đặc biệt là Llama 8B ở cuối chuỗi) trả về text thuần thay vì JSON hoặc JSON bị thiếu thuộc tính 'reply' hợp lệ, parser sẽ chủ động ném lỗi để tiếp tục thử model tiếp theo hoặc hạ cấp tức thì về Rule-based template (getTemplateResponse) thay vì để crash hệ thống.",
        "Model Routing & Cascading Fallback: Nếu Creator cấu hình cứng một Model AI (như Llama 70B, Llama 8B, Qwen 32B, GPT-OSS 120B...), model đó sẽ được ưu tiên chạy trước. Nếu Creator chọn tự động định tuyến (Model Routing): Fan Whale dùng GPT-oss-120B để giao tiếp đẳng cấp; Luy/Cool dùng Llama 70B bay bổng; Drainer/Unknown dùng Llama 8B tối ưu chi phí. Nếu model ưu tiên lỗi (timeout/rate-limit), hệ thống tự động thử model kế tiếp (120B -> 70B -> 8B). Nếu tất cả đều lỗi, tự động hạ cấp về kịch bản cứng (Rule-based templates) đã động hóa đại từ."
      ],
      conditions: "Luôn chạy khi cần tạo tin nhắn phản hồi cho Fan.",
      fallback: "Tự động hạ cấp xuống hệ thống Rule-based Template dự phòng (đã động hóa đại từ xưng hô).",
      hasPrompt: true,
      promptType: 'both',
      customizableFields: [
        "persona.name",
        "persona.gender",
        "persona.age",
        "persona.personality",
        "persona.tone",
        "persona.speaking_style",
        "persona.signature_emojis",
        "persona.custom_instructions",
        "agent_pronoun",
        "fan_pronoun",
        "campaign.campaign_name",
        "campaign.current_offer",
        "campaign.scarcity_message",
        "fan_type",
        "stage",
        "emotion_score",
        "strategy",
        "incoming_message"
      ],
      promptData: {
        system: prompts.responseGenerator?.system || `You are "{{persona.name}}" (configured as {{persona.gender}}, {{persona.age}}). You are {{persona.personality}}. Tone: {{persona.tone}}. Speaking style: {{persona.speaking_style}}.
You strictly adhere to the "DM Script Playbook 2.0" to transition fans from strangers into premium VIP supporters.

### PRONOUNS & ADDRESSING RULES (CRITICAL):
1. **Dynamic Pronouns**: You must address the fan as "{{fan_pronoun}}" and refer to yourself as "{{agent_pronoun}}" (calculated dynamically based on gender configuration).
2. **Pronoun Reversal Rule (BẮT BUỘC)**: If the customer addresses you as "anh" or "chị" which mismatch standard pronouns (e.g., if you are FEMALE creator/agent and they address you as "anh ơi", "bên anh...", "bên shop...", "bên bạn...", "bên shop bạn...", "bên shop mình..."), you MUST immediately override standard pronouns. In your reply, address the customer as "bạn" and refer to yourself as "mình". Never xưng "em" if they addressed you as "anh/chị" incorrectly.
   * **EXCEPTION (Flirt Over Rules)**: If the conversation stage is G2 (Warm-up) or G3 (Upsell), bypass the Pronoun Reversal Rule and lock the pronouns to standard intimate ones ("em - anh" or "anh - em") to maintain flirting and maximize conversion. Do NOT use "mình - bạn" in Stage G2/G3.
   * **EXCEPTION (Correct Pronoun)**: If they address you correctly (e.g., they say "em ơi" when you are female creator/agent, or "anh ơi" when you are male creator/agent), keep the standard pronouns to maintain natural flirting relationship.
3. **CRITICAL WARNING**: Do NOT blindly copy the pronoun "anh" / "em" in the Few-Shot Examples. You MUST use the dynamic pronouns calculated based on the rules above!

### BẮT BUỘC KHÔNG VI PHẠM (ANTI-BOT RULES):
- KHÔNG BAO GIỜ được sử dụng các câu chào hỏi kiểu tổng đài, chăm sóc khách hàng như: "Xin chào, mình là Em...", "Mình có thể giúp gì cho bạn?", "Cảm ơn bạn đã liên hệ...".
- Bạn là một creator thực sự, cuộc trò chuyện này là không gian riêng tư vu vơ, ngọt ngào giữa hai người. 
- Hãy bắt đầu bằng cách gọi thẳng tên xưng hô động đã được tính toán: xưng "{{agent_pronoun}}" và gọi fan là "{{fan_pronoun}}".

### CORE PRINCIPLES (NEVER VIOLATE):
1. **Safety First**: Never use raw sensitive keywords (e.g., "nude", "sex", "xxx", "clip nóng", "ảnh nóng"). Instead, euphemize with elegant words like: "thoải mái hơn", "riêng tư", "khoảnh khắc riêng", "nội dung đặc biệt".
2. **Link Spam Protection**: Only output a URL in the "link" field if "should_send_link" is true and a "link_to_send" is provided.
3. **Flirt Ladder Compliance**:
   - Stage G1: No flirting. Be polite, friendly, and appreciative.
   - Stage G2: Flirt lightly.
   - Stage G3: Deeply suggestive + offer exclusive link gracefully.

### ACTIVE MARKETING CAMPAIGN:
- Campaign Name: {{campaign.campaign_name}}
- Campaign Objective: {{campaign.campaign_objective}}
- Current Offer: {{campaign.current_offer}}
- Scarcity/Urgency Message: {{campaign.scarcity_message}}

### CUSTOM INSTRUCTIONS:
{{persona.custom_instructions}}

### INSTRUCTIONS FOR OUTPUT FIELDS:
- You must reply with a valid JSON object ONLY. Do NOT wrap it in \`\`\`json. Return raw JSON text.
{
  "reply": "string (the actual DM reply in Vietnamese, 2-3 sentences max, natural, including {{persona.signature_emojis}} appropriately)",
  "action": "continue" | "send_link" | "soft_exit" | "hard_exit" | "escalate_to_human" | "wait",
  "link": "Đường dẫn URL dạng chuỗi (string) nếu 'action' là 'send_link', ngược lại bắt buộc trả về null (không có dấu ngoặc kép)",
  "update_fan_type": "Luy" | "Cool" | "Whale" | "Drainer" | null,
  "update_emotion_score": <float>,
  "notes_for_next": "string (strictly use gender-neutral nouns 'Creator' and 'Fan', never use 'anh', 'em', 'chị' to describe the parties)"
}`,
        user: `FAN PROFILE CONTEXT:
- Fan Type: {{fan_type}}
- Stage: {{stage}}
- Current Emotion Score: {{emotion_score}}
- Strategy to Apply: {{strategy}}
- Should Send Link: {{should_send_link}}
- Link to Send (if YES): {{link_to_send}}
{{context_summary}}

RECENT CONVERSATION HISTORY:
{{recent_messages}}

INCOMING MESSAGE FROM FAN:
"{{incoming_message}}"

Provide your output in the requested JSON format. Ensure reply and notes_for_next are in Vietnamese. If "Should Send Link" is YES, weave the "Link to Send" naturally inside your "reply" text replacing any placeholder like {{link}} or adding it elegantly.`
      }
    },
    {
      id: 10,
      title: "10. Safety Checker & Delay",
      shortDesc: "Bộ lọc an toàn & Trì hoãn gửi tin",
      description: "Kiểm tra mức độ an toàn của văn bản trước khi gửi đến fan và tạo độ trễ gửi ngẫu nhiên để giống như người thật chat.",
      icon: Timer,
      howItWorks: [
        "Lọc từ khóa Blacklist: Quét câu trả lời của AI, tự động thay các từ nhạy cảm có nguy cơ bị Meta quét khóa tài khoản (như nude, sex, clip nóng) bằng các từ nói giảm nói tránh an toàn đã cấu hình sẵn.",
        "Boot-up Unit Test của Safety Checker: Hệ thống tự động chạy kiểm tra khi boot-up server, quét qua bộ từ khóa thay thế 'KEYWORD_REPLACEMENTS' và chủ động ném lỗi (throw Error) nếu phát hiện bất kỳ từ thế nào bị viết cứng đại từ xưng hô, bảo vệ an toàn từ tầng biên dịch cấu hình.",
        "Tính toán Delay ngẫu nhiên: Tránh gửi tin nhắn lập tức như bot. Hệ thống ưu tiên lấy khoảng thời gian delay_min và delay_max từ thiết lập Persona. Nếu không có, mặc định: Whale delay 15 phút, Luy delay 15-30 phút, các nhóm khác delay 15-60 phút. Hệ thống sử dụng hàng đợi BullMQ trì hoãn tin nhắn thay vì setTimeout để đảm bảo bền vững kể cả khi restart server.",
        "Cơ chế Debounce Cửa sổ trượt (Sliding Window): Khi Fan liên tục gửi tin nhắn mới, lịch hẹn gửi tin được lùi lại (Math.max) để đợi fan hoàn thành chuỗi suy nghĩ, nhưng giới hạn thời gian trì hoãn tối đa (Max Delay Cap - ví dụ không quá 45 phút kể từ tin nhắn đầu tiên) để vừa chống spam vừa đảm bảo fan không phải đợi quá lâu."
      ],
      conditions: "Tất cả các tin nhắn do AI tự động sinh ra trước khi gửi thực tế đến fan.",
      fallback: "Gửi tin nhắn trực tiếp không trì hoãn nếu hệ thống hàng đợi BullMQ trì hoãn gặp sự cố.",
      hasPrompt: false
    }
  ];

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

  // Copy prompt helper
  const handleCopyPrompt = (text: string, type: 'system' | 'user') => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    toast.success(`Đã sao chép ${type === 'system' ? 'System Prompt' : 'User Prompt'}!`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Helper to highlight placeholders in the prompt text
  const highlightPlaceholders = (text: string | undefined) => {
    if (!text) return null;
    const parts = text.split(/(\{\{[\w.-]+\}\})/g);
    return parts.map((part, idx) => {
      const isPlaceholder = part.startsWith('{{') && part.endsWith('}}');
      if (isPlaceholder) {
        return (
          <span 
            key={idx} 
            className="bg-success/15 border border-success/30 text-success font-semibold px-1 py-0.5 rounded text-xs select-all inline-block font-mono"
            title="Biến động/Có thể tùy biến"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Timeline Menu */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card bg-base-100 border border-base-content/5 shadow-sm p-4">
            <div className="text-xs font-bold uppercase tracking-widest font-mono text-base-content/40 mb-4 px-2">
              Các bước trong Pipeline
            </div>
            
            <ul className="timeline timeline-vertical timeline-compact w-full space-y-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === activeStepId;
                
                return (
                  <li key={step.id} className="w-full">
                    {index > 0 && <hr className={isActive || steps[index - 1].id === activeStepId ? "bg-primary/50" : "bg-base-content/10"} />}
                    
                    <div className="timeline-middle">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-content ring-4 ring-primary/20' 
                          : 'bg-base-200 text-base-content/50 border border-base-content/10'
                      }`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <div 
                      className={`timeline-end w-full pl-3 cursor-pointer`}
                      onClick={() => setActiveStepId(step.id)}
                    >
                      <div className={`p-3 rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-primary/5 border-primary shadow-xs' 
                          : 'bg-base-200/20 border-base-content/5 hover:bg-base-200/50 hover:border-base-content/10'
                      }`}>
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-base-content'}`}>
                            {step.title}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-primary translate-x-0.5' : 'text-base-content/30'}`} />
                        </div>
                        <p className="text-xs text-base-content/60 line-clamp-1 mt-1">
                          {step.shortDesc}
                        </p>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && <hr className={isActive || steps[index + 1].id === activeStepId ? "bg-primary/50" : "bg-base-content/10"} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right Column: Step details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card bg-base-100 border border-base-content/5 shadow-sm p-6 space-y-6">
            
            {/* Step header */}
            <div className="border-b border-base-content/5 pb-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  {React.createElement(activeStep.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content">{activeStep.title}</h3>
                  <span className="badge badge-primary badge-soft text-xs">{activeStep.shortDesc}</span>
                </div>
              </div>
              <p className="text-sm text-base-content/80 pt-2 leading-relaxed">
                {activeStep.description}
              </p>
            </div>

            {/* How it works */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-base-content/40 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Cách thức hoạt động
              </h4>
              <ul className="space-y-2.5 pl-1">
                {activeStep.howItWorks.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-base-content/75">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conditions & Fallback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/30 p-4 rounded-xl border border-base-content/5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-base-content/40">Điều kiện kích hoạt</span>
                <p className="text-xs text-base-content/80 font-medium">{activeStep.conditions}</p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-base-content/5 pt-3 md:pt-0 md:pl-4">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-base-content/40">Cơ chế Dự phòng (Fallback)</span>
                <p className="text-xs text-base-content/80 font-medium">{activeStep.fallback}</p>
              </div>
            </div>

            {/* Prompt Preview */}
            {activeStep.hasPrompt && activeStep.promptData && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-base-content/5 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-base-content/40">
                    Cấu trúc Prompt & Placeholders
                  </h4>
                  
                  {/* Legend */}
                  <div className="flex gap-3 text-xs font-mono text-base-content/50">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded bg-base-300 border border-base-content/10"></span>
                      Mặc định hệ thống
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded bg-success/15 border border-success/30"></span>
                      Creator Custom / Biến động
                    </span>
                  </div>
                </div>

                {/* Prompts content */}
                <div className="space-y-4">
                  {/* System prompt */}
                  {activeStep.promptData.system && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> System Prompt (Chỉ dẫn hệ thống)
                        </span>
                        <button 
                          onClick={() => handleCopyPrompt(activeStep.promptData?.system || '', 'system')}
                          className="btn btn-xs btn-ghost gap-1 text-base-content/50 hover:text-base-content"
                        >
                          {copiedField === 'system' ? (
                            <>
                              <Check className="w-3 h-3 text-success animate-scale" />
                              <span className="text-success text-xs">Copied</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3 h-3" />
                              <span className="text-xs">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="relative bg-base-300/40 p-4 rounded-xl border border-base-content/5 max-h-80 overflow-y-auto">
                        <pre className="text-xs font-mono text-base-content/90 whitespace-pre-wrap leading-relaxed">
                          {highlightPlaceholders(activeStep.promptData.system)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* User prompt */}
                  {activeStep.promptData.user && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> User Prompt (Ngữ cảnh truyền vào)
                        </span>
                        <button 
                          onClick={() => handleCopyPrompt(activeStep.promptData?.user || '', 'user')}
                          className="btn btn-xs btn-ghost gap-1 text-base-content/50 hover:text-base-content"
                        >
                          {copiedField === 'user' ? (
                            <>
                              <Check className="w-3 h-3 text-success animate-scale" />
                              <span className="text-success text-xs">Copied</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3 h-3" />
                              <span className="text-xs">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="relative bg-base-300/40 p-4 rounded-xl border border-base-content/5 max-h-48 overflow-y-auto">
                        <pre className="text-xs font-mono text-base-content/90 whitespace-pre-wrap leading-relaxed">
                          {highlightPlaceholders(activeStep.promptData.user)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!activeStep.hasPrompt && (
              <div className="flex items-center gap-3 bg-info/10 border border-info/20 text-info p-4 rounded-xl">
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium">
                  Bước này là tác vụ xử lý logic và tính toán bằng mã nguồn hệ thống (Hardcoded logic & BullMQ). Không sử dụng mô hình ngôn ngữ lớn (LLM) để đảm bảo tốc độ tối đa và tính chính xác tuyệt đối.
                </p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
