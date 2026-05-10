'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiProfileViewerProps {
  fanProfile?: any;
}

export function AiProfileViewer({ fanProfile }: AiProfileViewerProps) {
  const [showInsights, setShowInsights] = useState(false);

  // Normalize fields between snake_case and camelCase to prevent crash
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
    notes: fanProfile.notes ?? null,
    keyInsights: fanProfile.key_insights ?? fanProfile.keyInsights ?? [],
    objectionsSeen: fanProfile.objections_seen ?? fanProfile.objectionsSeen ?? [],
  } : null;

  if (!profile) {
    return (
      <div className="p-4 bg-foreground/[0.02] border border-foreground/5 rounded-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Sparkles size={16} className="text-violet-400 animate-pulse" />
          <h4 className="text-sm font-bold">Hồ sơ AI DM Agent</h4>
        </div>
        <p className="text-xs text-foreground-tertiary leading-normal">
          Chưa có hồ sơ AI cho cuộc hội thoại này. AI Agent sẽ tự động phân loại fan_type, stage và tính điểm thiện cảm sau khi nhận được 3-4 tin nhắn đầu tiên từ khách hàng.
        </p>
      </div>
    );
  }

  // Define Fan Type styles & descriptions
  const getFanTypeConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'luy':
        return {
          label: 'Lụy (Emotional)',
          style: 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]',
          desc: 'Thân thiện, nhiều cảm xúc, nhắn tin dài, dùng nhiều emoji. Cần Emotional Banking nhiều.',
        };
      case 'cool':
        return {
          label: 'Lạnh lùng (Cool)',
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]',
          desc: 'Trả lời ngắn (1-3 từ), ít emoji, ít hỏi han. Áp dụng chiến thuật Tease & Withdraw.',
        };
      case 'whale':
        return {
          label: 'VIP (Whale)',
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] font-bold',
          desc: 'Hỏi thẳng giá, dịch vụ cao cấp, chốt nhanh. Ưu tiên gửi link chốt đơn ngay.',
        };
      case 'drainer':
        return {
          label: 'Bào sức (Drainer)',
          style: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
          desc: 'Đòi ảnh/nội dung miễn phí nhiều lần, né mua. Giới hạn tương tác, rút lui nhanh.',
        };
      default:
        return {
          label: 'Chưa rõ (Unknown)',
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          desc: 'Chưa đủ dữ liệu để phân loại tính cách khách hàng.',
        };
    }
  };

  // Define Stage styles & descriptions
  const getStageConfig = (stage: string) => {
    switch (stage.toUpperCase()) {
      case 'G1':
        return {
          label: 'G1 - Gắn kết',
          target: 'Xây dựng lòng tin (Build Trust)',
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'G2':
        return {
          label: 'G2 - Làm ấm',
          target: 'Khơi gợi nhu cầu (Warm-up)',
          style: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        };
      case 'G3':
        return {
          label: 'G3 - Chốt đơn',
          target: 'Bán hàng/Upsell (Upsell)',
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      default:
        return {
          label: stage,
          target: 'Không xác định',
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  // Define Next Action labels
  const getNextActionConfig = (action: string) => {
    switch (action.toLowerCase()) {
      case 'continue':
        return { label: 'Tiếp tục trò chuyện tự nhiên', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
      case 'send_link':
        return { label: 'Gửi liên kết chốt đơn', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 font-bold animate-pulse' };
      case 'soft_exit':
        return { label: 'Giãn cách, kết thúc lịch sự', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'hard_exit':
        return { label: 'Dừng hội thoại ngay lập tức', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'escalate_to_human':
        return { label: 'Chuyển nhân viên trực chat xử lý', color: 'text-red-400 bg-red-500/10 border-red-500/20 font-bold' };
      case 'wait':
        return { label: 'Đợi khách hàng phản hồi', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
      default:
        return { label: action, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const fanConfig = getFanTypeConfig(profile.fanType);
  const stageConfig = getStageConfig(profile.stage);
  const actionConfig = getNextActionConfig(profile.nextAction);

  return (
    <div className="p-4 bg-background-secondary/60 border border-foreground/5 rounded-2xl flex flex-col gap-5 transition-all duration-300 hover:border-violet-500/20 shadow-sm relative overflow-hidden group">
      {/* Decorative top ambient glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent blur-xs group-hover:via-violet-500/50" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Hồ sơ phân tích AI</h4>
            <p className="text-3xs text-foreground-tertiary">Cập nhật thời gian thực</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">AGENT ACTIVE</span>
        </div>
      </div>

      {/* Grid: Fan Type & Stage */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fan Type Card */}
        <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-colors">
          <span className="text-3xs font-semibold text-foreground-tertiary">Kiểu tính cách</span>
          <div className={cn("text-2xs font-semibold px-2 py-1 rounded-md border text-center truncate", fanConfig.style)}>
            {fanConfig.label} {profile.fanTypeConfidence > 0 && `(${Math.round(profile.fanTypeConfidence * 100)}%)`}
          </div>
        </div>

        {/* Stage Card */}
        <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-colors">
          <span className="text-3xs font-semibold text-foreground-tertiary">Giai đoạn hội thoại</span>
          <div className={cn("text-2xs font-semibold px-2 py-1 rounded-md border text-center truncate", stageConfig.style)}>
            {stageConfig.label}
          </div>
        </div>
      </div>

      {/* Fan Type description */}
      <p className="text-3xs text-foreground-tertiary leading-relaxed bg-foreground/[0.01] p-2 rounded-lg border border-foreground/[0.03]">
        <strong className="text-foreground-secondary">Đặc trưng:</strong> {fanConfig.desc}
      </p>

      {/* Emotion & Flirt Section */}
      <div className="flex flex-col gap-3 bg-foreground/[0.01] border border-foreground/5 p-3 rounded-xl">
        {/* Slider: Emotion Score */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-2xs font-bold text-foreground-secondary flex items-center gap-1">
              Độ thân thiện (Cảm xúc)
              {profile.emotionTrend === 'increasing' && <TrendingUp size={12} className="text-emerald-400" />}
              {profile.emotionTrend === 'decreasing' && <TrendingDown size={12} className="text-rose-400" />}
            </span>
            <span className="text-2xs font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded">
              {Math.round(profile.emotionScore * 100)}%
            </span>
          </div>
          
          <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${profile.emotionScore * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-3xs text-foreground-tertiary">
            <span>Lạnh nhạt (0%)</span>
            <span>Nồng nhiệt (100%)</span>
          </div>
        </div>

        {/* Flirt Level */}
        <div className="flex justify-between items-center pt-1 border-t border-foreground/5">
          <span className="text-2xs font-bold text-foreground-secondary flex items-center gap-1">
            Độ quấn quýt (Thính)
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map((val) => (
              <Heart 
                key={val} 
                size={14} 
                className={cn(
                  "transition-all duration-300",
                  val <= profile.flirtLevel 
                    ? "fill-pink-500 text-pink-500 scale-110 drop-shadow-[0_0_4px_rgba(236,72,153,0.4)]" 
                    : "text-foreground-tertiary opacity-40"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Risk Alert Indicator if Medium/High */}
      {profile.riskLevel !== 'low' && (
        <div className={cn(
          "flex gap-2.5 p-3 rounded-xl border text-xs leading-normal",
          profile.riskLevel === 'high' 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
          {profile.riskLevel === 'high' ? (
            <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 flex flex-col gap-0.5">
            <span className="font-bold uppercase tracking-wider text-2xs">
              Cảnh báo rủi ro: {profile.riskLevel === 'high' ? 'Rất cao' : 'Trung bình'}
            </span>
            <span className="text-3xs text-foreground-tertiary opacity-90 leading-relaxed">
              {profile.riskLevel === 'high' 
                ? 'Khách hàng có hành vi tiêu cực, bào tài nguyên nặng, hoặc vi phạm từ khóa an toàn. Khuyến nghị HUMAN tiếp quản ngay.' 
                : 'Khách hàng spam liên tục hoặc có tín hiệu quấy rối nhẹ. Cẩn trọng khi phản hồi.'}
            </span>
          </div>
        </div>
      )}

      {/* Next Recommended Action */}
      <div className="flex flex-col gap-2 p-3 bg-foreground/[0.01] border border-foreground/5 rounded-xl">
        <span className="text-3xs font-semibold text-foreground-tertiary uppercase tracking-wider">Hành động khuyên dùng</span>
        <div className={cn("text-2xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center justify-between", actionConfig.color)}>
          <span>{actionConfig.label}</span>
          <Zap size={12} className="shrink-0" />
        </div>
      </div>

      {/* Stats and Collapsible Key Insights */}
      <div className="border-t border-foreground/5 pt-3">
        {/* Day & Message Count Stats */}
        <div className="flex justify-between text-3xs text-foreground-tertiary mb-2 px-1">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> Đã chat: {profile.dayCount} ngày
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} /> Tổng số tin: {profile.messageCount}
          </span>
        </div>

        {/* Key Insights accordion */}
        {(profile.keyInsights.length > 0 || profile.objectionsSeen.length > 0) && (
          <div className="mt-2">
            <button 
              className="flex justify-between items-center w-full py-1 text-2xs font-bold text-foreground-tertiary hover:text-foreground transition-colors"
              onClick={() => setShowInsights(!showInsights)}
            >
              <span>XEM NHẬN ĐỊNH SÂU ({profile.keyInsights.length + profile.objectionsSeen.length})</span>
              {showInsights ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            
            {showInsights && (
              <div className="flex flex-col gap-2.5 mt-2 p-2 bg-foreground/[0.02] border border-foreground/5 rounded-lg">
                {profile.keyInsights.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-3xs text-foreground-tertiary font-bold">Insight thu thập:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.keyInsights.map((insight: string, idx: number) => (
                        <span key={idx} className="text-3xs px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded">
                          {insight}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.objectionsSeen.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-3xs text-rose-400 font-bold">Rào cản/Từ chối đã gặp:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.objectionsSeen.map((objection: string, idx: number) => (
                        <span key={idx} className="text-3xs px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                          {objection}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
