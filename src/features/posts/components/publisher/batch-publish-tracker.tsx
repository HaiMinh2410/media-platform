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
 * Tách biệt giao diện chuyên nghiệp theo Aurora UI Specification và daisyUI 5.
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
      <div className="alert alert-error shadow-sm rounded-2xl flex items-center gap-3">
        <AlertCircle size={20} />
        <span className="font-semibold">{error}</span>
      </div>
    );
  }

  if (!status) return null;

  const progress = Math.round(
    ((status.completed + status.failed) / status.total) * 100,
  );

  return (
    <div className="card card-bordered bg-base-100 border-base-content/5 shadow-sm p-6 md:p-8 bg-linear-to-br from-info/5 via-transparent to-transparent space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 rounded-3xl">
      {/* Header section */}
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
          <p className="text-base-content/40 text-xs font-bold uppercase tracking-widest font-mono">
            Batch ID: <span className="font-mono font-medium text-base-content/60 normal-case select-all">{batchId}</span>
          </p>
        </div>

        {status.failed > 0 && isFinished && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="btn btn-error btn-sm rounded-2xl font-bold gap-2 hover:shadow-md cursor-pointer"
          >
            {isRetrying ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Đăng lại các mục lỗi ({status.failed})
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-base-content/60">Tổng quan ({progress}%)</span>
          <span className="text-base-content/80 font-mono font-black">
            {status.completed + status.failed} / {status.total}
          </span>
        </div>
        <div className="h-3 w-full bg-base-200 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(status.completed / status.total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-success shadow-xs"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(status.failed / status.total) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-error shadow-xs"
          />
        </div>
      </div>

      {/* Stats Container using daisyUI Stats */}
      <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-200/30 border border-base-content/5 rounded-2xl shadow-xs overflow-hidden">
        {/* Completed */}
        <div className="stat">
          <div className="stat-title flex items-center gap-1.5 text-success/80 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={13} className="text-success" />
            Hoàn thành
          </div>
          <div className="stat-value text-success font-mono text-2xl font-black mt-1">
            {status.completed}
          </div>
        </div>

        {/* Failed */}
        <div className="stat border-t sm:border-t-0 sm:border-l border-base-content/5">
          <div className="stat-title flex items-center gap-1.5 text-error/80 font-bold text-xs uppercase tracking-wider">
            <XCircle size={13} className="text-error" />
            Lỗi
          </div>
          <div className="stat-value text-error font-mono text-2xl font-black mt-1">
            {status.failed}
          </div>
        </div>

        {/* Running */}
        <div className="stat border-t sm:border-t-0 sm:border-l border-base-content/5">
          <div className="stat-title flex items-center gap-1.5 text-info/80 font-bold text-xs uppercase tracking-wider">
            <Loader2 size={13} className={cn("text-info", status.running > 0 && "animate-spin")} />
            Đang chạy
          </div>
          <div className="stat-value text-info font-mono text-2xl font-black mt-1">
            {status.running}
          </div>
        </div>

        {/* Scheduled */}
        <div className="stat border-t sm:border-t-0 sm:border-l border-base-content/5">
          <div className="stat-title flex items-center gap-1.5 text-info/70 font-bold text-xs uppercase tracking-wider">
            <Calendar size={13} className="text-info/70" />
            Đã lên lịch
          </div>
          <div className="stat-value text-info/80 font-mono text-2xl font-black mt-1">
            {status.scheduled || 0}
          </div>
        </div>

        {/* Pending */}
        <div className="stat border-t sm:border-t-0 sm:border-l border-base-content/5">
          <div className="stat-title flex items-center gap-1.5 text-base-content/40 font-bold text-xs uppercase tracking-wider">
            Chờ
          </div>
          <div className="stat-value text-base-content/60 font-mono text-2xl font-black mt-1">
            {status.pending}
          </div>
        </div>
      </div>

      {/* Job Details (Failed Only) */}
      {status.failed > 0 && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono flex items-center gap-2">
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
                  <div className="h-10 w-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                    <XCircle size={20} className="text-error" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-base-content flex items-center gap-2">
                      {job.account?.name || "Tài khoản không xác định"}
                      <span className="badge badge-sm badge-ghost uppercase font-bold tracking-tight">
                        {job.platform}
                      </span>
                    </div>
                    <p className="text-sm text-error/95 leading-relaxed font-medium">
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
