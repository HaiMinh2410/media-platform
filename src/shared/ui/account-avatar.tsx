import React from 'react';
import { PlatformIcon } from './inbox-shared/platform-icon';
import { cn } from '@shared/lib';

interface AccountAvatarProps {
  avatarUrl?: string;
  name: string;
  platform: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number | string; // size preset or custom values (e.g. 10 maps to 'size-10' class)
  showPlatformIcon?: boolean;
  className?: string;
  avatarClassName?: string;
  emblemSize?: number | string; // size of the platform emblem container (e.g. 4 maps to 'size-4' class)
  platformIconSize?: number; // size of the PlatformIcon SVG inside the emblem
}

const PRESETS = {
  sm: { size: 8, emblemSize: 4, platformIconSize: 10 },
  md: { size: 10, emblemSize: 4, platformIconSize: 12 },
  lg: { size: 12, emblemSize: 5, platformIconSize: 14 },
  xl: { size: 16, emblemSize: 6, platformIconSize: 16 },
} as const;

export function AccountAvatar({
  avatarUrl,
  name,
  platform,
  size = 'md',
  showPlatformIcon = true,
  className = '',
  avatarClassName = '',
  emblemSize,
  platformIconSize,
}: AccountAvatarProps) {
  // Generate fallback UI avatar if avatarUrl is falsy
  const displayAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`;

  // Determine if size is a preset
  const isPreset = size === 'sm' || size === 'md' || size === 'lg' || size === 'xl';
  const preset = isPreset ? PRESETS[size as keyof typeof PRESETS] : null;

  // Resolve final values
  const finalSize = isPreset ? preset!.size : size;
  const finalEmblem = emblemSize !== undefined ? emblemSize : (isPreset ? preset!.emblemSize : 4);
  const finalPlatformIconSize = platformIconSize !== undefined ? platformIconSize : (isPreset ? preset!.platformIconSize : 10);

  // Define static size mapping to allow Tailwind to compile these classes
  const sizeMap: Record<number, string> = {
    6: 'size-6',
    8: 'size-8',
    10: 'size-10',
    12: 'size-12',
    14: 'size-14',
    16: 'size-16',
    18: 'size-18',
    20: 'size-20',
  };

  // Define static size mapping for emblem container to allow Tailwind compilation
  const emblemSizeMap: Record<number | string, string> = {
    3: 'size-3',
    3.5: 'size-3.5',
    4: 'size-4',
    5: 'size-5',
    6: 'size-6',
    7: 'size-7',
  };

  // Determine size classes
  const sizeClass = typeof finalSize === 'number' ? (sizeMap[finalSize] || `size-${finalSize}`) : finalSize;

  // Determine emblem class
  const finalEmblemClass = typeof finalEmblem === 'number' 
    ? (emblemSizeMap[finalEmblem] || `size-${finalEmblem}`) 
    : finalEmblem;

  return (
    <div className={cn("relative shrink-0", sizeClass, className)}>
      <img
        src={displayAvatar}
        alt={name}
        className={cn("w-full h-full object-cover rounded-full border border-base-content/10", avatarClassName)}
      />
      {showPlatformIcon && (
        <div className={cn("absolute -bottom-1 -right-1 rounded-full bg-base-200 flex items-center justify-center border border-base-100 shadow-xs select-none", finalEmblemClass)}>
          <PlatformIcon platform={platform} size={finalPlatformIconSize} />
        </div>
      )}
    </div>
  );
}
