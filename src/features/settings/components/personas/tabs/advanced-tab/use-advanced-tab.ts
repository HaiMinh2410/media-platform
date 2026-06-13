import * as React from "react";
import { toast } from "sonner";

interface UseAdvancedTabProps {
  persona: {
    custom_instructions?: string;
    system_prompt_override?: string;
    [key: string]: unknown;
  };
  onChange: (updates: Partial<UseAdvancedTabProps["persona"]>) => void;
}

export function useAdvancedTab({ persona, onChange }: UseAdvancedTabProps) {
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [previewPrompt, setPreviewPrompt] = React.useState("");
  const [originalPrompt, setOriginalPrompt] = React.useState("");
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [previewCustomerGender, setPreviewCustomerGender] = React.useState<
    "male" | "female" | null
  >(null);
  const [activeTab, setActiveTab] = React.useState<"custom" | "override">(
    "override",
  );

  const [tempOverridePrompt, setTempOverridePrompt] = React.useState(
    persona.system_prompt_override || "",
  );
  const isOverrideActive = !!persona.system_prompt_override;

  React.useEffect(() => {
    if (persona.system_prompt_override) {
      setTempOverridePrompt(persona.system_prompt_override);
    }
  }, [persona.system_prompt_override]);

  const customTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const overrideTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [isCustomHelpActive, setIsCustomHelpActive] = React.useState(false);
  const customHelpRef = React.useRef<HTMLSpanElement>(null);
  const [isOverrideHelpActive, setIsOverrideHelpActive] = React.useState(false);
  const overrideHelpRef = React.useRef<HTMLSpanElement>(null);

  // Refs phục vụ cho tính năng Đồng bộ cuộn (Synchronized Scrolling)
  const leftScrollRef = React.useRef<HTMLDivElement>(null);
  const rightScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollingLeft = React.useRef(false);
  const isScrollingRight = React.useRef(false);

  const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingRight.current) return;
    isScrollingLeft.current = true;
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    window.requestAnimationFrame(() => {
      isScrollingLeft.current = false;
    });
  };

  const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingLeft.current) return;
    isScrollingRight.current = true;
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    window.requestAnimationFrame(() => {
      isScrollingRight.current = false;
    });
  };

  const fetchPreviewPrompt = async (selectedGender: "male" | "female") => {
    setIsPreviewLoading(true);
    setPreviewPrompt("");
    setOriginalPrompt("");
    try {
      // 1. Fetch current dynamic prompt (bao gồm cả custom_instructions và system_prompt_override)
      const resCurrent = await fetch("/api/ai-agent/preview-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, customerGender: selectedGender }),
      });

      // 2. Fetch original dynamic prompt (vô hiệu hóa tạm thời override và custom)
      const cleanPersona = {
        ...persona,
        custom_instructions: "",
        system_prompt_override: "",
      };
      const resOriginal = await fetch("/api/ai-agent/preview-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: cleanPersona,
          customerGender: selectedGender,
        }),
      });

      if (!resCurrent.ok || !resOriginal.ok) {
        throw new Error("Failed to fetch preview prompt");
      }

      const dataCurrent = await resCurrent.json();
      const dataOriginal = await resOriginal.json();

      setPreviewPrompt(dataCurrent.systemPrompt || "");
      setOriginalPrompt(dataOriginal.systemPrompt || "");
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải prompt xem trước.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePreview = async () => {
    dialogRef.current?.showModal();
    const personaGender = (persona as { gender?: string })?.gender || "female";
    const initialGender = personaGender === "female" ? "male" : "female";
    setPreviewCustomerGender(initialGender);
    await fetchPreviewPrompt(initialGender);
  };

  const handleGenderChange = async (selectedGender: "male" | "female") => {
    setPreviewCustomerGender(selectedGender);
    await fetchPreviewPrompt(selectedGender);
  };

  const handleInsertVariable = (
    variable: string,
    target: "custom" | "override",
  ) => {
    const ref = target === "custom" ? customTextareaRef : overrideTextareaRef;
    const textarea = ref.current;
    if (!textarea) return;

    const value =
      target === "custom"
        ? persona.custom_instructions || ""
        : persona.system_prompt_override || "";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue =
      value.substring(0, start) + variable + value.substring(end);

    onChange({
      [target === "custom" ? "custom_instructions" : "system_prompt_override"]:
        newValue,
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length,
      );
    }, 50);
  };

  return {
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
  };
}
