"use client";

import { cn } from "@shared/lib";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  UserRoundPen,
  ChevronUp,
  ChevronDown,
  User,
  Activity,
  Compass,
  Smile,
  TrendingUp,
  TrendingDown,
  Heart,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  MessageCircle,
  Info,
} from "lucide-react";
import { PortalTooltip, RangeSelector } from "@shared/ui";
import {
  getFanPersonalityConfiguration,
  getConversationStageConfiguration,
  getNextActionConfiguration,
} from "./panel-constants";

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
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  // Chuẩn hóa dữ liệu hồ sơ fan
  const profile = fanProfile
    ? {
        fanType: fanProfile.fan_type || fanProfile.fanType || "Unknown",
        fanTypeConfidence:
          fanProfile.fan_type_confidence ?? fanProfile.fanTypeConfidence ?? 0,
        stage: fanProfile.stage || "G1",
        dayCount: fanProfile.day_count ?? fanProfile.dayCount ?? 0,
        messageCount: fanProfile.message_count ?? fanProfile.messageCount ?? 0,
        emotionScore:
          fanProfile.emotion_score ?? fanProfile.emotionScore ?? 0.5,
        emotionTrend:
          fanProfile.emotion_trend ?? fanProfile.emotionTrend ?? "stable",
        flirtLevel: fanProfile.flirt_level ?? fanProfile.flirtLevel ?? 0,
        riskLevel: fanProfile.risk_level ?? fanProfile.riskLevel ?? "low",
        nextAction:
          fanProfile.next_action ?? fanProfile.nextAction ?? "continue",
        keyInsights: fanProfile.key_insights ?? fanProfile.keyInsights ?? [],
        objectionsSeen:
          fanProfile.objections_seen ?? fanProfile.objectionsSeen ?? [],
        firstInteractedAt:
          fanProfile.firstInteractedAt || fanProfile.created_at || null,
        conversationId:
          fanProfile.conversation_id || fanProfile.conversationId || null,
      }
    : null;

  // Tải danh sách tin nhắn để so khớp regex tìm nguồn gốc rào cản (objections)
  useEffect(() => {
    if (!profile?.conversationId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/conversations/${profile.conversationId}/messages?limit=100`,
        );
        const json = await res.json();
        if (json.data) {
          setMessages(json.data);
        }
      } catch (err) {
        console.error(
          "[AiProfileViewer] Error loading messages for objections:",
          err,
        );
      }
    };
    fetchMessages();
  }, [profile?.conversationId, profile?.objectionsSeen?.length]);

  const fanConfig = profile
    ? getFanPersonalityConfiguration(profile.fanType)
    : null;
  const stageConfig = profile
    ? getConversationStageConfiguration(profile.stage)
    : null;
  const actionConfig = profile
    ? getNextActionConfiguration(profile.nextAction)
    : null;

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

/**
 * Các Sub-components cục bộ
 */

type FanPersonalitySectionProps = {
  profile: any;
  fanConfig: any;
};

function FanPersonalitySection({
  profile,
  fanConfig,
}: FanPersonalitySectionProps) {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const confidenceRef = React.useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [showConfidenceTooltip, setShowConfidenceTooltip] =
    React.useState(false);

  return (
    <div className="flex flex-col gap-1.5 relative">
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/60 hover:text-base-content/70 transition-colors select-none">
          Kiểu tính cách:
        </span>
        {profile && fanConfig && (
          <span className={cn("text-sm font-bold", fanConfig.styleClass)}>
            {fanConfig.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          ref={confidenceRef}
          onMouseEnter={() => setShowConfidenceTooltip(true)}
          onMouseLeave={() => setShowConfidenceTooltip(false)}
          className="text-sm text-base-content/60 cursor-help hover:text-base-content/70 transition-colors select-none"
        >
          Mức độ tin cậy:
        </span>
        {profile && profile.fanTypeConfidence > 0 && (
          <span
            className={cn(
              "text-sm font-bold",
              profile.fanTypeConfidence < 0.5
                ? "text-error"
                : profile.fanTypeConfidence >= 0.8
                  ? "text-success"
                  : "text-info",
            )}
          >
            {Math.round(profile.fanTypeConfidence * 100)}%
          </span>
        )}
      </div>

      {profile && fanConfig ? (
        <p className="text-xs border border-base-content/5 bg-base-200 p-2 text-pretty rounded-md text-base-content/80 leading-relaxed mt-0.5">
          <strong className="text-base-content/60 not-italic font-bold">
            Đặc trưng:
          </strong>{" "}
          {fanConfig.description}
        </p>
      ) : (
        <div className="text-xs font-bold text-base-content/60 py-2 text-center select-none">
          Đang thu thập và phân tích dữ liệu...
        </div>
      )}

      {showConfidenceTooltip && (
        <PortalTooltip
          active={showConfidenceTooltip}
          anchorRef={confidenceRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Mức độ tin cậy (Confidence Score):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Độ tin cậy của AI khi phân tích và xếp loại Fan vào Kiểu tính cách
              hiện tại. Chỉ số này càng cao chứng tỏ độ khớp kịch bản và phân
              loại càng chuẩn xác.
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}

type XungHoAndStageSectionProps = {
  gender: string | null;
  onUpdateGender: (gender: string | null) => void;
  profile: any;
  stageConfig: any;
};

function XungHoAndStageSection({
  gender,
  onUpdateGender,
  profile,
  stageConfig,
}: XungHoAndStageSectionProps) {
  const genderRef = React.useRef<HTMLSpanElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [showGenderTooltip, setShowGenderTooltip] = React.useState(false);
  const [showStageTooltip, setShowStageTooltip] = React.useState(false);

  return (
    <>
      <div className="space-y-2.5">
        {/* Gender Card */}
        <div className="flex items-center gap-2">
          <span
            ref={genderRef}
            onMouseEnter={() => setShowGenderTooltip(true)}
            onMouseLeave={() => setShowGenderTooltip(false)}
            className="text-sm whitespace-nowrap text-base-content/60 flex items-center gap-1 cursor-help hover:text-base-content/70 transition-colors select-none"
          >
            Xưng hô:
          </span>
          <RangeSelector
            size="xs"
            value={gender || "Chưa rõ"}
            onChange={(val) => onUpdateGender(val === "Chưa rõ" ? null : val)}
            options={[
              { id: "Nam", label: "Nam (Anh)", iconColorClass: "text-info" },
              { id: "Nữ", label: "Nữ (Chị)", iconColorClass: "text-secondary" },
              {
                id: "Chưa rõ",
                label: "Chưa xác định",
                iconColorClass: "text-base-content/60",
              },
            ]}
            hideIcon
            menuAlign="left"
            className="flex-1"
            triggerClassName="rounded-md border-none text-sm font-medium"
          />
        </div>

        {/* Stage Card */}
        <div className="flex items-center gap-2 relative">
          <span className="text-sm text-base-content/60 select-none">
            Giai đoạn (Stage):
          </span>
          {profile && stageConfig ? (
            <div
              ref={stageRef}
              onMouseEnter={() => setShowStageTooltip(true)}
              onMouseLeave={() => setShowStageTooltip(false)}
              className={cn(
                "text-sm font-bold bg-transparent!  cursor-help",
                stageConfig.styleClass,
              )}
            >
              {stageConfig.label}
            </div>
          ) : (
            <div className="text-xs font-bold text-base-content/60 px-2 py-1 rounded-lg border border-base-content/5 text-center">
              G1 - Kết nối
            </div>
          )}
        </div>

        {profile && stageConfig && (
          <p className="text-sm text-base-content leading-relaxed">
            <strong className="text-base-content/60 select-none">
              Mục tiêu Stage:
            </strong>{" "}
            {stageConfig.targetGoal}
          </p>
        )}
      </div>

      {showGenderTooltip && (
        <PortalTooltip
          active={showGenderTooltip}
          anchorRef={genderRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm font-bold text-primary">
              Xưng hô hội thoại (Gender Pronoun):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Cách xưng hô hiện tại (Anh/Chị/Bạn) dùng để AI sinh câu trả lời tự
              nhiên. Hệ thống tự động thay đổi xưng hô tương ứng khi phát hiện
              Fan chủ động tự xưng.
            </p>
          </div>
        </PortalTooltip>
      )}

      {showStageTooltip && (
        <PortalTooltip
          active={showStageTooltip}
          anchorRef={stageRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <div className="text-xs text-base-content/85 leading-normal flex flex-col gap-0.5">
              {(!profile?.stage || profile.stage === "G1") && (
                <span>
                  <strong>G1 - Kết nối:</strong> ≤ 10 ngày tương tác. Xây dựng
                  lòng tin.
                </span>
              )}
              {profile?.stage === "G2" && (
                <span>
                  <strong>G2 - Làm ấm:</strong> 11 - 15 ngày tương tác (hoặc
                  thăng cấp sớm từ G1 nếu thiện cảm ≥ 85%).
                </span>
              )}
              {profile?.stage === "G3" && (
                <span>
                  <strong>G3 - Chốt đơn:</strong> &gt; 15 ngày tương tác (hoặc
                  thăng cấp sớm từ G2 nếu thiện cảm ≥ 80%).
                </span>
              )}
            </div>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}

type NextActionSectionProps = {
  profile: any;
  actionConfig: any;
};

function NextActionSection({ profile, actionConfig }: NextActionSectionProps) {
  const headerRef = React.useRef<HTMLSpanElement>(null);

  return (
    <div className="flex flex-col gap-2 relative">
      <span
        ref={headerRef}
        className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none"
      >
        <Compass size={14} /> Hành động khuyên dùng
      </span>
      {profile && actionConfig ? (
        <div
          className={cn(
            "text-sm px-2.5 py-2 font-semibold rounded-lg flex items-center justify-between",
            actionConfig.styleClass,
          )}
        >
          <span>{actionConfig.label}</span>
          <Compass
            size={11}
            className="shrink-0 animate-bounce"
            fill="currentColor"
          />
        </div>
      ) : (
        <div className="text-xs font-bold text-base-content/60 py-2 text-center select-none">
          Tiếp tục trò chuyện tự nhiên
        </div>
      )}
    </div>
  );
}

type EmotionAndFlirtSectionProps = {
  profile: any;
};

function EmotionAndFlirtSection({ profile }: EmotionAndFlirtSectionProps) {
  if (!profile) return null;
  const isEmotionIncreasing = profile.emotionTrend === "increasing";
  const isEmotionDecreasing = profile.emotionTrend === "decreasing";

  const emotionRef = React.useRef<HTMLSpanElement>(null);
  const flirtRef = React.useRef<HTMLSpanElement>(null);
  const [showEmotionTooltip, setShowEmotionTooltip] = React.useState(false);
  const [showFlirtTooltip, setShowFlirtTooltip] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Emotion Score */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span
            ref={emotionRef}
            onMouseEnter={() => setShowEmotionTooltip(true)}
            onMouseLeave={() => setShowEmotionTooltip(false)}
            className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
          >
            <Smile size={14} /> Độ thiện cảm (Emotion)
            {isEmotionIncreasing && (
              <TrendingUp size={14} className="text-success animate-pulse" />
            )}
            {isEmotionDecreasing && (
              <TrendingDown size={14} className="text-error animate-pulse" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-2 bg-base-content/10 rounded-full overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                profile.emotionScore < 0.5
                  ? "bg-warning"
                  : profile.emotionScore >= 0.8
                    ? "bg-success"
                    : "bg-info",
              )}
              style={{ width: `${profile.emotionScore * 100}%` }}
            />
          </div>
          <span
            className={cn(
              "text-sm font-bold shrink-0 min-w-[36px] text-right",
              profile.emotionScore < 0.5
                ? "text-warning"
                : profile.emotionScore >= 0.8
                  ? "text-success"
                  : "text-info",
            )}
          >
            {Math.round(profile.emotionScore * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-base-content/60 select-none pr-12">
          <span>Lạnh nhạt</span>
          <span>Nồng nhiệt</span>
        </div>
      </div>

      {/* Flirt Level */}
      <div className="flex justify-between items-center pt-1">
        <span
          ref={flirtRef}
          onMouseEnter={() => setShowFlirtTooltip(true)}
          onMouseLeave={() => setShowFlirtTooltip(false)}
          className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
        >
          <Heart size={14} /> Độ quấn quýt (Thính)
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((val) => (
            <Heart
              key={val}
              size={16}
              className={cn(
                "transition-all duration-300",
                val <= profile.flirtLevel
                  ? "fill-secondary text-secondary scale-110"
                  : "text-base-content/20 opacity-40",
              )}
            />
          ))}
        </div>
      </div>

      {showEmotionTooltip && (
        <PortalTooltip
          active={showEmotionTooltip}
          anchorRef={emotionRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Độ thiện cảm (Emotion):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Đánh giá cảm xúc hiện tại của Fan dựa trên tin nhắn gần nhất. Mức
              độ thiện cảm cao sẽ giúp đẩy nhanh tiến trình thăng hạng Giai đoạn
              (Stage).
            </p>
          </div>
        </PortalTooltip>
      )}

      {showFlirtTooltip && (
        <PortalTooltip
          active={showFlirtTooltip}
          anchorRef={flirtRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Độ quấn quýt (Flirt Level):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Mức độ thân mật/thả thính cho phép AI Agent sử dụng khi sinh phản
              hồi. Các mức dao động từ Level 0 (không thả thính, nghiêm túc) đến
              Level 3 (quấn quýt mạnh).
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}

type ChatStatisticsSectionProps = {
  profile: any;
};

function ChatStatisticsSection({ profile }: ChatStatisticsSectionProps) {
  if (!profile) return null;
  const calendarRef = React.useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Định dạng ngày: DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "--/--";
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return "--/--";
    }
  };

  return (
    <div className="text-base-content/50 space-y-1.5 select-none">
      <span
        ref={calendarRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none cursor-help"
      >
        <Calendar size={14} /> Đã tương tác:{" "}
        <strong className="text-base-content/70">
          {profile.dayCount} ngày
        </strong>
      </span>
      <span className="text-sm text-base-content/60 hover:text-base-content flex items-center gap-1.5 select-none">
        <MessageCircle size={14} /> Tổng tin nhắn:{" "}
        <strong className="text-base-content/70">
          {profile.messageCount} tin
        </strong>
      </span>

      {showTooltip && profile.firstInteractedAt && (
        <PortalTooltip
          active={showTooltip}
          anchorRef={calendarRef}
          position="top"
          align="center"
          showArrow
          className="w-56"
        >
          <div className="text-xs text-base-content leading-normal font-medium text-center">
            Đã tương tác từ ngày {formatDate(profile.firstInteractedAt)}
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}

type RiskBannerSectionProps = {
  profile: any;
};

function RiskBannerSection({ profile }: RiskBannerSectionProps) {
  if (!profile || profile.riskLevel === "low") return null;
  const isHighRisk = profile.riskLevel === "high";

  return (
    <div
      className={cn(
        "flex gap-2.5 p-3 rounded-xl border text-[11px] leading-relaxed shadow-sm animate-pulse-red",
        isHighRisk
          ? "bg-error/10 text-error border-error/20"
          : "bg-warning/10 text-warning border-warning/20",
      )}
    >
      {isHighRisk ? (
        <ShieldAlert
          size={15}
          className="text-error shrink-0 mt-0.5 animate-pulse"
        />
      ) : (
        <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
      )}
      <div className="flex-1 flex flex-col gap-0.5">
        <p className="font-bold  tracking-wider text-3xs">
          Cảnh báo rủi ro: {isHighRisk ? "Rất cao (Escalate)" : "Trung bình"}
        </p>
        <p className="opacity-80 text-2xs">
          {isHighRisk
            ? "AI phát hiện hành vi bào tài nguyên cực đoan, từ khóa nhạy cảm nặng hoặc quấy rối nguy cấp. Hội thoại được tự động chuyển giao cho nhân viên trực chat can thiệp thủ công."
            : "Người dùng gửi liên kết nhiều lần hoặc có tín hiệu spam nhẹ. Cần thận trọng khi gửi thông tin."}
        </p>
      </div>
    </div>
  );
}

type InsightsAndObjectionsSectionProps = {
  profile: any;
  showInsights: boolean;
  setShowInsights: (show: boolean) => void;
  onJumpToMessage?: (id: string) => void;
  messages: any[];
};

function InsightsAndObjectionsSection({
  profile,
  showInsights,
  setShowInsights,
  onJumpToMessage,
  messages,
}: InsightsAndObjectionsSectionProps) {
  if (
    !profile ||
    (profile.keyInsights.length === 0 && profile.objectionsSeen.length === 0)
  )
    return null;
  const totalItems = profile.keyInsights.length + profile.objectionsSeen.length;

  const headerRef = React.useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative">
      <button
        ref={headerRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowInsights(!showInsights)}
        className="font-semibold text-sm text-base-content/70 hover:text-base-content transition-colors select-none flex items-center justify-between w-full"
      >
        <span className="tracking-wider flex items-center gap-1.5">
          <Info size={14} /> Nhận định sâu ({totalItems})
        </span>
        {showInsights ? <ChevronUp size={14} /> : <ChevronDown size={12} />}
      </button>

      {showInsights && (
        <div className="flex flex-col gap-3 mt-2 animate-fade-in">
          {profile.keyInsights.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm  text-secondary">
                Insight thu thập được:
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.keyInsights.map((insight: string, idx: number) => (
                  <InsightBadge key={idx} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {profile.objectionsSeen.length > 0 && (
            <div className="flex flex-col gap-2 mt-1 border-t border-base-content/5 pt-2">
              <span className="text-sm text-error">
                Từ chối / Rào cản đã gặp:
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.objectionsSeen.map(
                  (objection: string, idx: number) => (
                    <ObjectionBadge
                      key={idx}
                      objection={objection}
                      onJumpToMessage={onJumpToMessage}
                      messages={messages}
                      messageCount={profile.messageCount}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showTooltip && (
        <PortalTooltip
          active={showTooltip}
          anchorRef={headerRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm text-primary">
              Nhận định sâu & Rào cản:
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Các chi tiết đắt giá thu thập được về sở thích/thông tin cá nhân
              (Insight) cùng với các phản đối mua hàng của khách đã ghi nhận
              (Rào cản).
            </p>
          </div>
        </PortalTooltip>
      )}
    </div>
  );
}

/**
 * Component hiển thị Badge Insight kèm Tooltip chi tiết
 */
function InsightBadge({ insight }: { insight: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [active, setActive] = React.useState(false);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        className="badge badge-secondary badge-soft text-sm font-medium leading-relaxed animate-fade-in cursor-help select-none"
      >
        • {insight}
      </span>
      {active && (
        <PortalTooltip
          active={active}
          anchorRef={ref}
          position="top"
          align="center"
          showArrow
          className="w-64 text-xs font-normal"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="font-bold text-secondary text-sm">
              Nhận định sâu (Insight):
            </span>
            <p className="text-xs text-base-content/85 leading-normal">
              Thông tin thực tế ("{insight}") được AI tự động phân tích và trích
              xuất từ lịch sử trò chuyện nhằm cá nhân hóa câu trả lời.
            </p>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}

/**
 * Định nghĩa chi tiết các rào cản mua hàng (Objections) phổ biến theo Playbook 2.0
 */
const OBJECTION_DETAILS: Record<string, { label: string; reason: string }> = {
  too_expensive: {
    label: "Chê đắt / Giá cao",
    reason: "Khách hàng không có đủ khả năng tài chính hiện tại.",
  },
  not_trusted: {
    label: "Chưa tin tưởng",
    reason: "Khách hàng lo ngại tài khoản giả mạo hoặc lừa đảo.",
  },
  too_busy: {
    label: "Bận rộn / Hẹn sau",
    reason: "Khách hàng trì hoãn phản hồi.",
  },
  privacy_concern: {
    label: "Lo ngại bảo mật",
    reason:
      "Khách hàng lo sợ bị rò rỉ hình ảnh, video riêng tư hoặc thông tin cá nhân ra ngoài.",
  },
  want_free: {
    label: "Đòi xem miễn phí",
    reason:
      "Khách hàng yêu cầu gửi hình ảnh, video xem thử miễn phí trước khi quyết định chi tiền.",
  },
  asking_price: {
    label: "Hỏi giá trực tiếp",
    reason:
      "Khách hàng chủ động hỏi thăm chi phí hoặc các gói dịch vụ đặc quyền.",
  },
  other: {
    label: "Từ chối khác",
    reason:
      "Khách hàng đưa ra các lý do từ chối hoặc rào cản khác ngoài các danh mục phổ biến.",
  },
};

/**
 * Các biểu thức chính quy (Regex) dùng để quét nhanh tin nhắn của fan
 */
const OBJECTION_REGEXES: Record<string, RegExp> = {
  want_free:
    /(free|miễn phí|cho xin|xin ảnh|gửi ảnh|cho xem|xin video|gửi video|coi free|xin hình|gửi hình|coi thử|xem thử|leak)/i,
  too_expensive:
    /((đắt|mắc|cao|phí) quá|không có tiền|hết tiền|giá chát|đắt thế|bớt không|giảm giá|sale)/i,
  not_trusted:
    /((chưa|không) tin|ảo|lừa|lừa đảo|thật không|có thật không|tin được không|uy tín|thật hay giả)/i,
  privacy_concern:
    /(sợ lộ|bảo mật|an toàn hông|an toàn không|lộ ảnh|lộ hình|lộ video|kín đáo|riêng tư không|bị lộ)/i,
  too_busy:
    /((đang|anh) bận|lúc khác|khi khác|sau nha|sau nhen|tí nữa|mai nha|bận quá|bận rồi)/i,
  asking_price:
    /(bao nhiêu|nhiêu|giá sao|giá gói|giá cả|nhiêu tiền|gói nào|xin giá|hỏi giá)/i,
};

/**
 * Component hiển thị Badge Objection kèm Tooltip chi tiết
 */
function ObjectionBadge({
  objection,
  onJumpToMessage,
  messages,
  messageCount,
}: {
  objection: string;
  onJumpToMessage?: (id: string) => void;
  messages: any[];
  messageCount: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [active, setActive] = React.useState(false);
  const [matchIndex, setMatchIndex] = React.useState(0);

  const detail = OBJECTION_DETAILS[objection] || {
    label: objection,
    reason:
      "Rào cản / phản đối của khách hàng được phát hiện trong quá trình tương tác.",
  };

  // So khớp tất cả regex trên danh sách tin nhắn của khách hàng (sắp xếp từ cũ nhất đến mới nhất)
  const regex = OBJECTION_REGEXES[objection];
  const matchingMessages =
    regex && messages && messages.length > 0
      ? messages
          .filter((m) => m.senderType === "user")
          .filter((m) => regex.test(m.content))
          .reverse() // Đảo từ cũ nhất đến mới nhất theo trình tự thời gian
      : [];

  const hasMatches = matchingMessages.length > 0;
  const currentMatch = hasMatches ? matchingMessages[matchIndex] : null;

  const handleBadgeClick = () => {
    if (hasMatches && onJumpToMessage && currentMatch) {
      onJumpToMessage(currentMatch.id);
      // Chuyển sang tin nhắn khớp tiếp theo cho lượt nhấp tiếp theo
      setMatchIndex((prev) => (prev + 1) % matchingMessages.length);
    }
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onClick={handleBadgeClick}
        className={cn(
          "badge badge-error badge-soft text-sm font-medium leading-relaxed animate-fade-in select-none",
          hasMatches ? "cursor-pointer hover:bg-error/20" : "cursor-help",
        )}
      >
        ✗ {detail.label}{" "}
        {matchingMessages.length > 1 && `(${matchingMessages.length})`}
      </span>
      {active && (
        <PortalTooltip
          active={active}
          anchorRef={ref}
          position="top"
          align="center"
          showArrow
          className="w-80 text-xs font-normal"
        >
          <div className="flex flex-col gap-1.5 text-base-content max-w-full">
            <p className="text-xs text-base-content/85 leading-normal">
              <strong>{detail.label}</strong>: {detail.reason}
            </p>

            <div className="mt-1 border-t border-base-content/5 pt-1.5 flex flex-col gap-1.5">
              {hasMatches ? (
                <>
                  <div className="flex justify-between items-center text-xs text-base-content/50 select-none">
                    <span>
                      Nhận diện tức thì ({matchingMessages.length} tin):
                    </span>
                    {matchingMessages.length > 1 && (
                      <span className="text-primary normal-case font-semibold">
                        Lượt nhấp tiếp theo: #{matchIndex + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {matchingMessages.map((msg) => {
                      return <div key={msg.id} className="italic">"{msg.content}"</div>;
                    })}
                  </div>
                  {matchingMessages.length > 1 && (
                    <p className="text-sm text-base-content/40 italic mt-0.5 text-center select-none">
                      * Nhấp liên tục vào Badge màu đỏ để tự động chuyển tiếp
                      qua các tin nhắn.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <span className="text-sm text-base-content/50 uppercase font-bold tracking-wide select-none">
                    Phân tích sâu AI/LLM:
                  </span>
                  <div className="text-[11px] text-base-content/70">
                    AI phân tích và tóm tắt dựa trên {messageCount} tin nhắn.
                  </div>
                </>
              )}
            </div>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}
