import React from 'react';
import { Users, ExternalLink, RefreshCw, Info } from 'lucide-react';

export function LeadsStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      
      {/* Stat 1: Tiếp nhận */}
      <div className="bg-base-100 rounded-2xl p-5 border border-base-content/5 border-t-2 border-t-info flex flex-col gap-1.5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-98 group">
        {/* Sparkline Graphic (Info color) */}
        <div className="absolute right-4 bottom-4 w-20 h-10 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkline-info" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-info)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,80 Q20,30 40,65 T80,25 T100,15 L100,100 L0,100 Z" fill="url(#sparkline-info)" />
            <path d="M0,80 Q20,30 40,65 T80,25 T100,15" fill="none" stroke="var(--color-info)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex justify-between items-start">
          <span className="text-2xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Tiếp nhận</span>
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center border border-info/5 shadow-2xs">
            <Users size={15} className="text-info" />
          </div>
        </div>
        <span className="text-4xl font-black tracking-tighter text-base-content font-mono mt-1">3</span>
        <span className="text-3xs text-base-content/50 flex items-center gap-1 mt-1 font-bold">
          <Info size={11} className="opacity-60 text-info" /> 3 khách hàng mới trong phễu
        </span>
      </div>
      
      {/* Stat 2: Đã chuyển đổi */}
      <div className="bg-base-100 rounded-2xl p-5 border border-base-content/5 border-t-2 border-t-primary flex flex-col gap-1.5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-98 group">
        {/* Sparkline Graphic (Primary color) */}
        <div className="absolute right-4 bottom-4 w-20 h-10 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkline-primary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,90 Q20,80 40,85 T80,50 T100,20 L100,100 L0,100 Z" fill="url(#sparkline-primary)" />
            <path d="M0,90 Q20,80 40,85 T80,50 T100,20" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex justify-between items-start">
          <span className="text-2xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Đã chuyển đổi</span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/5 shadow-2xs">
            <ExternalLink size={15} className="text-primary" />
          </div>
        </div>
        <span className="text-4xl font-black tracking-tighter text-base-content font-mono mt-1">0</span>
        <span className="text-3xs text-base-content/50 flex items-center gap-1 mt-1 font-bold">
          <Info size={11} className="opacity-60 text-primary" /> Từ các chiến dịch marketing
        </span>
      </div>

      {/* Stat 3: Tỷ lệ chuyển đổi */}
      <div className="bg-base-100 rounded-2xl p-5 border border-base-content/5 border-t-2 border-t-success flex flex-col gap-1.5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-98 group">
        {/* Sparkline Graphic (Success color) */}
        <div className="absolute right-4 bottom-4 w-20 h-10 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkline-success" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,85 Q20,70 40,75 T80,40 T100,10 L100,100 L0,100 Z" fill="url(#sparkline-success)" />
            <path d="M0,85 Q20,70 40,75 T80,40 T100,10" fill="none" stroke="var(--color-success)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex justify-between items-start">
          <span className="text-2xs font-bold text-base-content/40 uppercase tracking-widest font-mono">Tỷ lệ chuyển đổi</span>
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center border border-success/5 shadow-2xs">
            <RefreshCw size={15} className="text-success" />
          </div>
        </div>
        <span className="text-4xl font-black tracking-tighter text-base-content font-mono mt-1">0%</span>
        <span className="text-3xs text-base-content/50 flex items-center gap-1 mt-1 font-bold">
          <Info size={11} className="opacity-60 text-success" /> Mục tiêu quý này: 15%
        </span>
      </div>
    </div>
  );
}
