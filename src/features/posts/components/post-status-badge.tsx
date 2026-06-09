'use client';

import { cn } from "@shared/lib";

import React from 'react';
import { PostStatus } from '@features/posts/types';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-info/10 text-info border-info/20',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-warning/15 text-warning border-warning/20 animate-pulse',
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-error/10 text-error border-error/20',
  },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  // Nếu trạng thái không nằm trong cấu hình, không hiển thị badge
  if (!(status in STATUS_CONFIG)) {
    return null;
  }

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border transition-colors",
      config.className
    )}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}
