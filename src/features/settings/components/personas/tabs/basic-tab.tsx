import * as React from "react";
import { HelpCircle, X, ShieldAlert, Smile } from "lucide-react";
import { Icon, AccountAvatar, PortalTooltip, SlidingTabs } from "@shared/ui";
import { cn } from "@shared/lib";

interface BasicTabProps {
  persona: {
    name: string;
    gender: string;
    age: number;
    personality: string;
    tone: string;
    signature_emojis: string[];
    avatar_url?: string;
    settings?: {
      delay_min?: number;
      delay_max?: number;
      link_rate_limit?: number;
      blacklist_keywords?: string[];
      response_length?: "short" | "medium" | "detailed";
    };
  };
  account: any;
  onChange: (updates: any) => void;
}

const RESPONSE_LENGTH_TABS = [
  { value: "short", label: "Ngắn gọn" },
  { value: "medium", label: "Vừa phải" },
  { value: "detailed", label: "Chi tiết" },
] as const;

export function BasicTab({ persona, account, onChange }: BasicTabProps) {
  const [keywordInput, setKeywordInput] = React.useState("");
  const [isPersonalityTooltipActive, setIsPersonalityTooltipActive] = React.useState(false);
  const personalityTooltipRef = React.useRef<HTMLDivElement>(null);
  const [isToneTooltipActive, setIsToneTooltipActive] = React.useState(false);
  const toneTooltipRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDetailsElement>(null);
  const [isBlacklistTooltipActive, setIsBlacklistTooltipActive] = React.useState(false);
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

  // Account Avatar logic
  const meta = (account?.metadata || {}) as any;
  const accountAvatarUrl =
    meta?.avatar_url ||
    meta?.profile_picture_url ||
    meta?.picture?.data?.url ||
    undefined;
  const platformLower = (account?.platform || "facebook").toLowerCase();
  const platformBorderColor =
    platformLower === "instagram"
      ? "border-instagram-gradient"
      : platformLower === "facebook"
        ? "border-facebook"
        : platformLower === "tiktok"
          ? "border-tiktok"
          : "border-base-content/10";

  // Quick Personality Tags
  const personalityTags = [
    "Vui vẻ",
    "Nhiệt tình",
    "Hài hước",
    "Nghiêm túc",
    "Gen Z",
    "Dễ thương",
    "Chu đáo",
  ];

  const handleAddPersonalityTag = (tag: string) => {
    const currentText = persona.personality || "";
    const newText = currentText ? `${currentText}, ${tag}` : tag;
    onChange({ personality: newText });
  };

  // Tone quick tags logic
  const toneOptions = [
    "Trang trọng",
    "Thân thiện",
    "Hài hước",
    "Ngắn gọn",
    "Nhiệt tình",
    "Lịch sự",
  ];

  const handleAddToneTag = (tag: string) => {
    const currentText = persona.tone || "";
    const newText = currentText ? `${currentText}, ${tag}` : tag;
    onChange({ tone: newText });
  };

  // Emojis logic
  const selectedEmojis = persona.signature_emojis || [];
  const popularEmojis = [
    "✨",
    "💖",
    "🥰",
    "🔥",
    "👍",
    "😊",
    "🎉",
    "😂",
    "🤖",
    "🚀",
    "💬",
    "🙌",
  ];

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
  const handleResponseLengthChange = (val: "short" | "medium" | "detailed") => {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Khối 1: Hồ sơ */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar của tài khoản */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <AccountAvatar
            avatarUrl={accountAvatarUrl}
            name={account?.platform_user_name || "Account"}
            platform={account?.platform || "facebook"}
            size={20}
            showPlatformIcon={false}
            avatarClassName={cn("border-2", platformBorderColor)}
          />
        </div>

        {/* Core Info Inputs */}
        <div className="flex-1 w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-base-content/60">
              Tên Persona (Nhân viên ảo)
            </label>
            <input
              type="text"
              value={persona.name || ""}
              onChange={(e) => onChange({ name: e.target.value })}
              className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
              placeholder="VD: Trợ lý Mai, Em, v.v."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-base-content/60">Giới tính</label>
              <select
                value={persona.gender || "female"}
                onChange={(e) => onChange({ gender: e.target.value })}
                className="select select-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all"
              >
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="neutral">Phi giới tính</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-base-content/60">Độ tuổi</label>
              <input
                type="number"
                value={persona.age || ""}
                onChange={(e) =>
                  onChange({ age: parseInt(e.target.value) || 20 })
                }
                className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all"
                placeholder="VD: 22"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Khối 2: Hồn cốt */}
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
                  <p className="text-base-content/70">Nhập từ 2 - 4 tính từ cốt lõi mô tả cách AI ứng xử.</p>
                  <div className="pt-1 border-t border-base-content/5 mt-1 text-base-content/60">
                    <span className="font-semibold text-base-content/85">Ví dụ:</span> Vui vẻ, năng động, chuẩn Gen Z nhưng vẫn lễ phép. Thỉnh thoảng dùng icon đáng yêu.
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
            {personalityTags.map((tag) => (
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
                <p className="text-base-content/70">Quyết định cách AI cấu trúc câu chữ khi trả lời khách hàng (Độ trang trọng, độ dài câu, mức độ biểu cảm).</p>
                <div className="pt-1 border-t border-base-content/5 mt-1 text-base-content/60">
                  <span className="font-semibold text-base-content/85">Ví dụ:</span> Chuyên nghiệp, lịch sự, đi thẳng vào vấn đề và ngắn gọn. Không nói dông dài.
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
            {toneOptions.map((tone) => (
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

      {/* Khối 3: Giao tiếp */}
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
              <details 
                ref={dropdownRef}
                className="dropdown dropdown-end shrink-0"
              >
                <summary
                  className="flex items-center justify-center bg-soft hover:bg-soft/60 cursor-pointer rounded-full p-1 list-none [&::-webkit-details-marker]:hidden outline-none"
                >
                  <Smile size={18} className="text-base-content/70" />
                </summary>
                <div
                  className="dropdown-content card card-compact p-2 bg-base-200 border border-base-content/10 rounded-xl w-48 shadow-lg z-50 grid grid-cols-4 gap-1"
                >
                  {popularEmojis.map((emoji) => (
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
            rounded="rounded-full"
            layoutId="personaResponseLength"
            className="bg-base-200"
          />
        </div>

        {/* Từ cấm kỵ */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-base-content/60 flex items-center gap-2">
              Blacklist Keywords (Các từ cấm kỵ)
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
                  <p className="font-semibold text-base-content">Mẹo thiết kế:</p>
                  <p className="text-base-content/70">
                    Danh sách các từ ngữ, cụm từ hoặc chủ đề AI tuyệt đối không được nhắc đến khi chat với khách hàng (ngăn cách bằng dấu phẩy). Hệ thống sẽ tự động chặn hoặc tìm cách nói giảm nói tránh nếu khách hàng cố tình khơi gợi.
                  </p>
                </div>
              </PortalTooltip>
            </label>
          </div>

          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleAddKeyword}
            className="input input-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
            placeholder="Thêm từ cấm (VD: lừa đảo, scam, ...)"
          />

          {/* Keyword tags display */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {blacklistKeywords.map((kw) => (
              <span
                key={kw}
                className="badge badge-error badge-soft rounded-full pl-3 pr-1.5 py-1 gap-1 text-xs font-bold border border-error/10"
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
          </div>
        </div>
      </div>
    </div>
  );
}
