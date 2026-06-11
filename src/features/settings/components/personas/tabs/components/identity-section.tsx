import * as React from "react";
import { HelpCircle } from "lucide-react";
import { PortalTooltip } from "@shared/ui";

interface IdentitySectionProps {
  persona: {
    personality: string;
    tone: string;
  };
  onChange: (updates: any) => void;
}

const PERSONALITY_TAGS = [
  "Vui vẻ",
  "Nhiệt tình",
  "Hài hước",
  "Nghiêm túc",
  "Gen Z",
  "Dễ thương",
  "Chu đáo",
];

const TONE_OPTIONS = [
  "Trang trọng",
  "Thân thiện",
  "Hài hước",
  "Ngắn gọn",
  "Nhiệt tình",
  "Lịch sự",
];

export function IdentitySection({
  persona,
  onChange,
}: IdentitySectionProps) {
  const [isPersonalityTooltipActive, setIsPersonalityTooltipActive] =
    React.useState(false);
  const personalityTooltipRef = React.useRef<HTMLDivElement>(null);
  const [isToneTooltipActive, setIsToneTooltipActive] = React.useState(false);
  const toneTooltipRef = React.useRef<HTMLDivElement>(null);

  const handleAddPersonalityTag = (tag: string) => {
    const currentText = persona.personality || "";
    const newText = currentText ? `${currentText}, ${tag}` : tag;
    onChange({ personality: newText });
  };

  const handleAddToneTag = (tag: string) => {
    const currentText = persona.tone || "";
    const newText = currentText ? `${currentText}, ${tag}` : tag;
    onChange({ tone: newText });
  };

  return (
    <div className="border-t border-base-content/5 my-6 pt-6 space-y-4">
      {/* Tính cách */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm text-base-content/60 flex items-center gap-2">
            Tính cách
            <div
              ref={personalityTooltipRef}
              onMouseEnter={() => setIsPersonalityTooltipActive(true)}
              onMouseLeave={() => setIsPersonalityTooltipActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </div>
            <PortalTooltip
              active={isPersonalityTooltipActive}
              anchorRef={personalityTooltipRef}
              showArrow
              position="top"
              align="right"
              className="w-72 text-sm font-normal leading-relaxed"
            >
              <div className="space-y-1">
                <p className="font-semibold text-base-content">Mẹo thiết kế:</p>
                <p className="text-base-content/70">
                  Nhập từ 2 - 4 tính từ cốt lõi mô tả cách AI ứng xử.
                </p>
                <div className="pt-1 border-t border-base-content/5 mt-1 text-base-content/60">
                  <span className="font-semibold text-base-content/85">Ví dụ:</span>{" "}
                  Vui vẻ, năng động, chuẩn Gen Z nhưng vẫn lễ phép. Thỉnh thoảng
                  dùng icon đáng yêu.
                </div>
              </div>
            </PortalTooltip>
          </label>
        </div>
        <textarea
          value={persona.personality || ""}
          onChange={(e) => onChange({ personality: e.target.value })}
          className="textarea textarea-bordered w-full min-h-[90px] rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 resize-y"
          placeholder="VD: Vui vẻ, nhiệt tình, thỉnh thoảng dùng teencode nhẹ..."
        />
        {/* Quick tags */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {PERSONALITY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddPersonalityTag(tag)}
              className="btn btn-sm btn-soft rounded-md text-sm font-medium"
            >
              +{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tông giọng */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-base-content/60 flex items-center gap-2">
          Tông giọng (Tone)
          <div
            ref={toneTooltipRef}
            onMouseEnter={() => setIsToneTooltipActive(true)}
            onMouseLeave={() => setIsToneTooltipActive(false)}
            className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
          >
            <HelpCircle size={14} />
          </div>
          <PortalTooltip
            active={isToneTooltipActive}
            anchorRef={toneTooltipRef}
            showArrow
            position="top"
            align="right"
            className="w-72 text-sm font-normal leading-relaxed"
          >
            <div className="space-y-1">
              <p className="font-semibold text-base-content">Mẹo thiết kế:</p>
              <p className="text-base-content/70">
                Quyết định cách AI cấu trúc câu chữ khi trả lời khách hàng (Độ
                trang trọng, độ dài câu, mức độ biểu cảm).
              </p>
              <div className="pt-1 border-t border-base-content/5 mt-1 text-base-content/60">
                <span className="font-semibold text-base-content/85">Ví dụ:</span>{" "}
                Chuyên nghiệp, lịch sự, đi thẳng vào vấn đề và ngắn gọn. Không
                nói dông dài.
              </div>
            </div>
          </PortalTooltip>
        </label>
        {/* Custom tone input */}
        <textarea
          value={persona.tone || ""}
          onChange={(e) => onChange({ tone: e.target.value })}
          className="textarea textarea-bordered w-full min-h-[90px] rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 resize-y"
          placeholder="Ví dụ: Chuyên nghiệp, lịch sự và ngắn gọn"
        />

        {/* Quick tags */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => handleAddToneTag(tone)}
              className="btn btn-sm btn-soft rounded-md text-sm font-medium"
            >
              + {tone}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
