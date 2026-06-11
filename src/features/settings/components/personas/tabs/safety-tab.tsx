import * as React from "react";

interface SafetyTabProps {
  persona: {
    settings?: {
      delay_min?: number;
      delay_max?: number;
      link_rate_limit?: number;
      blacklist_keywords?: string[];
    };
  };
  onChange: (updates: any) => void;
}

export function SafetyTab({ persona, onChange }: SafetyTabProps) {
  const updateSettings = (key: string, value: any) => {
    onChange({ settings: { ...persona.settings, [key]: value } });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-base-content/80">
            Delay Tối thiểu (giây)
          </label>
          <input
            type="number"
            value={persona.settings?.delay_min ?? 15}
            onChange={(e) =>
              updateSettings("delay_min", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-base-content/80">
            Delay Tối đa (giây)
          </label>
          <input
            type="number"
            value={persona.settings?.delay_max ?? 120}
            onChange={(e) =>
              updateSettings("delay_max", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Giới hạn gửi Link (trên mỗi hội thoại)
        </label>
        <input
          type="number"
          value={persona.settings?.link_rate_limit ?? 3}
          onChange={(e) =>
            updateSettings("link_rate_limit", parseInt(e.target.value) || 0)
          }
          className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <p className="text-xs text-base-content/40 font-medium">
          Giới hạn số lần AI được phép gửi link chốt sale để tránh spam.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Blacklist Keywords (Các từ cấm kỵ)
        </label>
        <textarea
          value={persona.settings?.blacklist_keywords?.join(", ") || ""}
          onChange={(e) =>
            updateSettings(
              "blacklist_keywords",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="textarea textarea-bordered w-full min-h-[100px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: lừa đảo, báo công an, scam..."
        />
        <p className="text-xs text-base-content/40 font-medium">
          Nếu tin nhắn của khách chứa các từ này, AI sẽ ngừng tương tác và
          chuyển cho người thật (Escalate).
        </p>
      </div>
    </div>
  );
}
