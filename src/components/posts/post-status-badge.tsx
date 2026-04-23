'use client';

import React from 'react';
import { PostStatus } from '@/domain/types/posts';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className: 'bg-slate-800 text-slate-400 border-slate-700',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-blue-600/10 text-blue-400 border-blue-500/30',
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    className: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-red-600/10 text-red-400 border-red-500/30',
  },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
      config.className
    )}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}
