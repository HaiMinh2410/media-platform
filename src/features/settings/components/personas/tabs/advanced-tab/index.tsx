import * as React from "react";
import { HelpCircle, AlertTriangle, ChevronDown, BookCopy, Eye } from "lucide-react";
import { ROLE_TEMPLATES } from "@features/ai-agent/services/role-templates";
import { toast } from "sonner";
import { SlidingTabs, PortalTooltip, RangeSelector } from "@shared/ui";
import { SKELETON_TEMPLATES } from "./advanced-tab.constants";
import { diffLines } from "./advanced-tab.helpers";
import { useAdvancedTab } from "./use-advanced-tab";
import { VariableBadge } from "./components/variable-badge";
import { PromptPreviewModal } from "./components/prompt-preview-modal";

export interface AdvancedTabProps {
  persona: {
    custom_instructions?: string;
    system_prompt_override?: string;
    [key: string]: unknown;
  };
  onChange: (updates: Partial<AdvancedTabProps["persona"]>) => void;
}

export function AdvancedTab({ persona, onChange }: AdvancedTabProps) {
  const {
    isPreviewLoading,
    previewPrompt,
    originalPrompt,
    dialogRef,
    previewCustomerGender,
    activeTab,
    setActiveTab,
    tempOverridePrompt,
    setTempOverridePrompt,
    isOverrideActive,
    customTextareaRef,
    overrideTextareaRef,
    isCustomHelpActive,
    setIsCustomHelpActive,
    customHelpRef,
    isOverrideHelpActive,
    setIsOverrideHelpActive,
    overrideHelpRef,
    leftScrollRef,
    rightScrollRef,
    handleLeftScroll,
    handleRightScroll,
    handlePreview,
    handleGenderChange,
    handleInsertVariable,
  } = useAdvancedTab({ persona, onChange });

  const allTemplates = [
    ...SKELETON_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.name,
      prompt: t.prompt,
      dividerBefore: false,
      dropdownLabel: (
        <div className="flex flex-col text-left py-0.5">
          <span className="font-semibold text-xs text-base-content">
            {t.name}
          </span>
          <span className="text-xs text-base-content/40 font-normal leading-tight mt-0.5">
            {t.description}
          </span>
        </div>
      ),
    })),
    ...ROLE_TEMPLATES.map((t, idx) => ({
      id: t.id,
      label: t.name,
      prompt: t.prompt,
      dividerBefore: idx === 0,
      dropdownLabel: (
        <div className="flex flex-col text-left py-0.5">
          <span className="font-semibold text-xs text-base-content">
            {t.name}
          </span>
          <span className="text-xs text-base-content/40 font-normal leading-tight mt-0.5">
            {t.description}
          </span>
        </div>
      ),
    })),
  ];

  // Bọc tính toán Diff vào useMemo để tối ưu hóa hiệu năng render
  const diffResult = React.useMemo(() => {
    return diffLines(originalPrompt, previewPrompt);
  }, [originalPrompt, previewPrompt]);

  const renderCheatSheet = (target: "custom" | "override") => {
    const isOverride = target === "override";
    const isDisabled = isOverride && !isOverrideActive;

    const variables = [
      {
        name: "agent_pronoun",
        mockValue: "em/anh",
        description:
          "Đại từ tự xưng của AI Agent, được hệ thống tính toán tự động dựa trên giới tính của Creator và Khách hàng.",
        syntax: '...refer to yourself as "{{agent_pronoun}}"',
        example: "Hôm nay {{agent_pronoun}} thấy trong người hơi mệt...",
      },
      {
        name: "fan_pronoun",
        mockValue: "anh/chị/bạn",
        description:
          "Đại từ dùng để gọi Fan (Khách hàng) tương tác trong cuộc trò chuyện.",
        syntax: 'Address the fan as "{{fan_pronoun}}"',
        example:
          "Rất vui được làm quen với một người tinh tế như {{fan_pronoun}} ✨",
      },
      {
        name: "stage",
        mockValue: "G1/G2/G3",
        description:
          "Giai đoạn hiện tại của cuộc hội thoại theo kịch bản DM Script Playbook 2.0.",
        syntax:
          "G1 (Xây dựng lòng tin) | G2 (Thả thính/Làm ấm) | G3 (Upsell/Chốt đơn gửi link)",
        example:
          "If {{stage}} is G1, keep a polite tone and do NOT send any link.",
      },
      ...(target === "override"
        ? [
            {
              name: "persona_name",
              mockValue: "Tên",
              description:
                "Tên cấu hình của Persona Creator lấy từ Database (Ví dụ: Em, Linh, Kaity...).",
              syntax:
                'You are "{{persona_name}}", a beautiful and sweet creator...',
              example:
                'You are "{{persona_name}}", a beautiful and sweet creator...',
            },
            {
              name: "persona_age",
              mockValue: "Tuổi",
              description:
                "Tuổi cấu hình của Persona Creator lấy từ Database (Ví dụ: 20, 22...).",
              syntax: "You are {{persona_age}} years old",
              example: "You are a {{persona_age}} years old beautiful girl...",
            },
            {
              name: "custom_instructions",
              mockValue: "Nối chuỗi",
              description:
                'Vị trí chiến lược để hệ thống backend tự động chèn nội dung văn bản từ tab "Chỉ dẫn bổ sung" vào.',
              syntax:
                "Nên đặt token này ở cuối kịch bản ghi đè của bạn để tránh làm đứt gãy tính năng nối chuỗi thông minh.",
              example: "{{custom_instructions}}",
            },
          ]
        : []),
    ];

    return (
      <div
        className={`transition-all ${
          isDisabled ? "opacity-40 pointer-events-none select-none" : ""
        }`}
      >
        <span className="tracking-wide text-base-content/60 select-none text-xs">
          Biến hệ thống
        </span>
        <div className="flex items-center mt-1.5 gap-1.5 flex-wrap">
          {variables.map((variable) => (
            <VariableBadge
              key={variable.name}
              name={variable.name}
              mockValue={variable.mockValue}
              description={variable.description}
              syntax={variable.syntax}
              example={variable.example}
              onInsert={(val) => handleInsertVariable(val, target)}
            />
          ))}
        </div>
      </div>
    );
  };

  const tabItems = [
    { value: "override", label: "Kịch bản Ghi đè Toàn bộ" },
    { value: "custom", label: "Chỉ dẫn tính cách bổ sung" },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header Tab bao gồm Tiêu đề & Bộ chuyển đổi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-base-content/5 pb-2 gap-4 mb-6">
        {activeTab === "custom" ? (
          <label className="text-xl font-bold text-base-content flex items-center gap-2">
            Chỉ dẫn bổ sung
            <span
              ref={customHelpRef}
              onMouseEnter={() => setIsCustomHelpActive(true)}
              onMouseLeave={() => setIsCustomHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </span>
            <PortalTooltip
              active={isCustomHelpActive}
              anchorRef={customHelpRef}
              showArrow
              position="bottom"
              align="right"
              className="w-80 text-sm font-normal leading-relaxed bg-soft border border-base-content/10 p-3 rounded-xl shadow-lg z-50 text-base-content/90"
            >
              <div className="space-y-1 text-left font-sans">
                <p className="font-bold text-primary/80">Chỉ dẫn bổ sung:</p>
                <p>
                  Thêm các hướng dẫn hành vi, luật lệ đặc thù cho Agent mà kịch
                  bản nền chưa có hoặc muốn nhấn mạnh.
                </p>
                <p className="text-base-content/50">
                  {
                    'Ví dụ: "Không bao giờ nhắc đến đối thủ", "Luôn khuyến khích mua gói VIP".'
                  }
                </p>
              </div>
            </PortalTooltip>
          </label>
        ) : (
          <label className="text-xl font-bold text-base-content flex items-center gap-2">
            Ghi đè toàn bộ
            <span
              ref={overrideHelpRef}
              onMouseEnter={() => setIsOverrideHelpActive(true)}
              onMouseLeave={() => setIsOverrideHelpActive(false)}
              className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <HelpCircle size={14} />
            </span>
            <PortalTooltip
              active={isOverrideHelpActive}
              anchorRef={overrideHelpRef}
              showArrow
              position="bottom"
              align="right"
              className="w-80 text-sm font-normal leading-relaxed bg-soft border border-base-content/10 p-3 rounded-xl shadow-lg z-50 text-base-content/90"
            >
              <div className="space-y-1 text-left font-sans">
                <p className="font-bold text-primary/80">
                  Ghi đè toàn bộ prompt:
                </p>
                <p>
                  Thay thế kịch bản nền bằng prompt riêng của bạn. Hệ thống vẫn
                  tự động đính kèm bộ quy tắc Xưng hô, Chống Bot và Định dạng
                  JSON đầu ra ở cuối.
                </p>
                <p className="text-warning/90 font-medium">
                  ⚠️ Đảm bảo chèn placeholder{" "}
                  <code>{"{{custom_instructions}}"}</code> trong prompt ghi đè
                  để có thể kế thừa trường Chỉ dẫn bổ sung.
                </p>
              </div>
            </PortalTooltip>
          </label>
        )}
        <SlidingTabs
          items={tabItems}
          activeValue={activeTab}
          onChange={setActiveTab}
          size="sm"
          rounded="rounded-full"
          className="bg-base-200"
          layoutId="advancedTabSelector"
        />
      </div>

      {activeTab === "custom" && (
        <div className="space-y-2 animate-in fade-in duration-300">
          {renderCheatSheet("custom")}
          <textarea
            ref={customTextareaRef}
            value={persona.custom_instructions || ""}
            onChange={(e) => onChange({ custom_instructions: e.target.value })}
            className="textarea textarea-bordered w-full min-h-[180px] rounded-xl text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 outline-none transition-colors duration-200 placeholder:text-base-content/30 resize-y"
            placeholder="VD: Never mention competitors. Always push the VIP package first. (Nhập chỉ dẫn tính cách bổ sung cho Agent)"
          />
        </div>
      )}

      {activeTab === "override" && (
        <div className="space-y-4">
          <div className="flex justify-end items-center gap-4 animate-in fade-in duration-200 mb-4">
            <button
              type="button"
              onClick={handlePreview}
              className="btn btn-sm btn-primary btn-soft gap-2 cursor-pointer rounded-full"
            >
              <Eye className="size-4" /> Xem Prompt
            </button>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isOverrideActive}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange({
                      system_prompt_override: tempOverridePrompt || " ",
                    });
                  } else {
                    setTempOverridePrompt(persona.system_prompt_override || "");
                    onChange({ system_prompt_override: "" });
                  }
                }}
                className="toggle checked:border-primary checked:bg-primary checked:text-base-content cursor-pointer"
              />
            </div>
          </div>

          <div className="relative">
            {/* 1. Khi đang tắt Ghi đè: Hiển thị Alert Info (Expand khi isOverrideActive false) */}
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{
                gridTemplateRows: !isOverrideActive ? "1fr" : "0fr",
                opacity: !isOverrideActive ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="text-sm mx-auto p-4 text-center max-w-2xl text-info leading-relaxed font-medium">
                  Hệ thống đang áp dụng <strong>Kịch bản mặc định</strong> cho
                  Persona này. Để tùy chỉnh hoặc viết Prompt riêng của bạn, vui
                  lòng kích hoạt công tắc <strong>Ghi đè</strong> ở trên.
                </div>
              </div>
            </div>

            {/* 2. Khi đang bật Ghi đè: Hiển thị Form cấu hình (Expand khi isOverrideActive true) */}
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{
                gridTemplateRows: isOverrideActive ? "1fr" : "0fr",
                opacity: isOverrideActive ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 pt-1">
                  {/* ÁP DỤNG NHANH KỊCH BẢN NỀN ĐƯỢC ĐƯA LÊN ĐẦU */}
                  <div className="w-full space-y-1">
                    <RangeSelector
                      value=""
                      options={allTemplates}
                      onChange={(selectedId) => {
                        if (!selectedId) return;

                        const template = allTemplates.find(
                          (t) => t.id === selectedId,
                        );
                        if (!template) return;

                        // HẬU VỆ UX: Nếu ô nhập liệu đang có code do người dùng tự viết, phải hỏi trước khi xóa đè
                        if (
                          persona.system_prompt_override &&
                          persona.system_prompt_override.trim() !== ""
                        ) {
                          const confirmOverwrite = window.confirm(
                            "Hành động này sẽ ghi đè và xóa toàn bộ nội dung Prompt hiện tại của bạn. Bạn có chắc chắn muốn áp dụng mẫu mới?",
                          );
                          if (!confirmOverwrite) {
                            return;
                          }
                        }

                        // Thực hiện ghi đè dữ liệu sau khi đã an toàn
                        onChange({ system_prompt_override: template.prompt });
                        toast.success(
                          `Đã tải cấu trúc kịch bản: ${template.label}`,
                        );
                      }}
                      size="sm"
                      hideIcon={true}
                      menuMinWidth="w-full"
                      triggerClassName="w-full bg-base-200 border-base-content/5 text-sm h-9 rounded-xl font-normal"
                      dropdownClassName="rounded-xl bg-soft border border-base-content/10 shadow-xl"
                      defaultIcon={null}
                      customTrigger={
                        <button
                          type="button"
                          className="btn btn-soft w-full bg-base-200 hover:bg-base-300/50 border border-base-content/5 text-sm h-10 rounded-md font-normal text-left flex justify-between items-center "
                        >
                          <span className="text-base-content/80 flex items-center gap-2">
                            <BookCopy className="size-3.5 text-base-content/60" />
                            Chọn prompt / kịch bản mẫu để áp dụng nhanh...
                          </span>
                          <ChevronDown className="size-4 text-base-content/60" />
                        </button>
                      }
                    />
                  </div>

                  {/* BIẾN HỆ THỐNG ĐƯỢC ĐƯA XUỐNG SÁT TRÊN TEXTAREA SOẠN THẢO */}
                  {renderCheatSheet("override")}

                  <textarea
                    ref={overrideTextareaRef}
                    value={persona.system_prompt_override || ""}
                    onChange={(e) =>
                      onChange({ system_prompt_override: e.target.value })
                    }
                    className="textarea textarea-bordered w-full min-h-[320px] bg-base-200 border-base-content/5 font-mono text-sm text-base-content focus:bg-base-200/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 outline-none transition-colors duration-200 rounded-xl"
                    placeholder="Nhập System Prompt tùy chỉnh của riêng bạn..."
                    spellCheck={false}
                  />

                  {persona.system_prompt_override && (
                    <div className="alert alert-warning border border-warning/15 bg-warning/5 p-3 flex items-start gap-2.5 rounded-lg text-xs mt-2 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle
                        size={16}
                        className="text-warning/90 shrink-0 mt-0.5"
                      />
                      <div className="text-warning/90 leading-normal font-medium">
                        <strong>Lưu ý:</strong> Khi dùng chế độ Ghi đè, hệ thống
                        vẫn sẽ tự động đính kèm bộ quy tắc Xưng hô động, Chống
                        Bot và Định dạng JSON đầu ra vào cuối Prompt để đảm bảo
                        Pipeline vận hành ổn định.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview với Diff Viewer */}
      <PromptPreviewModal
        dialogRef={dialogRef}
        isOverrideActive={isOverrideActive}
        previewCustomerGender={previewCustomerGender}
        isPreviewLoading={isPreviewLoading}
        diffResult={diffResult}
        previewPrompt={previewPrompt}
        originalPrompt={originalPrompt}
        leftScrollRef={leftScrollRef}
        rightScrollRef={rightScrollRef}
        handleLeftScroll={handleLeftScroll}
        handleRightScroll={handleRightScroll}
        handleGenderChange={handleGenderChange}
      />
    </div>
  );
}
