'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, BarChart3, Calendar, Sparkles, RefreshCw, 
  TrendingUp, TrendingDown 
} from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export type ActiveMetric = 'reach' | 'views' | 'engagement' | 'followers';

export function SkeletonChart() {
  return (
    <div className="w-full h-[350px] bg-white/[0.02] rounded-xl border border-white/5 animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent shimmer" />
      <div className="absolute bottom-10 left-10 right-10 top-10 flex flex-col justify-between">
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
        <div className="w-full h-[1px] bg-white/5"></div>
      </div>
    </div>
  );
}

export function InsufficientDataState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed text-center min-h-[400px] mt-6"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative p-6 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
          <Icon lucide={Users} size={40} className="text-blue-400" />
        </div>
        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1.5 shadow-lg animate-bounce">
          <Icon lucide={Sparkles} size={12} className="text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Tài khoản đang được tối ưu</h3>
      <p className="text-white/50 max-w-md leading-relaxed mb-8 text-sm">
        Meta Graph API yêu cầu tài khoản có ít nhất <span className="text-blue-400 font-bold">100 followers</span> để cung cấp các số liệu nhân khẩu học và thói quen hoạt động của người theo dõi.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
        {[
          { label: 'Followers', val: '< 100', icon: Users, color: 'text-blue-400' },
          { label: 'Nhân khẩu học', val: 'Khóa', icon: BarChart3, color: 'text-white/20' },
          { label: 'Hoạt động', val: 'Khóa', icon: Calendar, color: 'text-white/20' }
        ].map((item, i) => (
          <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
            <Icon lucide={item.icon} size={16} className={`${item.color} mb-2`} />
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{item.label}</div>
            <div className="text-sm font-bold text-white">{item.val}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ReauthNotice() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Icon lucide={TrendingDown} size={20} className="text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Token kết nối đã hết hạn hoặc bị thu hồi</h4>
          <p className="text-xs text-white/50">Vui lòng kết nối lại tài khoản Instagram của bạn để tiếp tục đồng bộ dữ liệu live theo thời gian thực.</p>
        </div>
      </div>
      <Link 
        href="/dashboard/settings/accounts"
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 no-underline"
      >
        <Icon lucide={RefreshCw} size={14} />
        Kết nối lại ngay
      </Link>
    </motion.div>
  );
}

interface TooltipPayload {
  payload: Record<string, string | number>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  activeMetric: ActiveMetric;
}

export function CustomTooltip({ active, payload, label, activeMetric }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Record<string, string | number>;
    
    const getMetricLabel = (m: string) => {
      switch(m) {
        case 'reach': return 'Reach';
        case 'views': return 'Views';
        case 'engagement': return 'Engagement';
        case 'followers': return 'Followers';
        default: return m;
      }
    };

    const getMetricColor = (m: string) => {
      switch(m) {
        case 'reach': return 'bg-blue-500';
        case 'views': return 'bg-purple-500';
        case 'engagement': return 'bg-emerald-500';
        case 'followers': return 'bg-orange-500';
        default: return 'bg-white';
      }
    };

    const prevKey = `prev${activeMetric.charAt(0).toUpperCase()}${activeMetric.slice(1)}`;
    const val = Number(data[activeMetric]) || 0;
    const prevValue = Number(data[prevKey]) || 0;
    
    const trend = prevValue > 0 ? ((val - prevValue) / prevValue) * 100 : 0;
    const isPositive = trend > 0;
    const absDiff = val - prevValue;

    return (
      <div className="custom-tooltip">
        <div className="tooltip-date">
          <Icon lucide={Calendar} size={10} />
          {label}
        </div>
        <div className="tooltip-items">
          <div className="tooltip-item">
            <div className="tooltip-item-label">
              <div className={`tooltip-item-dot ${getMetricColor(activeMetric)}`} />
              <span>{getMetricLabel(activeMetric)}</span>
            </div>
            <div className="tooltip-values">
              <div className="flex items-center gap-2">
                <span className="tooltip-value-current">{val.toLocaleString()}</span>
                {absDiff !== 0 && (
                  <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    <Icon lucide={isPositive ? TrendingUp : TrendingDown} size={10} />
                    <span>{isPositive ? '+' : ''}{absDiff.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {prevValue > 0 && (
                <div className="flex flex-col mt-1">
                  <span className="tooltip-value-previous">Kỳ trước: {prevValue.toLocaleString()}</span>
                  <span className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-red-400'} font-medium`}>
                    ({isPositive ? '+' : ''}{trend.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
