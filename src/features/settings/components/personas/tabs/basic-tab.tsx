import * as React from "react";
import { HelpCircle } from "lucide-react";

interface BasicTabProps {
  persona: {
    name: string;
    gender: string;
    age: number;
    personality: string;
    tone: string;
    signature_emojis: string[];
  };
  onChange: (updates: Partial<BasicTabProps["persona"]>) => void;
}

export function BasicTab({ persona, onChange }: BasicTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Thông tin định danh */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Tên Persona (Tên nhân viên ảo)
        </label>
        <input
          type="text"
          value={persona.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: Em, Mai, Trợ lý..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-base-content/80">
            Giới tính
          </label>
          <select
            value={persona.gender || "female"}
            onChange={(e) => onChange({ gender: e.target.value })}
            className="select select-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="female">Nữ</option>
            <option value="male">Nam</option>
            <option value="neutral">Phi giới tính</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-base-content/80">
            Độ tuổi
          </label>
          <input
            type="number"
            value={persona.age || ""}
            onChange={(e) =>
              onChange({ age: parseInt(e.target.value) || 20 })
            }
            className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="VD: 22"
          />
        </div>
      </div>

      <div className="divider opacity-50 my-2"></div>

      {/* Tính cách & Giọng điệu */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80 flex items-center gap-2">
          Tính cách{" "}
          <HelpCircle size={14} className="text-base-content/40" />
        </label>
        <textarea
          value={persona.personality || ""}
          onChange={(e) => onChange({ personality: e.target.value })}
          className="textarea textarea-bordered w-full min-h-[100px] resize-y focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: Vui vẻ, nhiệt tình, hơi gen Z một chút, hay dùng teencode nhẹ..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Tông giọng (Tone)
        </label>
        <textarea
          value={persona.tone || ""}
          onChange={(e) => onChange({ tone: e.target.value })}
          className="textarea textarea-bordered w-full min-h-[80px] resize-y focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: Chuyên nghiệp nhưng gần gũi, xưng hô anh/chị và em..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-base-content/80">
          Biểu tượng cảm xúc đặc trưng (Emojis)
        </label>
        <input
          type="text"
          value={persona.signature_emojis?.join(", ") || ""}
          onChange={(e) =>
            onChange({
              signature_emojis: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          placeholder="VD: ✨, 💖, 🥰 (ngăn cách bằng dấu phẩy)"
        />
      </div>
    </div>
  );
}

