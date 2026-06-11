import * as React from "react";
import { cn } from "@shared/lib";
import { PortalTooltip } from "@shared/ui";
import {
  HelpCircle,
  X,
  Plus,
  Route,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_OPTIONS = ["low", "medium", "high"];
const SENTIMENT_OPTIONS = ["positive", "neutral", "negative", "frustrated"];

interface AutoReplySectionProps {
  botConfig: any;
  onChangeBotConfig: (updates: any) => void;
  disabled: boolean;
}

export function AutoReplySection({
  botConfig,
  onChangeBotConfig,
  disabled,
}: AutoReplySectionProps) {
  const [newLabel, setNewLabel] = React.useState("");

  // Tooltip states & refs
  const [isAutoSendHelpActive, setIsAutoSendHelpActive] = React.useState(false);
  const autoSendHelpRef = React.useRef<HTMLDivElement>(null);

  const [isIntentHelpActive, setIsIntentHelpActive] = React.useState(false);
  const intentHelpRef = React.useRef<HTMLDivElement>(null);

  const addLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newLabel.trim()) {
      e.preventDefault();
      const trimmed = newLabel.trim();
      const existingLabels = botConfig.trigger_labels || [];
      if (!existingLabels.includes(trimmed)) {
        onChangeBotConfig({
          trigger_labels: [...existingLabels, trimmed],
        });
        toast.success(`Đã thêm nhãn ý định: ${trimmed}`);
      }
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    const existingLabels = botConfig.trigger_labels || [];
    onChangeBotConfig({
      trigger_labels: existingLabels.filter((l: string) => l !== label),
    });
  };

  return (
    <div
      className={cn(
        "pt-6 pb-6 space-y-4 transition-all duration-300",
        disabled && "opacity-50 pointer-events-none select-none",
      )}
    >
      <div className="flex items-start gap-3">
        <label
          htmlFor="autoSend"
          className="flex flex-col gap-0.5 cursor-pointer select-none flex-1"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-base-content flex items-center gap-1.5">
              <MessageSquareQuote size={16} className="text-base-content/80" />
              Tự động nhắn tin (Auto-Reply)
            </span>
            <div
              ref={autoSendHelpRef}
              onMouseEnter={() => setIsAutoSendHelpActive(true)}
              onMouseLeave={() => setIsAutoSendHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isAutoSendHelpActive}
              anchorRef={autoSendHelpRef}
              showArrow
              position="top"
              align="right"
              className="w-80 text-xs font-normal leading-relaxed p-3"
            >
              <div className="space-y-1 text-left">
                <p className="font-semibold text-base-content">
                  Tự động trả lời:
                </p>
                <p className="text-base-content/70">
                  Cho phép AI tự động gửi câu trả lời đi ngay lập tức thay
                  vì tạo thư nháp (Pending Suggestion) trên Inbox.
                </p>
              </div>
            </PortalTooltip>
          </div>
        </label>
        <input
          disabled={disabled}
          type="checkbox"
          id="autoSend"
          checked={botConfig.auto_send}
          onChange={(e) =>
            onChangeBotConfig({ auto_send: e.target.checked })
          }
          className="toggle toggle-primary toggle-sm"
        />
      </div>

      {botConfig.auto_send && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-content/5 border border-base-content/5 bg-base-200 rounded-xl overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 flex flex-col gap-3">
            <div className="text-sm font-semibold text-base-content/60">
              Theo độ ưu tiên (Priority)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((prio) => {
                const active = (
                  botConfig.auto_reply_priorities || []
                ).includes(prio);
                return (
                  <button
                    key={prio}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const updated = active
                        ? botConfig.auto_reply_priorities.filter(
                            (p: string) => p !== prio,
                          )
                        : [...botConfig.auto_reply_priorities, prio];
                      onChangeBotConfig({ auto_reply_priorities: updated });
                    }}
                    className={cn(
                      "btn btn-sm rounded-md",
                      active
                        ? "bg-primary border-primary text-base-content hover:bg-primary/90 hover:border-primary/90"
                        : "bg-base-100 border-base-content/10 text-base-content/70 hover:bg-base-200 hover:text-base-content",
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

          <div className="p-4 flex flex-col gap-3">
            <div className="text-sm font-semibold text-base-content/60">
              Theo sắc thái (Sentiment)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SENTIMENT_OPTIONS.map((sent) => {
                const active = (
                  botConfig.auto_reply_sentiments || []
                ).includes(sent);
                return (
                  <button
                    key={sent}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const updated = active
                        ? botConfig.auto_reply_sentiments.filter(
                            (s: string) => s !== sent,
                          )
                        : [...botConfig.auto_reply_sentiments, sent];
                      onChangeBotConfig({ auto_reply_sentiments: updated });
                    }}
                    className={cn(
                      "btn btn-sm rounded-md",
                      active
                        ? "bg-primary border-primary text-base-content hover:bg-primary/90 hover:border-primary/90"
                        : "bg-base-100 border-base-content/10 text-base-content/70 hover:bg-base-200 hover:text-base-content",
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

          {/* Hàng 2 (Full Width): Phân loại Ý định (Intent Routing) */}
          <div className="p-4 md:col-span-2 border-t border-base-content/5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-base-content/60 flex items-center gap-1.5">
                <Route size={14} className="text-base-content/50" />
                Theo ý định hội thoại (Intent Routing)
              </div>
              <div
                ref={intentHelpRef}
                onMouseEnter={() => setIsIntentHelpActive(true)}
                onMouseLeave={() => setIsIntentHelpActive(false)}
                className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
              >
                <HelpCircle size={14} />
              </div>
              <PortalTooltip
                active={isIntentHelpActive}
                anchorRef={intentHelpRef}
                showArrow
                position="top"
                align="right"
                className="w-80 text-xs font-normal leading-relaxed p-3"
              >
                <div className="space-y-1 text-left">
                  <p className="font-semibold text-base-content">
                    Trigger Labels (Ý định):
                  </p>
                  <p className="text-base-content/70">
                    AI sẽ phản hồi tự động nếu ý định của khách hàng khớp
                    với các nhãn này. Mọi ý định nằm ngoài list sẽ tự động
                    chuyển cho nhân viên thật (Escalate). Nếu để trống, bot
                    sẽ trả lời tất cả.
                  </p>
                </div>
              </PortalTooltip>
            </div>

            <div className="space-y-3">
              <div className="p-2 bg-base-100 border border-base-content/10 rounded-md flex items-center justify-between gap-3 focus-within:border-primary/60 transition-all">
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {botConfig.trigger_labels?.map((label: string) => (
                    <span
                      key={label}
                      className="badge badge-primary badge-soft rounded-full pl-3 pr-1.5 py-1 gap-1 text-xs font-semibold border border-primary/10 animate-in zoom-in-95"
                    >
                      {label}
                      <button
                        disabled={disabled}
                        type="button"
                        className="btn btn-circle btn-ghost btn-2xs size-4 text-base-content/60 hover:text-error transition-colors cursor-pointer"
                        onClick={() => removeLabel(label)}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    disabled={disabled}
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={addLabel}
                    placeholder="Thêm nhãn và nhấn Enter..."
                    className="bg-transparent border-none outline-none text-sm text-base-content placeholder:text-base-content/30 flex-1 min-w-[200px] py-1 px-2"
                  />
                </div>
              </div>

              {!disabled && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Hỏi giá",
                    "Tư vấn",
                    "Khiếu nại",
                    "Đặt lịch",
                    "Đơn hàng",
                    "Hỗ trợ kỹ thuật",
                  ]
                    .filter(
                      (label) =>
                        !(botConfig.trigger_labels || []).includes(label),
                    )
                    .map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const existingLabels = botConfig.trigger_labels || [];
                          onChangeBotConfig({
                            trigger_labels: [...existingLabels, label],
                          });
                          toast.success(`Đã thêm nhãn ý định: ${label}`);
                        }}
                        className="btn btn-soft btn-sm hover:bg-soft/60 rounded-md"
                      >
                        <Plus size={10} />
                        {label}
                      </button>
                    ))}
                  {[
                    "Hỏi giá",
                    "Tư vấn",
                    "Khiếu nại",
                    "Đặt lịch",
                    "Đơn hàng",
                    "Hỗ trợ kỹ thuật",
                  ].filter(
                    (label) =>
                      !(botConfig.trigger_labels || []).includes(label),
                  ).length === 0 && (
                    <span className="text-xs text-base-content/40 italic">
                      Đã thêm tất cả các nhãn gợi ý.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
