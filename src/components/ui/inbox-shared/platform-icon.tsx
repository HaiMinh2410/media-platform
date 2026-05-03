import React from 'react';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon, IconName } from '../icon';

export type PlatformIconProps = {
  platform: string;
  className?: string;
  size?: number;
};

export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className, size = 16 }) => {
  const platformKey = (platform || '').toLowerCase();
  
  switch (platformKey) {
    case 'messenger':
    case 'facebook':
      return <Icon name="facebook" size={size} className={cn('text-blue-500', className)} />;
    case 'instagram':
      return <Icon name="instagram" size={size} className={cn('text-pink-500', className)} />;
    case 'whatsapp':
      return <Icon lucide={MessageCircle} size={size} className={cn('text-green-500', className)} />;
    case 'tiktok':
      return <Icon name="tiktok" size={size} className={cn('text-foreground', className)} />;
    default:
      return <Icon lucide={MoreHorizontal} size={size} className={cn('text-foreground-tertiary', className)} />;
  }
};
