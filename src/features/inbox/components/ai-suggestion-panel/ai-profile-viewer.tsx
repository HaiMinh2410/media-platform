"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { UserRoundPen, ChevronUp, ChevronDown } from "lucide-react";
import { useAiProfileViewer } from "./ai-profile-viewer/use-ai-profile-viewer";
import { FanPersonalitySection } from "./ai-profile-viewer/components/fan-personality-section";
import { XungHoAndStageSection } from "./ai-profile-viewer/components/xung-ho-and-stage-section";
import { NextActionSection } from "./ai-profile-viewer/components/next-action-section";
import { EmotionAndFlirtSection } from "./ai-profile-viewer/components/emotion-and-flirt-section";
import { ChatStatisticsSection } from "./ai-profile-viewer/components/chat-statistics-section";
import { RiskBannerSection } from "./ai-profile-viewer/components/risk-banner-section";
import { InsightsAndObjectionsSection } from "./ai-profile-viewer/components/insights-and-objections-section";

type AiProfileViewerProps = {
  fanProfile: any;
  gender: string | null;
  onUpdateGender: (gender: string | null) => void;
  onJumpToMessage?: (id: string) => void;
};

export function AiProfileViewer({
  fanProfile,
  gender,
  onUpdateGender,
  onJumpToMessage,
}: AiProfileViewerProps) {
  const {
    isProfileExpanded,
    setIsProfileExpanded,
    showInsights,
    setShowInsights,
    messages,
    profile,
    fanConfig,
    stageConfig,
    actionConfig,
  } = useAiProfileViewer({ fanProfile, gender });

  return (
    <div className="p-4 border-b border-base-content/5 bg-base-200/30 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserRoundPen size={16} className="animate-pulse" />
          <div>
            <h4 className="font-semibold text-base-content/70 hover:text-base-content transition-colors select-none">
              Hồ sơ phân tích AI
            </h4>
          </div>
        </div>

        <button
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          className="btn btn-ghost btn-xs btn-circle text-base-content/70"
          title={isProfileExpanded ? "Thu gọn" : "Mở rộng"}
        >
          {isProfileExpanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {isProfileExpanded && (
        <div className="flex flex-col gap-4 mt-1">
          {/* 1. Kiểu tính cách (Fan Type) */}
          <FanPersonalitySection profile={profile} fanConfig={fanConfig} />

          <hr className="border-base-content/5" />

          {/* 2. Trạng thái xưng hô & Giai đoạn hội thoại */}
          <XungHoAndStageSection
            gender={gender}
            onUpdateGender={onUpdateGender}
            profile={profile}
            stageConfig={stageConfig}
          />

          <hr className="border-base-content/5" />

          {/* 3. Hành động khuyên dùng (Next Action) */}
          <NextActionSection profile={profile} actionConfig={actionConfig} />

          <hr className="border-base-content/5" />

          {/* 4. Chỉ số cảm xúc (Emotion & Flirt Scorer) */}
          <EmotionAndFlirtSection profile={profile} />

          <hr className="border-base-content/5" />

          {/* 5. Thống kê lịch sử chat */}
          <ChatStatisticsSection profile={profile} />

          {profile && profile.riskLevel !== "low" && (
            <>
              <hr className="border-base-content/5 animate-pulse" />
              {/* 6. High Risk Short-Circuit Banner */}
              <RiskBannerSection profile={profile} />
            </>
          )}

          <hr className="border-base-content/5" />

          {/* 7. Nhận định sâu & Từ chối (Insights & Objections) */}
          <InsightsAndObjectionsSection
            profile={profile}
            showInsights={showInsights}
            setShowInsights={setShowInsights}
            onJumpToMessage={onJumpToMessage}
            messages={messages}
          />
        </div>
      )}
    </div>
  );
}
