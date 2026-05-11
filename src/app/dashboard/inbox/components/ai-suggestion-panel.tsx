'use client';

import React, { useState } from 'react';
import type { AiSuggestion } from '@/domain/types/messaging';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Info, 
  X, 
  Loader2, 
  Sparkles, 
  Heart, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  User,
  Activity,
  Award,
  Compass,
  Smile
} from 'lucide-react';

type Props = {
  suggestions: AiSuggestion[];
  loading: boolean;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
  fanProfile?: any;
  gender?: string | null;
  onUpdateGender?: (gender: string | null) => void;
};

function formatModel(model: string): string {
  if (model.includes('llama-3.3-70b')) return 'LLaMA 3.3 70B';
  if (model.includes('llama-3.1-8b')) return 'LLaMA 3.1 8B';
  if (model.includes('qwen-qwq-32b')) return 'Qwen3 32B';
  if (model.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
  return model;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function SuggestionCard({ suggestion, onUse, onDismiss }: {
  suggestion: AiSuggestion;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-foreground/[0.05] hover:border-foreground/10 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-accent-primary">
          <Zap size={12} fill="currentColor" />
          <span className="text-sm font-bold select-none tracking-wider">
            {formatModel(suggestion.model)}
          </span>
        </div>
        <span className="text-xs text-foreground-tertiary flex items-center gap-1">
          {timeAgo(suggestion.createdAt)}
        </span>
      </div>

      <p className="text-sm text-foreground-secondary leading-relaxed m-0 italic">
        "{suggestion.response}"
      </p>

      <div className="flex items-center gap-2 mt-1">
        <button
          className="flex-1 bg-accent-primary text-foreground p-1.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
          onClick={() => onUse(suggestion.response)}
        >
          Sử dụng
        </button>
        <button
          className="w-9 h-9 flex items-center justify-center bg-foreground/5 border border-foreground/10 rounded-lg text-foreground-tertiary transition-all hover:bg-foreground/10 hover:text-foreground"
          onClick={() => onDismiss(suggestion.id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function AiSuggestionPanel({ 
  suggestions, 
  loading, 
  onUse, 
  onDismiss,
  fanProfile,
  gender,
  onUpdateGender
}: Props) {
  const visible = suggestions.slice(0, 5);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Chuẩn hóa trường dữ liệu của fanProfile tương tự bên AiProfileViewer để tránh lỗi crash
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

  // Cấu hình style và hiển thị của Fan Type
  const getFanTypeConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'luy':
        return {
          label: 'Lụy (Emotional)',
          style: 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]',
          desc: 'Thân thiện, nhiều cảm xúc, nhắn tin dài, dùng nhiều emoji. Cần xoa dịu bằng cảm xúc (Emotional Banking).',
        };
      case 'cool':
        return {
          label: 'Lạnh lùng (Cool)',
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]',
          desc: 'Trả lời ngắn (1-3 từ), ít emoji, ít hỏi han. Áp dụng kỹ thuật Tease & Withdraw.',
        };
      case 'whale':
        return {
          label: 'VIP (Whale)',
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] font-black',
          desc: 'Hỏi thẳng giá, dịch vụ cao cấp, chốt nhanh. Ưu tiên gửi liên kết chốt đơn ngay lập tức.',
        };
      case 'drainer':
        return {
          label: 'Bào sức (Drainer)',
          style: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
          desc: 'Đòi nội dung/ảnh miễn phí, né tránh mua hàng. Giới hạn tương tác, rút lui lịch sự.',
        };
      default:
        return {
          label: 'Chưa rõ (Unknown)',
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          desc: 'Đang thu thập và phân tích lịch sử trò chuyện để phân loại Fan.',
        };
    }
  };

  // Cấu hình style của Stage (State Manager)
  const getStageConfig = (stage: string) => {
    switch (stage.toUpperCase()) {
      case 'G1':
        return { label: 'G1 - Kết nối', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', target: 'Xây dựng lòng tin (Build Trust)' };
      case 'G2':
        return { label: 'G2 - Làm ấm', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20', target: 'Khơi gợi nhu cầu (Warm-up)' };
      case 'G3':
        return { label: 'G3 - Gửi Link', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20', target: 'Chốt đơn/Bán hàng (Upsell)' };
      default:
        return { label: stage, style: 'bg-slate-500/10 text-slate-400 border-slate-500/20', target: 'Không xác định' };
    }
  };

  // Cấu hình hành động khuyên dùng
  const getNextActionConfig = (action: string) => {
    switch (action.toLowerCase()) {
      case 'continue':
        return { label: 'Tiếp tục trò chuyện tự nhiên', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 border' };
      case 'send_link':
        return { label: 'Gửi liên kết chốt đơn', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold border animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.1)]' };
      case 'soft_exit':
        return { label: 'Giãn cách, rút lui lịch sự', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 border' };
      case 'escalate_to_human':
        return { label: 'Chuyển giao cho Nhân viên xử lý', color: 'text-red-400 bg-red-500/15 border-red-500/30 font-bold border shadow-[0_0_12px_rgba(239,68,68,0.1)]' };
      case 'wait':
        return { label: 'Đợi khách hàng phản hồi', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20 border' };
      default:
        return { label: action, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20 border' };
    }
  };



  const fanConfig = profile ? getFanTypeConfig(profile.fanType) : null;
  const stageConfig = profile ? getStageConfig(profile.stage) : null;
  const actionConfig = profile ? getNextActionConfig(profile.nextAction) : null;

  return (
    <div className="flex flex-col bg-base-200 text-foreground select-none">
      
      {/* ================= SECTION 1: AI SMART PROFILE ================= */}
      <div className="p-4 border-b border-foreground/5 bg-foreground/[0.01] flex flex-col gap-4 relative">
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
            
            {/* 1. Kiểu tính cách (Fan Type) - Thiết kế hàng ngang 100% cực kỳ thoáng đãng */}
            <div className="flex flex-col gap-2 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
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
                  <div className={cn("text-xs font-black px-3 py-1.5 rounded-lg border text-center font-mono", fanConfig.style)}>
                    {fanConfig.label}
                  </div>
                  <p className="text-[11px] text-foreground-secondary leading-relaxed bg-foreground/[0.01] p-2 rounded-md border border-foreground/[0.03] italic">
                    <strong className="text-foreground-secondary not-italic font-bold">Đặc trưng:</strong> {fanConfig.desc}
                  </p>
                </div>
              ) : (
                <div className="text-xs font-bold text-foreground-tertiary px-3 py-2 rounded-lg border border-foreground/5 bg-foreground/[0.01] text-center">
                  Đang thu thập và phân tích dữ liệu...
                </div>
              )}
            </div>

            {/* 2. Trạng thái xưng hô & Giai đoạn hội thoại */}
            <div className="grid grid-cols-2 gap-3">
              {/* Gender Card (Xưng hô hội thoại) */}
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
                  onChange={(e) => onUpdateGender?.(e.target.value === 'Chưa rõ' ? null : e.target.value)}
                >
                  <option value="Chưa rõ">Chưa xác định ⚦</option>
                  <option value="Nam">Nam ♂ (Anh)</option>
                  <option value="Nữ">Nữ ♀ (Chị)</option>
                </select>
              </div>

              {/* Stage (State Manager) */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
                  <Activity size={11} /> Giai đoạn (Stage)
                </span>
                {profile && stageConfig ? (
                  <div 
                    className={cn("text-2xs font-black px-2 py-1.5 rounded-lg border text-center truncate", stageConfig.style)}
                    title={`Mục tiêu: ${stageConfig.target}`}
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

            {/* Stage Goal Description */}
            {profile && stageConfig && (
              <p className="text-[10px] text-foreground-tertiary leading-relaxed px-2.5 py-1.5 rounded-lg bg-foreground/[0.01] border border-foreground/[0.02] -mt-1.5">
                🎯 <strong className="text-foreground-secondary">Mục tiêu Stage:</strong> {stageConfig.target}
              </p>
            )}

            {/* 3. Hành động khuyên dùng (Decision Engine) - Thiết kế nổi bật hàng ngang */}
            <div className="flex flex-col gap-2 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl hover:bg-foreground/[0.04] transition-all">
              <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
                <Compass size={11} /> Hành động khuyên dùng (Next Action)
              </span>
              {profile && actionConfig ? (
                <div className={cn("text-xs font-black px-3 py-2 rounded-lg flex items-center justify-between", actionConfig.color)}>
                  <span>{actionConfig.label}</span>
                  <Zap size={13} className="shrink-0 animate-bounce" fill="currentColor" />
                </div>
              ) : (
                <div className="text-xs font-bold text-foreground-tertiary px-3 py-2 rounded-lg border border-foreground/5 bg-foreground/[0.01] text-center">
                  Tiếp tục trò chuyện tự nhiên
                </div>
              )}
            </div>

            {/* 4. Chỉ số cảm xúc (Emotion & Flirt Scorer) */}
            {profile && (
              <div className="flex flex-col gap-3 bg-foreground/[0.01] border border-foreground/5 p-3 rounded-xl hover:bg-foreground/[0.02] transition-all">
                {/* Emotion Score Progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Smile size={11} /> Độ thiện cảm (Emotion)
                      {profile.emotionTrend === 'increasing' && <TrendingUp size={11} className="text-emerald-400" />}
                      {profile.emotionTrend === 'decreasing' && <TrendingDown size={11} className="text-rose-400" />}
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

                {/* Flirt Level Indicator */}
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
            )}

            {/* 5. Thống kê lịch sử chat */}
            {profile && (
              <div className="flex justify-between text-[10px] text-foreground-tertiary px-1 border-t border-foreground/5 pt-2">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Đã tương tác: <strong className="text-foreground-secondary">{profile.dayCount} ngày</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={11} /> Tổng tin nhắn: <strong className="text-foreground-secondary">{profile.messageCount} tin</strong>
                </span>
              </div>
            )}

            {/* 6. High Risk Short-Circuit Banner */}
            {profile && profile.riskLevel !== 'low' && (
              <div className={cn(
                "flex gap-2.5 p-3 rounded-xl border text-[11px] leading-relaxed shadow-sm",
                profile.riskLevel === 'high' 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {profile.riskLevel === 'high' ? (
                  <ShieldAlert size={15} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 flex flex-col gap-0.5">
                  <p className="font-bold uppercase tracking-wider text-[9px]">
                    Cảnh báo rủi ro: {profile.riskLevel === 'high' ? 'Rất cao (Escalate)' : 'Trung bình'}
                  </p>
                  <p className="opacity-80 text-[10px]">
                    {profile.riskLevel === 'high' 
                      ? 'AI phát hiện hành vi bào tài nguyên cực đoan, từ khóa nhạy cảm nặng hoặc quấy rối nguy cấp. Hội thoại được tự động chuyển giao cho nhân viên trực chat can thiệp thủ công.' 
                      : 'Người dùng gửi liên kết nhiều lần hoặc có tín hiệu spam nhẹ. Cần thận trọng khi gửi thông tin.'}
                  </p>
                </div>
              </div>
            )}

            {/* 7. Nhận định sâu & Từ chối (Insights & Objections) - Hiển thị trực tiếp cực kỳ đẹp */}
            {profile && (profile.keyInsights.length > 0 || profile.objectionsSeen.length > 0) && (
              <div className="border-t border-foreground/5 pt-2">
                <button 
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex justify-between items-center w-full py-1 text-[10px] font-bold text-foreground-tertiary hover:text-foreground transition-colors"
                >
                  <span className="uppercase tracking-wider">Nhận định sâu & Rào cản ({profile.keyInsights.length + profile.objectionsSeen.length})</span>
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
            )}

          </div>
        )}
      </div>



      {/* ================= SECTION 3: AI SUGGESTIONS ================= */}
      <div className="px-4 py-2 flex items-center gap-2.5">
        <div className="p-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
          <Zap size={14} className="animate-pulse" />
        </div>
        <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-wider">Gợi ý phản hồi AI</h4>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                <div className="h-3 bg-foreground/5 rounded w-1/3" />
                <div className="h-4 bg-foreground/5 rounded w-full" />
                <div className="h-4 bg-foreground/5 rounded w-4/5" />
              </div>
            ))}
            <div className="flex items-center justify-center py-5 text-foreground-tertiary text-sm gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Đang tạo phản hồi...</span>
            </div>
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-foreground-tertiary gap-3">
            <Info size={24} />
            <p className="text-sm italic">Chưa có gợi ý nào</p>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="flex flex-col gap-4">
            {visible.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onUse={onUse}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
