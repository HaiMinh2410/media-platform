import * as React from "react";
import { Bot } from "lucide-react";
import { BehaviorSection } from "./components/behavior-section";
import { AutoReplySection } from "./components/auto-reply-section";
import { SafetyLimitsSection } from "./components/safety-limits-section";

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
  botConfig: any;
  onChangeBotConfig: (updates: any) => void;
  isLoadingBot: boolean;
}

export function SafetyTab({
  persona,
  onChange,
  botConfig,
  onChangeBotConfig,
  isLoadingBot,
}: SafetyTabProps) {
  if (isLoadingBot) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-base-content/50">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="text-sm font-medium">Đang tải cấu hình Bot AI...</p>
      </div>
    );
  }

  if (!botConfig) {
    return (
      <div className="alert alert-error alert-soft text-sm p-4 rounded-xl">
        <span>
          Không thể tải cấu hình Bot cho tài khoản này. Vui lòng thử lại sau.
        </span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-content/5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 1. Trạng thái AI Assistant */}
      <div className="flex flex-row items-center justify-between gap-4 pb-6">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
            <Bot size={22} />
            Trạng thái AI Assistant
          </h3>
        </div>
        <input
          type="checkbox"
          checked={botConfig.is_active}
          onChange={(e) => onChangeBotConfig({ is_active: e.target.checked })}
          className="toggle checked:border-primary checked:bg-primary checked:text-base-content"
        />
      </div>

      {/* 2. Cấu hình hành vi (Behavior Settings) */}
      <BehaviorSection
        botConfig={botConfig}
        onChangeBotConfig={onChangeBotConfig}
        disabled={!botConfig.is_active}
      />

      {/* 3. Tự động nhắn tin (Auto-Reply) & Intent Routing */}
      <AutoReplySection
        botConfig={botConfig}
        onChangeBotConfig={onChangeBotConfig}
        disabled={!botConfig.is_active}
      />

      {/* 4. Tham số An toàn & Giới hạn */}
      <SafetyLimitsSection
        persona={persona}
        onChange={onChange}
        disabled={!botConfig.is_active}
      />
    </div>
  );
}
