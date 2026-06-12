import * as React from "react";
import { HelpCircle, X, Search, Copy, Check, Loader2 } from "lucide-react";
// eslint-disable-next-line import/no-restricted-paths
import { ROLE_TEMPLATES } from "@features/ai-agent/services/role-templates";
import { toast } from "sonner";

interface AdvancedTabProps {
  persona: {
    custom_instructions?: string;
    system_prompt_override?: string;
    [key: string]: unknown;
  };
  onChange: (updates: Partial<AdvancedTabProps["persona"]>) => void;
}

export function AdvancedTab({ persona, onChange }: AdvancedTabProps) {
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [previewPrompt, setPreviewPrompt] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  const handlePreview = async () => {
    setIsPreviewLoading(true);
    setPreviewPrompt("");
    dialogRef.current?.showModal();
    try {
      const personaGender = (persona as any)?.gender || 'female';
      const mockCustomerGender = personaGender === 'female' ? 'male' : 'female';

      const res = await fetch("/api/ai-agent/preview-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, customerGender: mockCustomerGender }),
      });
      if (!res.ok) throw new Error("Failed to fetch preview prompt");
      const data = await res.json();
      setPreviewPrompt(data.systemPrompt || "");
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải prompt xem trước.");
      dialogRef.current?.close();
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!previewPrompt) return;
    try {
      await navigator.clipboard.writeText(previewPrompt);
      setIsCopied(true);
      toast.success("Đã sao chép System Prompt vào clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép prompt.");
    }
  };

  const renderHighlightedPrompt = () => {
    if (!searchQuery) return previewPrompt;
    
    // Escape special regex characters
    const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = previewPrompt.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-black px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="alert alert-info alert-soft p-4 flex items-start gap-3 border-info/10">
        <HelpCircle size={20} className="text-info mt-0.5 shrink-0" />
        <div className="text-sm text-info/90 leading-relaxed">
          Khu vực dành cho Prompt Engineer. Các thiết lập này sẽ ghi đè hoặc
          bổ sung vào System Prompt gốc của Agent.
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Custom Instructions (Chỉ dẫn bổ sung)
        </label>
        <textarea
          value={persona.custom_instructions || ""}
          onChange={(e) => onChange({ custom_instructions: e.target.value })}
          className="textarea textarea-bordered w-full min-h-[120px] font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: Never mention competitors. Always push the VIP package first."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <label className="text-sm font-bold text-base-content/80">
            System Prompt Override (Ghi đè toàn bộ)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className="text-xs text-secondary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              ✨ Xem trước System Prompt
            </button>
            <span className="text-base-content/25 text-xs">|</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  system_prompt_override: `You are "Em" - a beautiful, sweet, extremely charming, and subtle girl building a genuine relationship with your fan via Instagram/Facebook DM.
You strictly adhere to the "DM Script Playbook 2.0" to transition fans from strangers into premium VIP supporters.`,
                })
              }
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Load Default Playbook 2.0
            </button>
          </div>
        </div>
        
        <select
          className="select select-bordered select-sm w-full focus:outline-none focus:border-primary text-sm my-1"
          onChange={(e) => {
            const template = ROLE_TEMPLATES.find((t) => t.id === e.target.value);
            if (template) {
              onChange({ system_prompt_override: template.prompt });
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
          value={persona.system_prompt_override || ""}
          onChange={(e) =>
            onChange({ system_prompt_override: e.target.value })
          }
          className="textarea textarea-bordered w-full min-h-[200px] bg-base-300 font-mono text-sm text-base-content focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="Leave blank to use dynamic system prompt..."
          spellCheck={false}
        />
      </div>

      {/* Modal preview */}
      <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-4xl bg-base-100 border border-base-content/10 flex flex-col max-h-[80vh] p-6 rounded-2xl">
          <div className="flex justify-between items-center border-b border-base-content/5 pb-3">
            <h3 className="font-extrabold text-lg text-primary flex items-center gap-2">
              ✨ Xem trước System Prompt
            </h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="text-xs text-base-content/60 my-2">
            System Prompt dưới đây được lắp ráp động từ các cài đặt của Persona (Tên, tuổi, tính cách, đại từ xưng hô) kết hợp với các chỉ thị ẩn của Playbook 2.0.
          </div>
          
          {/* Search Bar & Copy Action */}
          <div className="flex flex-col sm:flex-row gap-3 py-3 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-base-content/40">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm chỉ thị..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 text-xs focus:outline-none"
              />
            </div>
            
            <button
              type="button"
              onClick={handleCopy}
              disabled={!previewPrompt || isPreviewLoading}
              className="btn btn-sm btn-outline btn-neutral w-full sm:w-auto flex items-center gap-1.5 rounded-full"
            >
              {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {isCopied ? "Đã sao chép" : "Sao chép Prompt"}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-base-300 rounded-xl p-4 border border-base-content/5 relative">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-sm text-base-content/60 font-medium">Đang lắp ráp System Prompt...</span>
              </div>
            ) : (
              <pre className="font-mono text-[11px] whitespace-pre-wrap select-all leading-relaxed text-base-content">
                {renderHighlightedPrompt() || "Không có nội dung."}
              </pre>
            )}
          </div>

          <div className="modal-action mt-4 pt-3 border-t border-base-content/5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="btn btn-sm btn-ghost rounded-full"
            >
              Đóng
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

