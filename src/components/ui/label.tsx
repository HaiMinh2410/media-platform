'use client';

import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-foreground-secondary mb-2 leading-none ${className || ''}`}
      {...props}
    />
  );
}
