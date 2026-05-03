import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function Card({ children, className, title, description }: CardProps) {
  return (
    <div className={`glass glass-shadow rounded-lg overflow-hidden ${className || ''}`}>
      {(title || description) && (
        <div className="p-md border-b border-white/5 bg-white/[0.02]">
          {title && <h3 className="text-lg font-bold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-foreground-secondary mt-1">{description}</p>}
        </div>
      )}
      <div className="p-md">{children}</div>
    </div>
  );
}
