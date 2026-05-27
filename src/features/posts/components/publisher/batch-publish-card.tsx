'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, RefreshCcw, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@shared/lib/utils';
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
    <div className="group relative bg-base-100 border border-base-content/5 shadow-xs rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md active:scale-[0.99] transition-all duration-300">
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
            <Eye className="text-base-content/30" size={40} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border transition-colors",
            batch.status === 'SUCCESS' && "bg-success/10 text-success border-success/20",
            batch.status === 'FAILED' && "bg-error/10 text-error border-error/20",
            batch.status === 'PARTIAL' && "bg-warning/10 text-warning border-warning/20",
            batch.status === 'SCHEDULED' && "bg-info/10 text-info border-info/20"
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
          <div className="absolute bottom-3 right-3 badge badge-sm badge-soft bg-base-300/80 backdrop-blur-md text-base-content font-mono border-none">
            +{batch.mediaUrls.length - 1} more
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-base-content line-clamp-2 leading-relaxed">
            {batch.content || <span className="text-base-content/30 italic">Không có nội dung</span>}
          </p>
        </div>

        {/* Account Chips */}
        <div className="flex flex-wrap gap-1.5">
          {batch.accounts.map((acc) => (
            <div 
              key={acc.id}
              className={cn(
                "badge badge-xs badge-soft font-bold",
                acc.status === 'SUCCESS' && "badge-success",
                acc.status === 'FAILED' && "badge-error",
                acc.status === 'SCHEDULED' && "badge-info"
              )}
            >
              {acc.name}
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-base-content/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base-content/50">
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
              className="btn btn-xs btn-soft btn-info rounded-lg font-bold gap-1 cursor-pointer hover:shadow-xs transition-all"
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
