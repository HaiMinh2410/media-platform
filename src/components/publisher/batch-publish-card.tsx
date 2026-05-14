'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BatchPublishSummary = {
  id: string;
  batchId: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  accounts: {
    id: string;
    name: string;
    platform: string;
    status: 'SUCCESS' | 'FAILED';
  }[];
};

type BatchPublishCardProps = {
  batch: BatchPublishSummary;
  onRetryFailed: (batchId: string, failedAccountIds: string[]) => void;
};

export function BatchPublishCard({ batch, onRetryFailed }: BatchPublishCardProps) {
  const successCount = batch.accounts.filter(a => a.status === 'SUCCESS').length;
  const failCount = batch.accounts.filter(a => a.status === 'FAILED').length;
  const totalCount = batch.accounts.length;

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const failedIds = batch.accounts.filter(a => a.status === 'FAILED').map(a => a.id);
    onRetryFailed(batch.batchId, failedIds);
  };

  return (
    <div className="group relative bg-[#161920] border border-[#2a2f42] rounded-2xl overflow-hidden hover:border-[#4f7cff]/30 transition-all duration-300 shadow-lg">
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          batch.status === 'SUCCESS' ? "bg-[#22d3a0]/10 text-[#22d3a0]" : "bg-[#f5a623]/10 text-[#f5a623]"
        )}>
          {batch.status === 'SUCCESS' ? 'Thành công' : 'Một phần'}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Content Excerpt */}
        <div className="space-y-2">
          <p className="text-[13px] text-white/90 line-clamp-2 leading-relaxed font-medium">
            {batch.content || <span className="text-[#7a7a9a] italic">Không có nội dung</span>}
          </p>
          
          {/* Media Indicators (if any) */}
          {batch.mediaUrls.length > 0 && (
            <div className="flex gap-1">
              {batch.mediaUrls.slice(0, 3).map((url, i) => (
                <div key={i} className="w-8 h-8 rounded-md bg-[#1e2230] border border-[#2a2f42] overflow-hidden">
                   <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {batch.mediaUrls.length > 3 && (
                <div className="w-8 h-8 rounded-md bg-[#1e2230] border border-[#2a2f42] flex items-center justify-center text-[10px] text-[#7a7a9a] font-bold">
                  +{batch.mediaUrls.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Chips */}
        <div className="flex flex-wrap gap-2">
          {batch.accounts.map((acc) => (
            <div 
              key={acc.id}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors",
                acc.status === 'SUCCESS' 
                  ? "bg-[#22d3a0]/5 border-[#22d3a0]/20 text-[#22d3a0]" 
                  : "bg-[#ff5c6a]/5 border-[#ff5c6a]/20 text-[#ff5c6a]"
              )}
            >
              {acc.status === 'SUCCESS' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
              {acc.name}
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-[#2a2f42] flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#7a7a9a]">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span className="text-[11px] font-medium">{format(new Date(batch.createdAt), 'HH:mm · dd/MM/yyyy')}</span>
            </div>
            <div className="text-[11px] font-bold">
              <span className="text-[#22d3a0]">{successCount}✓</span>
              {failCount > 0 && <span className="text-[#ff5c6a] ml-1.5">{failCount}✗</span>}
            </div>
          </div>

          {failCount > 0 && (
            <button 
              onClick={handleRetry}
              className="text-[#4f7cff] text-[11px] font-bold flex items-center gap-1 hover:underline group/btn"
            >
              <RefreshCcw size={12} className="group-hover/btn:rotate-180 transition-transform duration-500" />
              Đăng lại các mục lỗi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
