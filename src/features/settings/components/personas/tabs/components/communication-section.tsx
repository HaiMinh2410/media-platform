import * as React from "react";
import { X, ShieldAlert, Smile } from "lucide-react";
import { Icon, PortalTooltip, SlidingTabs } from "@shared/ui";
import { toast } from "sonner";

const RESPONSE_LENGTH_TABS = [
  { value: "short", label: "Ngắn gọn" },
  { value: "medium", label: "Vừa phải" },
  { value: "detailed", label: "Chi tiết" },
] as const;

const POPULAR_EMOJIS = [
  "✨", "💖", "🥰", "🔥", "👍", "😊",
  "🎉", "😂", "🤖", "🚀", "💬", "🙌",
];

interface CommunicationSectionProps {
  persona: {
    signature_emojis: string[];
    settings?: {
      response_length?: "short" | "medium" | "detailed";
      blacklist_keywords?: string[];
    };
  };
  onChange: (updates: any) => void;
}

export function CommunicationSection({
  persona,
  onChange,
}: CommunicationSectionProps) {
  const [keywordInput, setKeywordInput] = React.useState("");
  const dropdownRef = React.useRef<HTMLDetailsElement>(null);
  const [isBlacklistTooltipActive, setIsBlacklistTooltipActive] =
    React.useState(false);
  const blacklistTooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        dropdownRef.current.hasAttribute("open") &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dropdownRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Emojis logic
  const selectedEmojis = persona.signature_emojis || [];

  const handleAddEmoji = (emoji: string) => {
    if (!selectedEmojis.includes(emoji)) {
      onChange({ signature_emojis: [...selectedEmojis, emoji] });
    }
  };

  const handleRemoveEmoji = (emojiToRemove: string) => {
    const updated = selectedEmojis.filter((e: string) => e !== emojiToRemove);
    onChange({ signature_emojis: updated });
  };

  // Response Style logic
  const responseLength = persona.settings?.response_length || "medium";
  const handleResponseLengthChange = (
    val: "short" | "medium" | "detailed"
  ) => {
    onChange({
      settings: {
        ...persona.settings,
        response_length: val,
      },
    });
  };

  // Blacklist keywords logic
  const blacklistKeywords = persona.settings?.blacklist_keywords || [];

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = keywordInput.trim();
      if (val && !blacklistKeywords.includes(val)) {
        onChange({
          settings: {
            ...persona.settings,
            blacklist_keywords: [...blacklistKeywords, val],
          },
        });
        toast.success(`Đã thêm từ khóa cấm: ${val}`);
        setKeywordInput("");
      }
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const updated = blacklistKeywords.filter((k: string) => k !== kwToRemove);
    onChange({
      settings: {
        ...persona.settings,
        blacklist_keywords: updated,
      },
    });
  };

  return (
    <div className="border-t border-base-content/5 mt-6 pt-6 space-y-5">
      {/* Emojis */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm text-base-content/60">
            Biểu tượng cảm xúc đặc trưng (Emojis)
          </label>
        </div>

        {/* Emoji tags display with picker inside */}
        <div className="min-h-[46px] p-2 bg-base-200 border border-base-content/5 rounded-md flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center flex-1">
            {selectedEmojis.length === 0 ? (
              <span className="text-sm text-base-content/30 ml-2">
                Chưa chọn emoji nào...
              </span>
            ) : (
              selectedEmojis.map((emoji) => (
                <span
                  key={emoji}
                  className="badge badge-ghost rounded-full pl-2.5 pr-1 py-1 gap-1 text-lg font-medium"
                >
                  {emoji}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmoji(emoji)}
                    className="btn btn-circle btn-ghost hover:bg-soft btn-2xs size-5 p-0 text-base-content/60 hover:text-error"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedEmojis.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ signature_emojis: [] })}
                className="flex items-center justify-center bg-soft hover:bg-soft/60 cursor-pointer rounded-full p-1 text-base-content/70 hover:text-error transition-colors"
                title="Xóa tất cả"
              >
                <X size={18} />
              </button>
            )}

            {/* Emoji Picker Dropdown */}
            <details ref={dropdownRef} className="dropdown dropdown-end shrink-0">
              <summary className="flex items-center justify-center bg-soft hover:bg-soft/60 cursor-pointer rounded-full p-1 list-none [&::-webkit-details-marker]:hidden outline-none">
                <Smile size={18} className="text-base-content/70" />
              </summary>
              <div className="dropdown-content card card-compact p-2 bg-base-200 border border-base-content/10 rounded-xl w-48 shadow-lg z-50 grid grid-cols-4 gap-1">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      handleAddEmoji(emoji);
                      if (dropdownRef.current) {
                        dropdownRef.current.removeAttribute("open");
                      }
                    }}
                    className="btn btn-sm btn-ghost hover:bg-soft btn-circle text-base rounded-lg cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Từ cấm kỵ */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm text-base-content/60 flex items-center gap-2">
            Từ khóa Cấm kỵ (Blacklist Keywords)
            <div
              ref={blacklistTooltipRef}
              onMouseEnter={() => setIsBlacklistTooltipActive(true)}
              onMouseLeave={() => setIsBlacklistTooltipActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <Icon lucide={ShieldAlert} size={16} />
            </div>
            <PortalTooltip
              active={isBlacklistTooltipActive}
              anchorRef={blacklistTooltipRef}
              showArrow
              position="top"
              align="right"
              className="w-80 text-sm font-normal leading-relaxed"
            >
              <div className="space-y-1">
                <p className="font-semibold text-base-content">
                  Bộ lọc từ khóa cấm kỵ:
                </p>
                <p className="text-base-content/70">
                  Khi tin nhắn của khách chứa các từ này, AI sẽ tự động dừng
                  tương tác và chuyển tiếp cuộc hội thoại cho nhân viên thật
                  (Escalate) để xử lý thủ công, đảm bảo an toàn.
                </p>
              </div>
            </PortalTooltip>
          </label>
        </div>

        <div className="min-h-[46px] p-2 bg-base-200 border border-base-content/5 rounded-md flex items-center justify-between gap-3 focus-within:border-error/40 transition-all mt-1">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {blacklistKeywords.map((kw) => (
              <span
                key={kw}
                className="badge badge-error badge-soft rounded-full pl-3 pr-1.5 py-1 gap-1 text-xs font-bold border border-error/10 animate-in zoom-in-95"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="btn btn-circle btn-ghost btn-2xs size-4 p-0 text-error hover:bg-error/20"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
              placeholder="Thêm từ cấm và nhấn Enter..."
              className="bg-transparent border-none outline-none text-sm text-base-content placeholder:text-base-content/30 flex-1 min-w-[200px] py-1 px-2"
            />
          </div>
        </div>
        <p className="text-2xs text-base-content/40 font-medium mt-1">
          Nếu tin nhắn của khách chứa các từ này, AI sẽ tự động dừng tương tác
          và chuyển tiếp hội thoại cho nhân viên thật (Escalate).
        </p>
      </div>

      {/* Cách phản hồi */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-base-content/60">
          Cách phản hồi (Độ dài tin nhắn)
        </label>
        <SlidingTabs
          items={RESPONSE_LENGTH_TABS}
          activeValue={responseLength}
          onChange={handleResponseLengthChange}
          fullWidth
          rounded="rounded-lg"
          layoutId="personaResponseLength"
          className="bg-base-200 rounded-md"
        />
      </div>
    </div>
  );
}
