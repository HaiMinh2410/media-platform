'use client';

import React, { useState } from 'react';
import { usePublishStatus } from '@/hooks/use-publish-status';
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      const res = await fetch('/api/publish/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Đã khởi tạo lại ${data.retriedCount} bài đăng bị lỗi.`);
      } else {
        toast.error(data.message || data.error || 'Không thể thực hiện lại.');
      }
    } catch (err) {
      console.error('[Retry Error]', err);
      toast.error('Có lỗi xảy ra khi kết nối tới máy chủ.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 flex items-center gap-3">
        <AlertCircle size={20} />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (!status) return null;

  const progress = Math.round(((status.completed + status.failed) / status.total) * 100);

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border-blue-500/20 border bg-blue-500/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {status.status === 'SCHEDULED' ? 'Đã lên lịch đăng bài' : 'Tiến độ đăng bài'}
            {status.status === 'RUNNING' && <Loader2 className="animate-spin text-blue-400" size={18} />}
            {status.status === 'SCHEDULED' && <Calendar className="text-blue-400" size={18} />}
          </h3>
          <p className="text-slate-400 text-sm font-medium">
            Batch ID: <span className="font-mono text-xs">{batchId}</span>
          </p>
        </div>

        {status.failed > 0 && isFinished && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-600/20"
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
          <span className="text-slate-300">Tổng quan ({progress}%)</span>
          <span className="text-white">{status.completed + status.failed} / {status.total}</span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
            style={{ width: `${(status.completed / status.total) * 100}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
            style={{ width: `${(status.failed / status.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatBox label="Hoàn thành" value={status.completed} color="text-green-400" icon={<CheckCircle2 size={14} />} />
        <StatBox label="Lỗi" value={status.failed} color="text-red-400" icon={<XCircle size={14} />} />
        <StatBox label="Đang chạy" value={status.running} color="text-blue-400" icon={<Loader2 size={14} className="animate-spin" />} />
        <StatBox label="Đã lên lịch" value={status.scheduled || 0} color="text-blue-300" icon={<Calendar size={14} />} />
        <StatBox label="Chờ" value={status.pending} color="text-slate-400" />
      </div>

      {/* Job Details (Failed Only) */}
      {status.failed > 0 && (
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500" />
            Chi tiết các mục bị lỗi
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {status.jobs.filter(j => j.status === 'FAILED').map(job => (
              <div key={job.id} className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-red-500/10">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                   <XCircle size={20} className="text-red-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-[15px] font-bold text-white flex items-center gap-2">
                    {job.account?.name || 'Tài khoản không xác định'}
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                      {job.platform}
                    </span>
                  </div>
                  <p className="text-sm text-red-400/90 leading-relaxed font-medium">
                    {job.error_message || 'Đã có lỗi không xác định xảy ra từ phía Meta.'}
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

function StatBox({ label, value, color, icon }: { label: string; value: number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
      <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className={cn("text-2xl font-bold", color || "text-white")}>{value}</div>
    </div>
  );
}
