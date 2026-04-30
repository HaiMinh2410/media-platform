import React from 'react';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={cn('text-blue-500', className)}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('text-pink-500', className)}
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case 'whatsapp':
      return <MessageCircle className={cn('text-green-500', className)} size={size} />;
    case 'tiktok':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={cn('text-foreground', className)}
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a6.738 6.738 0 0 1-1.9 4.63c-1.24 1.25-2.98 2.04-4.8 2.05-2.07.02-4.11-.8-5.46-2.38-1.35-1.57-1.85-3.76-1.33-5.77.53-2.01 2.1-3.69 4.11-4.29 1.15-.35 2.37-.3 3.51.05v4.06a3.14 3.14 0 0 0-3.6 2.31c-.34 1.35.1 2.87 1.11 3.79 1.01.92 2.58 1.05 3.72.3 1.14-.75 1.74-2.12 1.54-3.47.01-4.52-.01-9.04.01-13.56a9.14 9.14 0 0 1 1.4-.04Z" />
        </svg>
      );
    default:
      return <MoreHorizontal className={cn('text-fg-tertiary', className)} size={size} />;
  }
};
