'use client';

import { cn } from "@shared/lib";

import React, { useState } from "react";
import { usePublishStatus } from "@features/posts/hooks/use-publish-status";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface BatchPublishTrackerProps {
  batchId: string;
}

/**
 * Component hiển thị tiến độ đăng bài của một Batch (phiên làm việc).
 * Tích hợp nút Retry để đăng lại các mục bị lỗi.
 */
export function BatchPublishTracker({ batchId }: BatchPublishTrackerProps) {
  const { status, error, isLoading, isFinished } = usePublishStatus(batchId);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch("/api/publish/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Đã khởi tạo lại ${data.retriedCount} bài đăng bị lỗi.`);
      } else {
        toast.error(data.message || data.error || "Không thể thực hiện lại.");
      }
    } catch (err) {
      console.error("[Retry Error]", err);
      toast.error("Có lỗi xảy ra khi kết nối tới máy chủ.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 rounded-2xl text-error flex items-center gap-3">
        <AlertCircle size={20} />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (!status) return null;

  const progress = Math.round(
    ((status.completed + status.failed) / status.total) * 100,
  );

  return (
    <div className="bg-base-100 border border-base-content/5 shadow-md rounded-3xl p-6 md:p-8 bg-gradient-to-br from-info/5 via-transparent to-transparent space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-brand font-bold text-base-content flex items-center gap-2">
            {status.status === "SCHEDULED"
              ? "Đã lên lịch đăng bài"
              : "Tiến độ đăng bài"}
            {status.status === "RUNNING" && (
              <Loader2 className="animate-spin text-info" size={18} />
            )}
            {status.status === "SCHEDULED" && (
              <Calendar className="text-info" size={18} />
            )}
          </h3>
          <p className="text-base-content/50 text-sm font-medium">
            Batch ID: <span className="font-mono text-xs">{batchId}</span>
          </p>
        </div>

        {status.failed > 0 && isFinished && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/80 disabled:opacity-50 text-error-content rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-error/20 cursor-pointer"
          >
            {isRetrying ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Đăng lại các mục lỗi ({status.failed})
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-base-content/70">Tổng quan ({progress}%)</span>
          <span className="text-base-content font-mono">
            {status.completed + status.failed} / {status.total}
          </span>
        </div>
        <div className="h-3 w-full bg-base-200 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(status.completed / status.total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-success shadow-[0_0_12px_rgba(var(--color-success),0.4)]"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(status.failed / status.total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-error shadow-[0_0_12px_rgba(var(--color-error),0.4)]"
          />
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatBox
          label="Hoàn thành"
          value={status.completed}
          color="text-success"
          icon={<CheckCircle2 size={14} />}
        />
        <StatBox
          label="Lỗi"
          value={status.failed}
          color="text-error"
          icon={<XCircle size={14} />}
        />
        <StatBox
          label="Đang chạy"
          value={status.running}
          color="text-info"
          icon={<Loader2 size={14} className="animate-spin" />}
        />
        <StatBox
          label="Đã lên lịch"
          value={status.scheduled || 0}
          color="text-info/80"
          icon={<Calendar size={14} />}
        />
        <StatBox
          label="Chờ"
          value={status.pending}
          color="text-base-content/50"
        />
      </div>

      {/* Job Details (Failed Only) */}
      {status.failed > 0 && (
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-bold text-base-content/50 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-error" />
            Chi tiết các mục bị lỗi
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {status.jobs
              .filter((j) => j.status === "FAILED")
              .map((job) => (
                <div
                  key={job.id}
                  className="bg-error/5 border border-error/10 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-error/10"
                >
                  <div className="h-10 w-10 rounded-xl bg-error/20 flex items-center justify-center shrink-0">
                    <XCircle size={20} className="text-error" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[15px] font-bold text-base-content flex items-center gap-2">
                      {job.account?.name || "Tài khoản không xác định"}
                      <span className="px-2 py-0.5 bg-base-200 border border-base-content/10 rounded-lg text-2xs text-base-content/70 uppercase font-bold tracking-tight">
                        {job.platform}
                      </span>
                    </div>
                    <p className="text-sm text-error/90 leading-relaxed font-medium">
                      {job.error_message ||
                        "Đã có lỗi không xác định xảy ra từ phía Meta."}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-base-200/50 rounded-2xl p-4 border border-base-content/5">
      <div className="text-base-content/40 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-bold font-mono",
          color || "text-base-content",
        )}
      >
        {value}
      </div>
    </div>
  );
}
