'use client';

import { cn } from "@shared/lib";

import React from 'react';
import { PostStatus } from '@features/posts/types';
import { Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className: 'bg-base-200 text-base-content/70 border-base-content/5',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-info/10 text-info border-info/20',
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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
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
