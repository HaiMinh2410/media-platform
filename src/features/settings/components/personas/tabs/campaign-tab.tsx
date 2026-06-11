import * as React from "react";
import { cn } from "@shared/lib";
import {
  Sparkles,
  Check,
  RotateCw,
  Undo2,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { PortalTooltip, SlidingTabs } from "@shared/ui";

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
}

function AutoResizingTextarea({
  value,
  onChange,
  className,
  maxHeight = 200,
  ...props
}: AutoResizingTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [maxHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn(
        "textarea textarea-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 overflow-y-auto resize-none",
        className
      )}
      style={{ maxHeight: `${maxHeight}px` }}
      {...props}
    />
  );
}

interface CampaignTabProps {
  persona: {
    name: string;
    gender: string;
    personality: string;
    tone: string;
    signature_emojis: string[];
    custom_instructions: string;
    campaign_name: string;
    current_offer: string;
    scarcity_message: string;
    settings?: {
      campaign_objective?: string;
    };
  };
  onChange: (updates: any) => void;
}

const CAMPAIGN_OBJECTIVE_TABS = [
  { value: "lead_generation", label: "Thu thập Lead" },
  { value: "direct_sale", label: "Chốt Sale" },
  { value: "support", label: "Hỗ trợ khách" },
  { value: "engagement", label: "Tăng tương tác" },
] as const;

export function CampaignTab({ persona, onChange }: CampaignTabProps) {
  const updateSettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  // AI Campaign Proposal States
  const [aiProposal, setAiProposal] = React.useState<{
    currentOffer: string;
    scarcityMessage: string;
  } | null>(null);
  const [originalValues, setOriginalValues] = React.useState<{
    currentOffer: string;
    scarcityMessage: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Help tooltip for Campaign Objective
  const [isObjectiveHelpActive, setIsObjectiveHelpActive] = React.useState(false);
  const objectiveHelpRef = React.useRef<HTMLDivElement>(null);

  // Debounce trigger cho Campaign Name & Objective
  const [debouncedCampaign, setDebouncedCampaign] = React.useState({
    name: persona.campaign_name || "",
    objective: persona.settings?.campaign_objective || "lead_generation",
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCampaign({
        name: persona.campaign_name || "",
        objective: persona.settings?.campaign_objective || "lead_generation",
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [persona.campaign_name, persona.settings?.campaign_objective]);

  // Ref ghi nhận giá trị khởi tạo khi Component được Mount để tránh tự kích hoạt
  const initialValuesRef = React.useRef({
    name: persona.campaign_name || "",
    objective: persona.settings?.campaign_objective || "lead_generation",
  });

  const handleGenerateProposal = async (name: string, objective: string) => {
    if (!name || isGenerating) return;

    setIsGenerating(true);
    try {
      if (!originalValues) {
        setOriginalValues({
          currentOffer: persona.current_offer || "",
          scarcityMessage: persona.scarcity_message || "",
        });
      }

      const res = await fetch("/api/ai-personas/campaign-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: name,
          campaignObjective: objective,
          persona: {
            name: persona.name,
            gender: persona.gender,
            personality: persona.personality,
            tone: persona.tone,
            signature_emojis: persona.signature_emojis,
            custom_instructions: persona.custom_instructions,
          },
        }),
      });
      const data = await res.json();

      if (data && !data.error) {
        setAiProposal({
          currentOffer: data.currentOffer,
          scarcityMessage: data.scarcityMessage,
        });

        onChange({
          current_offer: data.currentOffer,
          scarcity_message: data.scarcityMessage,
        });
      }
    } catch (err) {
      console.error("Failed to generate campaign proposal:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (
      debouncedCampaign.name &&
      (debouncedCampaign.name !== initialValuesRef.current.name ||
        debouncedCampaign.objective !== initialValuesRef.current.objective)
    ) {
      handleGenerateProposal(
        debouncedCampaign.name,
        debouncedCampaign.objective,
      );
    }
  }, [debouncedCampaign]);

  const handleRewrite = () => {
    handleGenerateProposal(
      persona.campaign_name || "",
      persona.settings?.campaign_objective || "lead_generation",
    );
  };

  const handleAcceptProposal = () => {
    setAiProposal(null);
    setOriginalValues(null);
  };

  const handleRejectProposal = () => {
    if (originalValues) {
      onChange({
        current_offer: originalValues.currentOffer,
        scarcity_message: originalValues.scarcityMessage,
      });
    }
    setAiProposal(null);
    setOriginalValues(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Tên Chiến dịch */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-base-content/60">
          Tên Chiến dịch
        </label>
        <input
          type="text"
          value={persona.campaign_name || ""}
          onChange={(e) => onChange({ campaign_name: e.target.value })}
          className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
          placeholder="VD: Sale Cuối Tháng 5"
        />
      </div>

      {/* Mục tiêu chiến dịch */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm text-base-content/60 flex items-center gap-2">
            Mục tiêu chiến dịch (Objective)
            <div
              ref={objectiveHelpRef}
              onMouseEnter={() => setIsObjectiveHelpActive(true)}
              onMouseLeave={() => setIsObjectiveHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isObjectiveHelpActive}
              anchorRef={objectiveHelpRef}
              showArrow
              position="top"
              align="left"
              className="w-80 text-xs font-normal leading-relaxed"
            >
              <div className="space-y-1.5">
                <p className="font-semibold text-base-content">Chi tiết mục tiêu:</p>
                <ul className="list-disc pl-4 space-y-1 text-base-content/70">
                  <li><span className="font-semibold text-base-content/85">Thu thập Lead:</span> Tập trung thu thập SĐT, Email để telesale hoặc gửi ưu đãi.</li>
                  <li><span className="font-semibold text-base-content/85">Chốt Sale:</span> Thuyết phục khách mua hàng và gửi link thanh toán/chốt đơn.</li>
                  <li><span className="font-semibold text-base-content/85">Hỗ trợ khách:</span> Giải đáp thắc mắc về sản phẩm/dịch vụ, tư vấn khách hàng.</li>
                  <li><span className="font-semibold text-base-content/85">Tăng tương tác:</span> Trò chuyện thân thiện, giữ tương tác tích cực với khách.</li>
                </ul>
              </div>
            </PortalTooltip>
          </label>
        </div>
        <SlidingTabs
          items={CAMPAIGN_OBJECTIVE_TABS}
          activeValue={persona.settings?.campaign_objective || "lead_generation"}
          onChange={(val) => updateSettings("campaign_objective", val)}
          size="sm"
          fullWidth
          rounded="rounded-full"
          layoutId="campaignObjectiveTabs"
          className="bg-base-200"
        />
      </div>

      {/* AI Proposal Action and Info Bars */}
      {isGenerating && (
        <div className="alert alert-neutral bg-base-200/50 border-base-content/5 p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={18} />
            <div className="text-sm text-base-content/80">
              <span className="font-bold block text-base-content">
                AI đang phân tích và viết đề xuất...
              </span>
              <span className="text-xs text-base-content/60">
                Đang tối ưu hóa Lời chào hàng & Thông điệp khan hiếm tối ưu cho chiến dịch
              </span>
            </div>
          </div>
        </div>
      )}

      {aiProposal && (
        <div className="card bg-secondary/5 border border-secondary/20 p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <Sparkles
              className="text-secondary shrink-0 mt-0.5 animate-bounce"
              size={18}
            />
            <div className="text-sm">
              <span className="font-bold text-base-content block">
                ✨ AI đề xuất phương án tối ưu!
              </span>
              <span className="text-xs text-base-content/60">
                Đã tự động điền. Hãy điều chỉnh trực tiếp hoặc đồng ý/viết lại ở đây nhen.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-secondary/20 pt-3">
            <button
              type="button"
              onClick={handleRejectProposal}
              className="btn btn-sm btn-ghost border border-base-content/10"
              title="Khôi phục giá trị gốc"
            >
              <Undo2 size={14} />
              <span>Bỏ qua</span>
            </button>
            <button
              type="button"
              onClick={handleRewrite}
              disabled={isGenerating}
              className="btn btn-sm btn-outline btn-secondary"
              title="Yêu cầu AI viết phương án khác"
            >
              <RotateCw
                className={cn("size-3.5", isGenerating && "animate-spin")}
                size={14}
              />
              <span>Viết lại</span>
            </button>
            <button
              type="button"
              onClick={handleAcceptProposal}
              className="btn btn-sm btn-success text-success-content"
              title="Đồng ý với đề xuất của AI"
            >
              <Check size={14} />
              <span>Đồng ý</span>
            </button>
          </div>
        </div>
      )}

      {/* Lời chào hàng */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm text-base-content/60">
            Lời chào hàng hiện tại (Current Offer)
          </label>
          {aiProposal && (
            <span className="badge badge-secondary badge-soft font-bold text-2xs animate-pulse">
              <Sparkles size={10} />
              Đề xuất bởi AI
            </span>
          )}
        </div>
        <AutoResizingTextarea
          value={persona.current_offer || ""}
          onChange={(e) => onChange({ current_offer: e.target.value })}
          className={cn(
            "w-full",
            aiProposal
              ? "textarea-secondary bg-secondary/5 ring-2 ring-secondary/20 border-secondary/40 shadow-xs"
              : "",
          )}
          placeholder="VD: Giảm giá 50% cho 100 khách hàng đầu tiên mua combo X..."
          maxHeight={200}
        />
      </div>

      {/* Thông điệp khan hiếm */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm text-base-content/60">
            Thông điệp khan hiếm (Scarcity)
          </label>
          {aiProposal && (
            <span className="badge badge-secondary badge-soft font-bold text-2xs animate-pulse">
              <Sparkles size={10} />
              Đề xuất bởi AI
            </span>
          )}
        </div>
        <AutoResizingTextarea
          value={persona.scarcity_message || ""}
          onChange={(e) => onChange({ scarcity_message: e.target.value })}
          className={cn(
            "w-full",
            aiProposal
              ? "textarea-secondary bg-secondary/5 ring-2 ring-secondary/20 border-secondary/40 shadow-xs"
              : "",
          )}
          placeholder="VD: Chỉ còn duy nhất 2 suất áp dụng mã giảm giá này thôi ạ..."
          maxHeight={150}
        />
      </div>
    </div>
  );
}
