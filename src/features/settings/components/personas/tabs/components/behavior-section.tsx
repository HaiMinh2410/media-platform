import * as React from "react";
import { cn } from "@shared/lib";
import { PortalTooltip, RangeSelector, type RangeOption } from "@shared/ui";
import { HelpCircle, Brain } from "lucide-react";

const MODEL_OPTIONS: RangeOption[] = [
  {
    id: "auto",
    label: "Tự động chọn (Định tuyến thông minh)",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          Tự động chọn
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Định tuyến thông minh tối ưu chi phí & chất lượng
        </span>
      </div>
    ),
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "LLaMA 3.3 70B Versatile",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          LLaMA 3.3 70B Versatile
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Mô hình khuyên dùng · Tốc độ/Chất lượng tối ưu
        </span>
      </div>
    ),
  },
  {
    id: "llama-3.1-8b-instant",
    label: "LLaMA 3.1 8B Instant",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          LLaMA 3.1 8B Instant
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Tốc độ cực nhanh · Tiết kiệm chi phí nhất
        </span>
      </div>
    ),
  },
  {
    id: "qwen-qwq-32b",
    label: "Qwen3 32B (32k Context)",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          Qwen3 32B (32k Context)
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Mô hình lý luận chuyên sâu · Đa ngôn ngữ
        </span>
      </div>
    ),
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          GPT-OSS 20B
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Cân bằng tốt giữa Tốc độ / Chất lượng
        </span>
      </div>
    ),
    dividerBefore: true,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    dropdownLabel: (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-xs text-base-content">
          GPT-OSS 120B
        </span>
        <span className="text-2xs text-base-content/60 font-normal mt-0.5">
          Mô hình cao cấp · Chất lượng phản hồi tốt nhất
        </span>
      </div>
    ),
  },
];

interface BehaviorSectionProps {
  botConfig: any;
  onChangeBotConfig: (updates: any) => void;
  disabled: boolean;
}

export function BehaviorSection({
  botConfig,
  onChangeBotConfig,
  disabled,
}: BehaviorSectionProps) {
  const [isModelHelpActive, setIsModelHelpActive] = React.useState(false);
  const modelHelpRef = React.useRef<HTMLDivElement>(null);

  const [isConfidenceHelpActive, setIsConfidenceHelpActive] =
    React.useState(false);
  const confidenceHelpRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "pt-6 pb-6 space-y-5 transition-all duration-300",
        disabled && "opacity-50 pointer-events-none select-none",
      )}
    >
      <h3 className="font-bold text-base-content flex items-center gap-2">
        <Brain size={16} className="text-base-content/80" />
        Thiết lập Hành vi AI
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/80">
              Mô hình AI (Model)
            </label>
            <div
              ref={modelHelpRef}
              onMouseEnter={() => setIsModelHelpActive(true)}
              onMouseLeave={() => setIsModelHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isModelHelpActive}
              anchorRef={modelHelpRef}
              showArrow
              position="top"
              align="right"
              className="w-80 text-xs font-normal leading-relaxed p-3"
            >
              <div className="space-y-1 text-left">
                <p className="font-semibold text-base-content">
                  Định tuyến Mô hình AI:
                </p>
                <p className="text-base-content/70">
                  Chọn "Tự động chọn" sẽ dùng **Model Routing** để tối ưu chất
                  lượng và chi phí: Whale dùng gpt-oss-120b, Luy/Cool dùng
                  Llama 70B, khác dùng Llama 8B.
                </p>
              </div>
            </PortalTooltip>
          </div>
          <RangeSelector
            value={botConfig.model}
            onChange={(value) => onChangeBotConfig({ model: value })}
            options={MODEL_OPTIONS}
            hideIcon={true}
            className="w-full"
            menuMinWidth="w-full"
            triggerClassName="w-full justify-between rounded-md h-10 px-3.5 bg-base-200 border border-base-content/5 hover:bg-base-200/70 text-sm font-medium normal-case text-left flex items-center shadow-none text-base-content hover:border-primary/40 focus:border-primary/60 transition-all"
            dropdownClassName="bg-base-200 border-base-content/10 shadow-xl rounded-xl"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content/80">
                Ngưỡng Tin cậy (Confidence)
              </label>
              <div
                ref={confidenceHelpRef}
                onMouseEnter={() => setIsConfidenceHelpActive(true)}
                onMouseLeave={() => setIsConfidenceHelpActive(false)}
                className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
              >
                <HelpCircle size={14} />
              </div>
              <PortalTooltip
                active={isConfidenceHelpActive}
                anchorRef={confidenceHelpRef}
                showArrow
                position="top"
                align="right"
                className="w-80 text-xs font-normal leading-relaxed p-3"
              >
                <div className="space-y-1 text-left">
                  <p className="font-semibold text-base-content">
                    Ngưỡng tin cậy tối thiểu:
                  </p>
                  <p className="text-base-content/70">
                    Độ tự tin tối thiểu (0.00 - 1.00) để AI tự động gửi câu
                    trả lời (Auto-Reply). Dưới ngưỡng này sẽ tạo tin nhắn nháp
                    (Draft) chờ duyệt.
                  </p>
                </div>
              </PortalTooltip>
            </div>
          </div>
          <div className="relative flex-1 flex items-center">
            <input
              disabled={disabled}
              type="checkbox"
              className="hidden" // Chỉ dùng checkbox ẩn để tương thích logic ban đầu nếu cần, ở đây ta render slider trực tiếp
            />
            <input
              disabled={disabled}
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
              className={cn(
                "range range-sm mt-1",
                (botConfig.confidence_threshold ?? 0.75) < 0.5
                  ? "range-error"
                  : (botConfig.confidence_threshold ?? 0.75) >= 0.8
                    ? "range-success"
                    : "range-info",
              )}
            />
            <span
              className={cn(
                "badge border-none font-semibold ml-2",
                (botConfig.confidence_threshold ?? 0.75) < 0.5
                  ? "text-error"
                  : (botConfig.confidence_threshold ?? 0.75) >= 0.8
                    ? "text-success"
                    : "text-info",
              )}
            >
              {(botConfig.confidence_threshold ?? 0.75).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
