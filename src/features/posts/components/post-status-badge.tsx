'use client';

import { cn } from "@shared/lib";

import React from 'react';
import { PostStatus } from '@features/posts/types';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-info/80 text-base-content',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-warning/80 text-base-content animate-pulse',
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    className: 'bg-success/80 text-base-content',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-error/80 text-base-content',
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
      "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors",
      config.className
    )}>
      <Icon size={13} />
      {config.label}
    </div>
  );
}
