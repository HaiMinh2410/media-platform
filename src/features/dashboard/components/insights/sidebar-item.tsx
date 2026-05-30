import React from 'react';
import { cn } from '@shared/lib/utils';

export interface SidebarItemProps {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all w-full text-left cursor-pointer",
        active
          ? "bg-primary/10 text-primary"
          : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="line-clamp-1">{label}</span>
    </button>
  );
}
