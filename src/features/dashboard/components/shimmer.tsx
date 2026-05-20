import React from 'react';

interface ShimmerProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({ 
  width = '100%', 
  height = '14px', 
  className = '' 
}) => {
  return (
    <div 
      className={`relative overflow-hidden bg-base-300/50 rounded-md ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-base-content/10 to-transparent" 
           style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
};
