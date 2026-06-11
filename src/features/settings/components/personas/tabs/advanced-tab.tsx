import * as React from "react";
import { HelpCircle } from "lucide-react";

interface AdvancedTabProps {
  persona: {
    custom_instructions: string;
    system_prompt_override: string;
  };
  onChange: (updates: Partial<AdvancedTabProps["persona"]>) => void;
}

export function AdvancedTab({ persona, onChange }: AdvancedTabProps) {
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
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-base-content/80">
            System Prompt Override (Ghi đè toàn bộ)
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                system_prompt_override: "Bạn là một trợ lý ảo siêu cấp...",
              })
            }
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            Load Default Playbook 2.0
          </button>
        </div>
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
    </div>
  );
}
