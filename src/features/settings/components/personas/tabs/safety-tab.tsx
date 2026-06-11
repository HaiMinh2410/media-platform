import * as React from "react";
import { cn } from "@shared/lib";
import { ROLE_TEMPLATES } from "@features/ai-agent/services/role-templates";
import { toast } from "sonner";

interface SafetyTabProps {
  persona: {
    settings?: {
      delay_min?: number;
      delay_max?: number;
      link_rate_limit?: number;
      blacklist_keywords?: string[];
    };
  };
  onChange: (updates: any) => void;
  botConfig: any;
  onChangeBotConfig: (updates: any) => void;
  isLoadingBot: boolean;
}

const PRIORITY_OPTIONS = ["low", "medium", "high"];
const SENTIMENT_OPTIONS = ["positive", "neutral", "negative", "frustrated"];

export function SafetyTab({
  persona,
  onChange,
  botConfig,
  onChangeBotConfig,
  isLoadingBot,
}: SafetyTabProps) {
  const [newLabel, setNewLabel] = React.useState("");

  const updateSafetySettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  const addLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newLabel.trim()) {
      e.preventDefault();
      const trimmed = newLabel.trim();
      if (!botConfig.trigger_labels.includes(trimmed)) {
        onChangeBotConfig({
          trigger_labels: [...botConfig.trigger_labels, trimmed],
        });
      }
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    onChangeBotConfig({
      trigger_labels: botConfig.trigger_labels.filter((l: string) => l !== label),
    });
  };

  if (isLoadingBot) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-base-content/50">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="text-sm font-medium">Đang tải cấu hình Bot AI...</p>
      </div>
    );
  }

  if (!botConfig) {
    return (
      <div className="alert alert-error alert-soft text-sm p-4 rounded-xl">
        <span>Không thể tải cấu hình Bot cho tài khoản này. Vui lòng thử lại sau.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 1. Trạng thái AI Assistant */}
      <div className="card bg-base-200/20 border border-base-content/5 p-5 rounded-2xl flex flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-base-content">
            Trạng thái AI Assistant
          </h3>
          <p className="text-xs text-base-content/50">
            Kích hoạt hoặc tạm ngưng phản hồi tự động của AI cho tài khoản này.
          </p>
        </div>
        <input
          type="checkbox"
          checked={botConfig.is_active}
          onChange={(e) => onChangeBotConfig({ is_active: e.target.checked })}
          className="toggle toggle-primary toggle-md"
        />
      </div>

      {/* 2. Cấu hình hành vi (Behavior Settings) */}
      <div
        className={cn(
          "card bg-base-200/20 border border-base-content/5 p-5 rounded-2xl space-y-4 transition-all duration-300",
          !botConfig.is_active && "opacity-50 pointer-events-none select-none"
        )}
      >
        <div className="border-b border-base-content/5 pb-2">
          <h3 className="text-sm font-bold text-base-content">
            Thiết lập Hành vi AI
          </h3>
          <p className="text-xs text-base-content/50">
            Định cấu hình prompt hệ thống, lựa chọn model và các ngưỡng quyết định.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
            Prompt Hệ thống (System Prompt)
          </label>
          <select
            disabled={!botConfig.is_active}
            className="select select-bordered select-sm w-full focus:outline-none focus:border-primary text-sm"
            onChange={(e) => {
              const template = ROLE_TEMPLATES.find((t) => t.id === e.target.value);
              if (template) {
                onChangeBotConfig({ system_prompt: template.prompt });
                toast.info(`Áp dụng mẫu prompt: ${template.name}`);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              ✨ Chọn prompt mẫu để áp dụng nhanh...
            </option>
            {ROLE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
          <textarea
            disabled={!botConfig.is_active}
            className="textarea textarea-bordered w-full min-h-[120px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            value={botConfig.system_prompt || ""}
            onChange={(e) => onChangeBotConfig({ system_prompt: e.target.value })}
            placeholder="Bạn là một trợ lý ảo tư vấn khách hàng..."
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Mô hình AI (Model)
            </label>
            <select
              disabled={!botConfig.is_active}
              className="select select-bordered w-full focus:outline-none focus:border-primary text-sm"
              value={botConfig.model}
              onChange={(e) => onChangeBotConfig({ model: e.target.value })}
            >
              <option value="auto">Tự động chọn (Định tuyến thông minh)</option>
              <option value="llama-3.3-70b-versatile">
                LLaMA 3.3 70B Versatile (Khuyên dùng)
              </option>
              <option value="llama-3.1-8b-instant">
                LLaMA 3.1 8B Instant (Nhanh nhất & Tiết kiệm)
              </option>
              <option value="qwen-qwq-32b">
                Qwen3 32B (Đa ngôn ngữ · 32k Context)
              </option>
              <option value="openai/gpt-oss-20b">
                GPT-OSS 20B (Cân bằng Tốc độ/Chất lượng)
              </option>
              <option value="openai/gpt-oss-120b">
                GPT-OSS 120B (Chất lượng cao nhất)
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                Ngưỡng Tin cậy (Confidence)
              </label>
              <span className="badge badge-neutral badge-sm font-semibold">
                {(botConfig.confidence_threshold ?? 0.75).toFixed(2)}
              </span>
            </div>
            <input
              disabled={!botConfig.is_active}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={botConfig.confidence_threshold ?? 0.75}
              onChange={(e) =>
                onChangeBotConfig({
                  confidence_threshold: parseFloat(e.target.value),
                })
              }
              className="range range-primary mt-2"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-base-content/5 space-y-4">
          <div className="flex items-start gap-3">
            <input
              disabled={!botConfig.is_active}
              type="checkbox"
              id="autoSend"
              checked={botConfig.auto_send}
              onChange={(e) => onChangeBotConfig({ auto_send: e.target.checked })}
              className="checkbox checkbox-primary checkbox-sm mt-0.5"
            />
            <label
              htmlFor="autoSend"
              className="flex flex-col gap-0.5 cursor-pointer select-none"
            >
              <span className="text-sm font-bold text-base-content">
                Tự động gửi tin nhắn (Auto-Reply)
              </span>
              <span className="text-xs text-base-content/50">
                Tự động gửi câu trả lời đạt ngưỡng tin cậy mà không cần duyệt nháp.
              </span>
            </label>
          </div>

          {botConfig.auto_send && (
            <div className="bg-base-200/30 border border-base-content/5 p-4 rounded-xl space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-base-content/60">
                  Tự động gửi cho các độ ưu tiên (Priority):
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((prio) => {
                    const active = (botConfig.auto_reply_priorities || []).includes(
                      prio
                    );
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => {
                          const updated = active
                            ? botConfig.auto_reply_priorities.filter(
                                (p: string) => p !== prio
                              )
                            : [...botConfig.auto_reply_priorities, prio];
                          onChangeBotConfig({ auto_reply_priorities: updated });
                        }}
                        className={cn(
                          "btn btn-xs rounded-full font-semibold",
                          active
                            ? "btn-primary"
                            : "btn-ghost bg-base-200/50 hover:bg-base-200"
                        )}
                      >
                        {prio === "low"
                          ? "Thấp"
                          : prio === "medium"
                          ? "Trung bình"
                          : "Cao"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-base-content/60">
                  Tự động gửi cho các sắc thái (Sentiment):
                </label>
                <div className="flex flex-wrap gap-2">
                  {SENTIMENT_OPTIONS.map((sent) => {
                    const active = (botConfig.auto_reply_sentiments || []).includes(
                      sent
                    );
                    return (
                      <button
                        key={sent}
                        type="button"
                        onClick={() => {
                          const updated = active
                            ? botConfig.auto_reply_sentiments.filter(
                                (s: string) => s !== sent
                              )
                            : [...botConfig.auto_reply_sentiments, sent];
                          onChangeBotConfig({ auto_reply_sentiments: updated });
                        }}
                        className={cn(
                          "btn btn-xs rounded-full font-semibold",
                          active
                            ? "btn-primary"
                            : "btn-ghost bg-base-200/50 hover:bg-base-200"
                        )}
                      >
                        {sent === "positive"
                          ? "Tích cực"
                          : sent === "neutral"
                          ? "Bình thường"
                          : sent === "negative"
                          ? "Tiêu cực"
                          : "Giận dữ / Phàn nàn"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Phân loại ý định (Intent Routing) */}
      <div
        className={cn(
          "card bg-base-200/20 border border-base-content/5 p-5 rounded-2xl space-y-4 transition-all duration-300",
          !botConfig.is_active && "opacity-50 pointer-events-none select-none"
        )}
      >
        <div className="border-b border-base-content/5 pb-2">
          <h3 className="text-sm font-bold text-base-content">
            Phân loại Ý định (Intent Routing)
          </h3>
          <p className="text-xs text-base-content/50">
            Các trigger labels được kích hoạt để phân loại ý định hội thoại.
            Ý định nằm ngoài danh sách này sẽ được chuyển cho nhân viên (Escalate).
          </p>
        </div>

        <div className="space-y-2">
          <div className="bg-base-200/30 border border-base-content/5 rounded-xl p-3 focus-within:border-primary/30 transition-all">
            <div className="flex flex-wrap items-center gap-2">
              {botConfig.trigger_labels?.map((label: string) => (
                <span
                  key={label}
                  className="badge badge-primary badge-soft rounded-full py-2.5 px-3 flex items-center gap-1.5 text-xs font-semibold animate-in zoom-in-95"
                >
                  {label}
                  <button
                    disabled={!botConfig.is_active}
                    type="button"
                    className="text-sm font-extrabold hover:opacity-80 transition-opacity ml-0.5"
                    onClick={() => removeLabel(label)}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                disabled={!botConfig.is_active}
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={addLabel}
                placeholder="Thêm nhãn và nhấn Enter..."
                className="bg-transparent border-none outline-none text-sm text-base-content placeholder-base-content/40 flex-1 min-w-[200px] py-1 px-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tham số An toàn & Giới hạn */}
      <div className="card bg-base-200/20 border border-base-content/5 p-5 rounded-2xl space-y-4">
        <div className="border-b border-base-content/5 pb-2">
          <h3 className="text-sm font-bold text-base-content">
            Tham số An toàn & Giới hạn
          </h3>
          <p className="text-xs text-base-content/50">
            Kiểm soát tốc độ gửi tin, giới hạn spam link và các bộ lọc từ cấm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Delay Tối thiểu (giây)
            </label>
            <input
              type="number"
              value={persona.settings?.delay_min ?? 15}
              onChange={(e) =>
                updateSafetySettings("delay_min", parseInt(e.target.value) || 0)
              }
              className="input input-bordered w-full focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Delay Tối đa (giây)
            </label>
            <input
              type="number"
              value={persona.settings?.delay_max ?? 120}
              onChange={(e) =>
                updateSafetySettings("delay_max", parseInt(e.target.value) || 0)
              }
              className="input input-bordered w-full focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
            Giới hạn gửi Link (mỗi hội thoại)
          </label>
          <input
            type="number"
            value={persona.settings?.link_rate_limit ?? 3}
            onChange={(e) =>
              updateSafetySettings("link_rate_limit", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full focus:outline-none focus:border-primary text-sm"
          />
          <p className="text-2xs text-base-content/40 font-medium">
            Giới hạn số lần AI được phép gửi link chốt sale để tránh spam.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
            Từ khóa Cấm kỵ (Blacklist Keywords)
          </label>
          <textarea
            value={persona.settings?.blacklist_keywords?.join(", ") || ""}
            onChange={(e) =>
              updateSafetySettings(
                "blacklist_keywords",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            className="textarea textarea-bordered w-full min-h-[100px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            placeholder="VD: lừa đảo, scam, báo công an..."
          />
          <p className="text-2xs text-base-content/40 font-medium">
            Nếu tin nhắn của khách chứa các từ này, AI sẽ tự động dừng tương tác
            và chuyển tiếp hội thoại cho nhân viên thật (Escalate). Nhập các từ cách nhau bởi dấu phẩy.
          </p>
        </div>
      </div>
    </div>
  );
}
