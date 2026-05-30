import React from 'react';

interface SectionTitleProps {
  icon: string;
  label: string;
}

export function SectionTitle({ icon, label }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-lg">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest font-mono text-foreground-tertiary whitespace-nowrap">
        {label}
      </h2>
      <div className="grow h-px bg-foreground/10" />
    </div>
  );
}
