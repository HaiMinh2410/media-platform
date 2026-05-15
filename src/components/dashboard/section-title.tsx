import React from 'react';

interface SectionTitleProps {
  icon: string;
  label: string;
}

export function SectionTitle({ icon, label }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-lg">{icon}</span>
      <h2 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-grow h-[1px] bg-base-300" />
    </div>
  );
}
