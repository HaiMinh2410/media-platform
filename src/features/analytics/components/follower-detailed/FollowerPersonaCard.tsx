import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Compass,
  User,
  Globe,
  Clock,
  Target,
  Check,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useFollowerPersonal } from "./useFollowerPersonal";

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowerPersonaCardProps {
  followersCount: number;
  demographics: {
    age: DemographicItem[];
    city: DemographicItem[];
    country: DemographicItem[];
    gender: DemographicItem[];
  };
  activeTimes: Record<string, number[]> | null;
}

export function FollowerPersonaCard({
  followersCount,
  demographics,
  activeTimes,
}: FollowerPersonaCardProps) {
  const {
    genderLabel,
    genderPct,
    ageLabel,
    agePct,
    countryLabel,
    countryPct,
    behaviorLabel,
    insightText,
    personaHeadline,
    personaData,
    confidenceScore,
    confidenceLevel,
    confidenceColor,
    actionItems,
  } = useFollowerPersonal({ followersCount, demographics, activeTimes });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md lg:col-span-10 w-full"
    >
      {/* 1. HIỂN THỊ CẢNH BÁO SAMPLE NHỎ (FALLBACK) */}
      {followersCount < 100 && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/20 text-warning rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-black uppercase tracking-wider block text-[10px] mb-1">
              Cảnh báo quy mô dữ liệu
            </span>
            Quy mô người theo dõi hiện tại ({followersCount} followers) còn
            tương đối nhỏ. Phân tích chân dung đã được chuyển sang chế độ dự báo
            nâng cao. Các đề xuất dưới đây mang tính chất định hướng và sẽ đạt
            độ chính xác tối ưu khi kênh vượt mốc 100 người theo dõi thực tế.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT SIDE: RADAR CHART (4/12 columns) */}
        <div className="w-full lg:col-span-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Compass size={18} className="text-primary animate-spin-slow" />
            <h4 className="font-extrabold text-base-content text-md tracking-tight">
              Điểm Hội Tụ Khán Giả
            </h4>
          </div>

          <div className="w-full h-[230px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={personaData}
              >
                <PolarGrid stroke="var(--color-base-content)" opacity={0.08} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: "var(--color-base-content)",
                    opacity: 0.8,
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "var(--font-sans, sans-serif)",
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Chỉ số hội tụ"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Center decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <Target size={36} className="text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono mt-2 text-center">
            Liên kết 4 đỉnh hành vi & nhân khẩu học thực tế
          </p>
        </div>

        {/* RIGHT SIDE: AUDIENCE PERSONA HIGHLIGHTS (8/12 columns) */}
        <div className="w-full lg:col-span-8 flex flex-col justify-between self-stretch">
          <div>
            {/* Header: Chân dung Title & Confidence score badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
                <Sparkles size={13} className="text-primary" />
                <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider font-mono">
                  Chân dung Khán giả lý tưởng
                </span>
              </div>

              {/* Confidence Score Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono border ${confidenceColor}`}
              >
                <ShieldCheck size={12} className="shrink-0" />
                Độ tin cậy: {confidenceScore}% ({confidenceLevel})
              </div>
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-base-content tracking-tight mb-5 leading-tight">
              {personaHeadline}
            </h3>

            {/* Persona Details Grid (3 columns horizontally separated by subtle vertical lines) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 sm:gap-y-0 divide-y sm:divide-y-0 sm:divide-x divide-base-content/10 mb-6">
              <div className="flex items-start gap-3 px-1 sm:pl-0 sm:pr-4 pb-4 sm:pb-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-info/10 shrink-0 mt-0.5">
                  <User size={15} className="text-info" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">
                    Giới tính & Tuổi
                  </span>
                  <span className="text-sm font-semibold text-base-content/90 block mt-0.5">
                    {genderLabel} ({genderPct}%), {ageLabel} ({agePct}%)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 px-1 sm:px-4 py-4 sm:py-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 shrink-0 mt-0.5">
                  <Globe size={15} className="text-success" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">
                    Vị trí địa lý
                  </span>
                  <span className="text-sm font-semibold text-base-content/90 leading-tight block mt-0.5">
                    {countryLabel} ({countryPct}%) chiếm ưu thế
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 px-1 sm:pl-4 sm:pr-0 pt-4 sm:pt-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 shrink-0 mt-0.5">
                  <Clock size={15} className="text-secondary" />
                </div>
                <div>
                  <span className="block text-xs text-base-content/70 font-bold uppercase tracking-wide font-mono">
                    Hành vi online
                  </span>
                  <span className="text-sm font-semibold text-base-content/90 leading-tight block mt-0.5">
                    {behaviorLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Strategic Insight - Actionable Bullet Points style with Highlighted Stats */}
          <div className="p-5 bg-amber-500/5 dark:bg-amber-500/5 border-l-4 border-amber-500 rounded-r-3xl text-xs text-base-content/80 font-medium shadow-inner flex flex-col gap-3">
            <span className="font-black text-amber-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Target size={14} className="stroke-[2.5]" /> Khuyến nghị truyền
              thông chiến lược
            </span>

            {/* Insight Block */}
            <div className="text-xs leading-relaxed text-base-content/85 font-semibold bg-base-200/40 px-3.5 py-2 rounded-xl border border-base-content/5">
              💡{" "}
              <span className="text-base-content font-bold uppercase tracking-wider text-xs font-mono mr-1">
                Hiểu thấu (Insight):
              </span>{" "}
              {insightText}
            </div>

            {/* Action Bullets */}
            <div className="space-y-2 mt-1">
              <span className="block text-xs font-extrabold uppercase text-amber-600 dark:text-amber-500 tracking-wider font-mono">
                Hành động đề xuất (Action Items):
              </span>
              <ul className="space-y-2.5">
                {actionItems.map((item: React.ReactNode, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs text-base-content/85 leading-relaxed font-medium"
                  >
                    <span className="flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full p-1 mt-0.5 shrink-0">
                      <Check size={10} className="stroke-[3.5]" />
                    </span>
                    <div>{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
