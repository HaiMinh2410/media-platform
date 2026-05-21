/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Users,
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
  MessageSquare
} from 'lucide-react';
import {
  getFanPersonalityConfiguration,
  getConversationStageConfiguration,
  getNextActionConfiguration
} from './panel-constants';

type AiProfileViewerProps = {
  fanProfile: any;
  gender: string | null;
  onUpdateGender: (gender: string | null) => void;
};

export function AiProfileViewer({
  fanProfile,
  gender,
  onUpdateGender
}: AiProfileViewerProps) {
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Chuẩn hóa dữ liệu hồ sơ fan
  const profile = fanProfile ? {
    fanType: fanProfile.fan_type || fanProfile.fanType || 'Unknown',
    fanTypeConfidence: fanProfile.fan_type_confidence ?? fanProfile.fanTypeConfidence ?? 0,
    stage: fanProfile.stage || 'G1',
    dayCount: fanProfile.day_count ?? fanProfile.dayCount ?? 0,
    messageCount: fanProfile.message_count ?? fanProfile.messageCount ?? 0,
    emotionScore: fanProfile.emotion_score ?? fanProfile.emotionScore ?? 0.5,
    emotionTrend: fanProfile.emotion_trend ?? fanProfile.emotionTrend ?? 'stable',
    flirtLevel: fanProfile.flirt_level ?? fanProfile.flirtLevel ?? 0,
    riskLevel: fanProfile.risk_level ?? fanProfile.riskLevel ?? 'low',
    nextAction: fanProfile.next_action ?? fanProfile.nextAction ?? 'continue',
    keyInsights: fanProfile.key_insights ?? fanProfile.keyInsights ?? [],
    objectionsSeen: fanProfile.objections_seen ?? fanProfile.objectionsSeen ?? [],
  } : null;

  const fanConfig = profile ? getFanPersonalityConfiguration(profile.fanType) : null;
  const stageConfig = profile ? getConversationStageConfiguration(profile.stage) : null;
  const actionConfig = profile ? getNextActionConfiguration(profile.nextAction) : null;

  return (
    <div className="p-4 border-b border-foreground/5 bg-foreground/1 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">Hồ sơ phân tích AI</h4>
            <p className="text-[10px] text-foreground-tertiary">Báo cáo cập nhật thời gian thực</p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          className="p-1 rounded bg-foreground/5 hover:bg-foreground/10 text-foreground-secondary transition-all"
          title={isProfileExpanded ? "Thu gọn" : "Mở rộng"}
        >
          {isProfileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isProfileExpanded && (
        <div className="flex flex-col gap-4 mt-1">
          {/* 1. Kiểu tính cách (Fan Type) */}
          {renderFanPersonalitySection(profile, fanConfig)}

          {/* 2. Trạng thái xưng hô & Giai đoạn hội thoại */}
          {renderXungHoAndStageSection(gender, onUpdateGender, profile, stageConfig)}

          {/* 3. Hành động khuyên dùng (Next Action) */}
          {renderNextActionSection(profile, actionConfig)}

          {/* 4. Chỉ số cảm xúc (Emotion & Flirt Scorer) */}
          {renderEmotionAndFlirtSection(profile)}

          {/* 5. Thống kê lịch sử chat */}
          {renderChatStatisticsSection(profile)}

          {/* 6. High Risk Short-Circuit Banner */}
          {renderRiskBannerSection(profile)}

          {/* 7. Nhận định sâu & Từ chối (Insights & Objections) */}
          {renderInsightsAndObjectionsSection(profile, showInsights, setShowInsights)}
        </div>
      )}
    </div>
  );
}

/**
 * Các hàm kết xuất phụ trợ (Helper Render Functions) tuân thủ quy tắc Hàm Ngắn
 */

function renderFanPersonalitySection(profile: any, fanConfig: any) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-foreground/2 border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
          <Users size={11} /> Kiểu tính cách (Fan Type)
        </span>
        {profile && profile.fanTypeConfidence > 0 && (
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded">
            Mức độ tin cậy: {Math.round(profile.fanTypeConfidence * 100)}%
          </span>
        )}
      </div>
      {profile && fanConfig ? (
        <div className="flex flex-col gap-2">
          <div className={cn("text-xs font-black px-3 py-1.5 rounded-lg border text-center font-mono", fanConfig.styleClass)}>
            {fanConfig.label}
          </div>
          <p className="text-[11px] text-foreground-secondary leading-relaxed bg-foreground/1 p-2 rounded-md border border-foreground/3 italic">
            <strong className="text-foreground-secondary not-italic font-bold">Đặc trưng:</strong> {fanConfig.description}
          </p>
        </div>
      ) : (
        <div className="text-xs font-bold text-foreground-tertiary px-3 py-2 rounded-lg border border-foreground/5 bg-foreground/1 text-center">
          Đang thu thập và phân tích dữ liệu...
        </div>
      )}
    </div>
  );
}

function renderXungHoAndStageSection(
  gender: string | null,
  onUpdateGender: (gender: string | null) => void,
  profile: any,
  stageConfig: any
) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {/* Gender Card */}
        <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
          <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
            <User size={11} /> Xưng hô hội thoại
          </span>
          <select
            className={cn(
              "w-full text-2xs font-bold bg-background-secondary border border-foreground/10 rounded-lg p-1.5 outline-none transition-all focus:border-accent-primary cursor-pointer text-center",
              gender === 'Nam' && "text-blue-400 bg-blue-500/5 border-blue-500/20",
              gender === 'Nữ' && "text-pink-400 bg-pink-500/5 border-pink-500/20",
              (!gender || gender === 'Chưa rõ') && "text-slate-400 bg-slate-500/5 border-slate-500/20"
            )}
            value={gender || 'Chưa rõ'}
            onChange={(e) => onUpdateGender(e.target.value === 'Chưa rõ' ? null : e.target.value)}
          >
            <option value="Chưa rõ">Chưa xác định ⚦</option>
            <option value="Nam">Nam ♂ (Anh)</option>
            <option value="Nữ">Nữ ♀ (Chị)</option>
          </select>
        </div>

        {/* Stage Card */}
        <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
          <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
            <Activity size={11} /> Giai đoạn (Stage)
          </span>
          {profile && stageConfig ? (
            <div
              className={cn("text-2xs font-black px-2 py-1.5 rounded-lg border text-center truncate", stageConfig.styleClass)}
              title={`Mục tiêu: ${stageConfig.targetGoal}`}
            >
              {stageConfig.label}
            </div>
          ) : (
            <div className="text-2xs font-bold text-foreground-tertiary px-2 py-1.5 rounded-lg border border-foreground/5 bg-foreground/[0.01] text-center">
              G1 - Kết nối
            </div>
          )}
        </div>
      </div>

      {profile && stageConfig && (
        <p className="text-[10px] text-foreground-tertiary leading-relaxed px-2.5 py-1.5 rounded-lg bg-foreground/[0.01] border border-foreground/[0.02] -mt-1.5">
          🎯 <strong className="text-foreground-secondary">Mục tiêu Stage:</strong> {stageConfig.targetGoal}
        </p>
      )}
    </>
  );
}

function renderNextActionSection(profile: any, actionConfig: any) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
      <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
        <Compass size={11} /> Hành động khuyên dùng (Next Action)
      </span>
      {profile && actionConfig ? (
        <div className={cn("text-xs font-black px-3 py-2 rounded-lg flex items-center justify-between", actionConfig.styleClass)}>
          <span>{actionConfig.label}</span>
          <Compass size={13} className="shrink-0 animate-bounce" fill="currentColor" />
        </div>
      ) : (
        <div className="text-xs font-bold text-foreground-tertiary px-3 py-2 rounded-lg border border-foreground/5 bg-foreground/[0.01] text-center">
          Tiếp tục trò chuyện tự nhiên
        </div>
      )}
    </div>
  );
}

function renderEmotionAndFlirtSection(profile: any) {
  if (!profile) return null;
  const isEmotionIncreasing = profile.emotionTrend === 'increasing';
  const isEmotionDecreasing = profile.emotionTrend === 'decreasing';

  return (
    <div className="flex flex-col gap-3 bg-foreground/[0.01] border border-foreground/5 p-3 rounded-xl hover:bg-foreground/[0.02] transition-all">
      {/* Emotion Score */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Smile size={11} /> Độ thiện cảm (Emotion)
            {isEmotionIncreasing && <TrendingUp size={11} className="text-emerald-400" />}
            {isEmotionDecreasing && <TrendingDown size={11} className="text-rose-400" />}
          </span>
          <span className="text-2xs font-black text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded font-mono">
            {Math.round(profile.emotionScore * 100)}%
          </span>
        </div>

        <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden relative mt-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${profile.emotionScore * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-foreground-tertiary">
          <span>Lạnh nhạt (0%)</span>
          <span>Nồng nhiệt (100%)</span>
        </div>
      </div>

      {/* Flirt Level */}
      <div className="flex justify-between items-center pt-2 border-t border-foreground/5">
        <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-1">
          <Heart size={11} /> Độ quấn quýt (Thính)
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((val) => (
            <Heart
              key={val}
              size={13}
              className={cn(
                "transition-all duration-300",
                val <= profile.flirtLevel
                  ? "fill-pink-500 text-pink-500 scale-110 drop-shadow-[0_0_4px_rgba(236,72,153,0.4)]"
                  : "text-foreground-tertiary opacity-30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function renderChatStatisticsSection(profile: any) {
  if (!profile) return null;
  return (
    <div className="flex justify-between text-[10px] text-foreground-tertiary px-1 border-t border-foreground/5 pt-2">
      <span className="flex items-center gap-1">
        <Calendar size={11} /> Đã tương tác: <strong className="text-foreground-secondary">{profile.dayCount} ngày</strong>
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={11} /> Tổng tin nhắn: <strong className="text-foreground-secondary">{profile.messageCount} tin</strong>
      </span>
    </div>
  );
}

function renderRiskBannerSection(profile: any) {
  if (!profile || profile.riskLevel === 'low') return null;
  const isHighRisk = profile.riskLevel === 'high';

  return (
    <div className={cn(
      "flex gap-2.5 p-3 rounded-xl border text-[11px] leading-relaxed shadow-sm",
      isHighRisk
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      {isHighRisk ? (
        <ShieldAlert size={15} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
      ) : (
        <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 flex flex-col gap-0.5">
        <p className="font-bold uppercase tracking-wider text-[9px]">
          Cảnh báo rủi ro: {isHighRisk ? 'Rất cao (Escalate)' : 'Trung bình'}
        </p>
        <p className="opacity-80 text-[10px]">
          {isHighRisk
            ? 'AI phát hiện hành vi bào tài nguyên cực đoan, từ khóa nhạy cảm nặng hoặc quấy rối nguy cấp. Hội thoại được tự động chuyển giao cho nhân viên trực chat can thiệp thủ công.'
            : 'Người dùng gửi liên kết nhiều lần hoặc có tín hiệu spam nhẹ. Cần thận trọng khi gửi thông tin.'}
        </p>
      </div>
    </div>
  );
}

function renderInsightsAndObjectionsSection(
  profile: any,
  showInsights: boolean,
  setShowInsights: (show: boolean) => void
) {
  if (!profile || (profile.keyInsights.length === 0 && profile.objectionsSeen.length === 0)) return null;
  const totalItems = profile.keyInsights.length + profile.objectionsSeen.length;

  return (
    <div className="border-t border-foreground/5 pt-2">
      <button
        onClick={() => setShowInsights(!showInsights)}
        className="flex justify-between items-center w-full py-1 text-[10px] font-bold text-foreground-tertiary hover:text-foreground transition-colors"
      >
        <span className="uppercase tracking-wider">Nhận định sâu & Rào cản ({totalItems})</span>
        {showInsights ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showInsights && (
        <div className="flex flex-col gap-3 mt-2 p-2.5 bg-foreground/[0.01] border border-foreground/5 rounded-xl">
          {profile.keyInsights.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-violet-400 uppercase tracking-wider font-bold">Insight thu thập được:</span>
              <div className="flex flex-wrap gap-1">
                {profile.keyInsights.map((insight: string, idx: number) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md font-medium leading-relaxed">
                    • {insight}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {profile.objectionsSeen.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1 border-t border-foreground/5 pt-2">
              <span className="text-[9px] text-rose-400 uppercase tracking-wider font-bold">Từ chối / Rào cản đã gặp:</span>
              <div className="flex flex-wrap gap-1">
                {profile.objectionsSeen.map((objection: string, idx: number) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md font-medium leading-relaxed">
                    ✗ {objection}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
