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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface BatchPublishTrackerProps {
  batchId: string;
  onFinished?: () => void;
}

/**
 * Component hiển thị tiến độ đăng bài của một Batch dưới dạng Thanh Trạng Thái Ngang (Compact Status Bar).
 * Tối ưu diện tích hiển thị dọc, hỗ trợ xem nhanh tiến độ và chi tiết lỗi qua accordion.
 */
export function BatchPublishTracker({ batchId, onFinished }: BatchPublishTrackerProps) {
  const { status, error, isLoading, isFinished } = usePublishStatus(batchId);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  
  // Track if the batch was actually active/running before finishing
  const hasBeenActive = React.useRef(false);

  React.useEffect(() => {
    if (status) {
      const isActive = status.status === 'RUNNING' || 
                     status.status === 'PENDING' || 
                     status.status === 'SCHEDULED';
      if (isActive) {
        hasBeenActive.current = true;
      }
    }
  }, [status]);

  React.useEffect(() => {
    if (isFinished && onFinished && hasBeenActive.current) {
      onFinished();
    }
  }, [isFinished, onFinished]);

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
      <div className="alert alert-error shadow-sm rounded-xl py-2 px-3 flex items-center gap-2 text-sm">
        <AlertCircle size={16} />
        <span className="font-semibold text-error-content">{error}</span>
      </div>
    );
  }

  if (!status) return null;

  const progress = Math.round(
    ((status.completed + status.failed) / status.total) * 100,
  );

  return (
    <div className="relative w-full flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl pb-4">
      {/* Main Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
        {/* Left: Status and Stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-base-content font-bold">
            {status.status === "RUNNING" ? (
              <Loader2 className="animate-spin text-info" size={15} />
            ) : status.status === "SCHEDULED" ? (
              <Calendar className="text-info" size={15} />
            ) : (
              <CheckCircle2 className="text-success" size={15} />
            )}
            <span className="text-sm">
              {status.status === "SCHEDULED"
                ? "Đã lên lịch"
                : status.status === "RUNNING"
                ? "Đang đăng bài"
                : "Đăng hoàn tất"}
            </span>
          </div>

          <span className="text-base-content/15 hidden xs:inline">|</span>

          <div className="flex items-center gap-1 font-mono font-bold text-xs text-base-content/80 px-2 py-0.5">
            <span>Tiến độ:</span>
            <span className={cn(
              progress === 100 && status.failed === 0
                ? "text-success"
                : status.failed > 0
                ? "text-error"
                : "text-info"
            )}>{progress}%</span>
            <span className="text-base-content/40 font-normal">({status.completed + status.failed}/{status.total})</span>
          </div>

          <span className="text-base-content/15 hidden sm:inline">|</span>

          {/* Mini indicators */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {status.completed > 0 && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 size={13} />
                <span>{status.completed}</span>
                <span className="text-base-content/50 font-normal hidden sm:inline">Hoàn thành</span>
              </span>
            )}

            {status.failed > 0 && (
              <span className="flex items-center gap-1 text-error">
                <XCircle size={13} />
                <span>{status.failed}</span>
                <span className="text-base-content/50 font-normal hidden sm:inline">Lỗi</span>
              </span>
            )}

            {status.running > 0 && (
              <span className="flex items-center gap-1 text-info">
                <Loader2 size={13} className="animate-spin" />
                <span>{status.running}</span>
                <span className="text-base-content/50 font-normal hidden sm:inline">Đang chạy</span>
              </span>
            )}

            {status.scheduled > 0 && (
              <span className="flex items-center gap-1 text-info/70">
                <Calendar size={13} />
                <span>{status.scheduled}</span>
                <span className="text-base-content/50 font-normal hidden sm:inline">Đã lên lịch</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions and Batch ID */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {/* Retry Button */}
            {status.failed > 0 && isFinished && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="btn btn-error btn-xs rounded-xl font-bold gap-1 hover:shadow-xs py-1 px-2.5 h-7 min-h-0 cursor-pointer"
              >
                {isRetrying ? (
                  <Loader2 className="animate-spin" size={11} />
                ) : (
                  <RefreshCw size={11} />
                )}
                <span>Đăng lại ({status.failed})</span>
              </button>
            )}

            {/* Error Toggle Button */}
            {status.failed > 0 && (
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="btn btn-ghost btn-xs rounded-xl gap-1 text-xs font-semibold py-1 px-2 h-7 min-h-0 cursor-pointer hover:bg-base-200"
              >
                <span>Chi tiết lỗi</span>
                {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          <div className="text-[10px] text-base-content/30 font-mono tracking-wider">
            BATCH ID: <span className="font-mono text-base-content/50 font-medium normal-case select-all select-text">{batchId}</span>
          </div>
        </div>
      </div>

      {/* Ultra-thin Progress Bar (4px) running at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-base-200/50 flex overflow-hidden">
        {status.total > 0 && (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(status.completed / status.total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-success"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(status.failed / status.total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-error"
            />
          </>
        )}
      </div>

      {/* Collapsible Error details */}
      {status.failed > 0 && showErrors && (
        <div className="border-t border-base-content/5 pt-3 mt-1.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <h4 className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <AlertCircle size={12} className="text-error" />
            Chi tiết các mục đăng thất bại
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
            {status.jobs
              .filter((j) => j.status === "FAILED")
              .map((job) => (
                <div
                  key={job.id}
                  className="bg-error/5 border border-error/10 rounded-xl p-2.5 flex items-start gap-2.5 transition-all hover:bg-error/8"
                >
                  <div className="h-6 w-6 rounded-md bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                    <XCircle size={13} className="text-error" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      {job.account?.name || "Tài khoản không xác định"}
                      <span className="badge badge-sm badge-ghost uppercase font-bold text-[9px] px-1 py-0.5 leading-none h-auto">
                        {job.platform}
                      </span>
                    </div>
                    <p className="text-xs text-error/95 leading-relaxed font-medium">
                      {job.error_message || "Đã có lỗi không xác định xảy ra từ phía Meta."}
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

