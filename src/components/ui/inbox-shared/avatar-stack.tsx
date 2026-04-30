import React from 'react';
import { cn } from '@/lib/utils';
import { PlatformIcon } from './platform-icon';

type AvatarStackProps = {
  mainAvatar?: string | null;
  platforms: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const AvatarStack: React.FC<AvatarStackProps> = ({ 
  mainAvatar, 
  platforms, 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const badgeSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn(
        "rounded-2xl overflow-hidden bg-bg-tertiary border border-glass-border flex items-center justify-center",
        sizeClasses[size]
      )}>
        {mainAvatar ? (
          <img src={mainAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-fg-tertiary">
             <PlatformIcon platform="unknown" size={size === 'lg' ? 24 : 16} />
          </div>
        )}
      </div>
      
      {/* Platform Badge(s) */}
      <div className="absolute -bottom-1 -right-1 flex -space-x-1">
        {platforms.slice(0, 3).map((platform, idx) => (
          <div 
            key={idx}
            className={cn(
              "rounded-full bg-bg-primary border border-glass-border flex items-center justify-center shadow-lg",
              badgeSize
            )}
            style={{ zIndex: 10 - idx }}
          >
            <PlatformIcon platform={platform} size={size === 'sm' ? 8 : 10} />
          </div>
        ))}
      </div>
    </div>
  );
};
