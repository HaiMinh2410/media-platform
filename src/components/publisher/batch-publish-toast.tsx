'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PlatformAccount } from '@/domain/types/platform-account';

export type AccountPublishState = {
  id: string;
  name: string;
  platform: string;
  status: 'PENDING' | 'LOADING' | 'SUCCESS' | 'FAILED';
  avatar_url?: string;
};

type BatchPublishToastProps = {
  initialAccounts: AccountPublishState[];
  onClose: () => void;
  onRetry: (failedIds: string[]) => void;
};

export function BatchPublishToast({ initialAccounts, onClose, onRetry }: BatchPublishToastProps) {
  const [accounts, setAccounts] = useState<AccountPublishState[]>(initialAccounts);

  // Simulation of staggered resolution (in a real app, this would be driven by SSE/WebSockets/Polling)
  useEffect(() => {
    const timer = setTimeout(() => {
      accounts.forEach((acc, index) => {
        if (acc.status === 'PENDING') {
          setTimeout(() => {
            setAccounts(prev => prev.map(a => 
              a.id === acc.id ? { ...a, status: 'LOADING' } : a
            ));

            setTimeout(() => {
              setAccounts(prev => prev.map(a => 
                a.id === acc.id ? { ...a, status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED' } : a
              ));
            }, 1200);
          }, index * 600);
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const failedAccounts = accounts.filter(a => a.status === 'FAILED');
  const hasFailed = failedAccounts.length > 0;
  const isDone = accounts.every(a => a.status === 'SUCCESS' || a.status === 'FAILED');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-7 right-7 w-[340px] bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] font-sans"
    >
      {/* HEADER */}
      <div className="bg-[#1e2230] px-4 py-3 flex items-center justify-between border-b border-[#2a2f42]">
        <span className="text-white font-bold text-[13px] flex items-center gap-2">
          🚀 {isDone ? 'Đã hoàn tất' : 'Đang xuất bản...'}
        </span>
        <button onClick={onClose} className="text-[#7a7a9a] hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* ITEM LIST */}
      <div className="max-h-[300px] overflow-y-auto">
        {accounts.map((acc) => (
          <div key={acc.id} className="flex items-center gap-3 px-4 h-[52px] border-b border-[#2a2f42]/50 last:border-0">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0 overflow-hidden" style={{ backgroundColor: acc.platform.toLowerCase() === 'facebook' ? '#1877F2' : '#E1306C' }}>
              {acc.avatar_url ? (
                <img src={acc.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                acc.name.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-[12px] text-white font-bold truncate">{acc.name}</span>
              <span className={cn(
                "text-[10px] font-medium",
                acc.status === 'SUCCESS' ? "text-[#22d3a0]" : 
                acc.status === 'FAILED' ? "text-[#ff5c6a]" : "text-[#7a7a9a]"
              )}>
                {acc.status === 'PENDING' && "⏳ Đang chờ..."}
                {acc.status === 'LOADING' && "🔄 Đang đăng..."}
                {acc.status === 'SUCCESS' && "✅ Thành công"}
                {acc.status === 'FAILED' && "❌ Thất bại"}
              </span>
            </div>

            <div className="shrink-0">
              {acc.status === 'LOADING' && (
                <div className="w-4 h-4 rounded-full border-2 border-[#4f7cff]/20 border-t-[#4f7cff] animate-spin" />
              )}
              {acc.status === 'SUCCESS' && <span className="text-[#22d3a0] text-sm">✅</span>}
              {acc.status === 'FAILED' && <span className="text-[#ff5c6a] text-sm">❌</span>}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      {hasFailed && isDone && (
        <div className="bg-[#1e2230] px-4 py-3 flex items-center justify-between border-t border-[#2a2f42]">
          <div className="bg-[#ff5c6a]/10 text-[#ff5c6a] text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
            ⚠️ {failedAccounts.length} thất bại
          </div>
          <button 
            onClick={() => onRetry(failedAccounts.map(a => a.id))}
            className="bg-[#4f7cff]/10 text-[#4f7cff] text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 hover:bg-[#4f7cff]/20 transition-colors"
          >
            <RefreshCcw size={12} /> Thử lại
          </button>
        </div>
      )}
    </motion.div>
  );
}
