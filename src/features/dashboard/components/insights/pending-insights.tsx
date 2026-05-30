import React from 'react';
import { TrendingUp } from 'lucide-react';

export interface PendingInsightsProps {
  title: string;
}

export function PendingInsights({ title }: PendingInsightsProps) {
  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[450px] border border-dashed border-base-content/10 rounded-2xl bg-base-100/50 p-10 text-center animate-fade-in w-full">
      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 shadow-xs">
        <TrendingUp size={28} />
      </div>
      <h3 className="text-xl font-bold text-base-content tracking-tight">
        {title} đang được chuẩn bị
      </h3>
      <p className="text-sm text-base-content/60 max-w-md mt-1.5 leading-relaxed font-medium">
        Hệ thống AI đang tổng hợp và phân tích dữ liệu chuyên sâu cho mục này. Dữ liệu thời gian thực sẽ sớm được cập nhật tự động.
      </p>
      <button className="btn btn-primary btn-sm rounded-md font-bold mt-5 px-5">
        Đồng bộ dữ liệu ngay
      </button>
    </div>
  );
}
