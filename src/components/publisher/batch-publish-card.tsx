'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, RefreshCcw, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type BatchPublishSummary = {
  id: string;
  batchId: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  scheduledAt?: Date | null;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SCHEDULED';
  accounts: {
    id: string;
    name: string;
    platform: string;
    status: 'SUCCESS' | 'FAILED' | 'SCHEDULED';
  }[];
};

type BatchPublishCardProps = {
  batch: BatchPublishSummary;
  workspaceId: string;
};

export function BatchPublishCard({ batch, workspaceId }: BatchPublishCardProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const failCount = batch.accounts.filter(a => a.status === 'FAILED').length;

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const failedAccounts = batch.accounts
      .filter(a => a.status === 'FAILED')
      .map(a => ({ accountId: a.id, platform: a.platform.toUpperCase() }));

    if (failedAccounts.length === 0) return;

    setIsRetrying(true);
    toast.loading('Đang khởi tạo đăng lại...', { id: 'retry-publish' });

    try {
      const response = await fetch('/api/publish/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.batchId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry');
      }

      toast.success('Đã bắt đầu đăng lại các mục lỗi!', { id: 'retry-publish' });
      
      // Tùy chọn: Chuyển hướng đến trang tracker nếu muốn theo dõi chi tiết
      // window.location.href = `/dashboard/posts?batchId=${batch.batchId}`;
      
    } catch (error: any) {
      console.error('Retry error:', error);
      toast.error(error.message || 'Không thể đăng lại. Vui lòng thử lại sau.', { id: 'retry-publish' });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="group relative bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden hover:border-foreground/20 transition-all duration-300">
      {/* Media Preview */}
      <div className="aspect-video bg-base-300 relative overflow-hidden">
        {batch.mediaUrls.length > 0 ? (
          <img 
            src={batch.mediaUrls[0]} 
            alt="Batch media" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="text-foreground-tertiary" size={40} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border transition-colors",
            batch.status === 'SUCCESS' && "bg-emerald-600/10 text-emerald-400 border-emerald-500/30",
            batch.status === 'FAILED' && "bg-red-600/10 text-red-400 border-red-500/30",
            batch.status === 'PARTIAL' && "bg-amber-600/10 text-amber-400 border-amber-500/30",
            batch.status === 'SCHEDULED' && "bg-blue-600/10 text-blue-400 border-blue-500/30"
          )}>
            {batch.status === 'SUCCESS' && <CheckCircle2 size={12} />}
            {batch.status === 'FAILED' && <XCircle size={12} />}
            {batch.status === 'PARTIAL' && <AlertCircle size={12} />}
            {batch.status === 'SCHEDULED' && <Calendar size={12} />}
            {batch.status === 'SUCCESS' && 'Thành công'}
            {batch.status === 'FAILED' && 'Thất bại'}
            {batch.status === 'PARTIAL' && 'Một phần'}
            {batch.status === 'SCHEDULED' && 'Đã lên lịch'}
          </div>
        </div>

        {batch.mediaUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-foreground/60 backdrop-blur-md text-background text-2xs px-2 py-1 rounded-md">
            +{batch.mediaUrls.length - 1} more
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
            {batch.content || <span className="text-foreground-tertiary italic">Không có nội dung</span>}
          </p>
        </div>

        {/* Account Chips */}
        <div className="flex flex-wrap gap-1.5">
          {batch.accounts.map((acc) => (
            <div 
              key={acc.id}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                acc.status === 'SUCCESS' && "bg-emerald-500/5 border-emerald-500/10 text-emerald-500",
                acc.status === 'FAILED' && "bg-red-500/5 border-red-500/10 text-red-500",
                acc.status === 'SCHEDULED' && "bg-blue-500/5 border-blue-500/10 text-blue-500"
              )}
            >
              {acc.name}
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-foreground/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Calendar size={12} />
            <span className="text-11 font-medium">
              {batch.status === 'SCHEDULED' && batch.scheduledAt 
                ? `Dự kiến: ${format(new Date(batch.scheduledAt), 'HH:mm · dd/MM/yyyy')}`
                : format(new Date(batch.createdAt), 'HH:mm · dd/MM/yyyy')
              }
            </span>
          </div>

          {failCount > 0 && (
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-2xs font-bold transition-all"
            >
              <RefreshCcw size={12} className={cn(isRetrying && "animate-spin")} />
              {isRetrying ? 'Đang gửi...' : 'Đăng lại lỗi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
