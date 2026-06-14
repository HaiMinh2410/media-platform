import { cn } from "@shared/lib";
import { ShieldAlert, AlertTriangle } from "lucide-react";

type RiskBannerSectionProps = {
  profile: any;
};

export function RiskBannerSection({ profile }: RiskBannerSectionProps) {
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
