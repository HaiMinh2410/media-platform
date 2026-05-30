'use client';

import { cn } from "@shared/lib";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Check, Edit2, GripVertical } from 'lucide-react';
import { AccountGroup } from '@features/settings';
import { CombinedAvatar } from './combined-avatar';

interface ReorderItemProps {
  group: AccountGroup;
  selectedGroupId: string | null;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
}

export function ReorderItem({
  group,
  selectedGroupId,
  isSelectionMode,
  isSelected,
  onSelect,
  onActivate,
}: ReorderItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "flex items-center gap-3 w-full p-[10px_12px] rounded-md border-none bg-transparent text-foreground-secondary cursor-pointer transition-all duration-150 text-left hover:bg-foreground/5 hover:text-foreground group",
        selectedGroupId === group.id && !isSelectionMode && "bg-primary/10 text-foreground",
        isSelectionMode && isSelected && "bg-primary/5"
      )}
    >
      <div
        className="flex items-center gap-3 flex-1"
        onClick={() => {
          if (isSelectionMode) {
            onSelect(group.id);
          } else {
            onActivate(group.id);
          }
        }}
      >
        {isSelectionMode && (
          <div className={cn(
            "w-[18px] h-[18px] rounded-[5px] border-2 border-foreground/10 flex items-center justify-center transition-all shrink-0",
            isSelected && "bg-primary border-primary"
          )}>
            {isSelected && <Check size={10} className="text-primary-content" />}
          </div>
        )}
        <CombinedAvatar group={group} unreadCount={group.unreadCount} />
        <span className="flex-1 text-sm font-medium">{group.name}</span>
        {!isSelectionMode && selectedGroupId === group.id && <Check size={14} className="text-primary" />}
      </div>

      <div className="flex items-center gap-1">
        {isSelectionMode && isSelected && (
          <button className="w-6 h-6 rounded-md flex items-center justify-center bg-foreground/5 border border-foreground/10 text-foreground-secondary cursor-pointer transition-all hover:bg-foreground/10 hover:text-foreground" onClick={(e) => {
            e.stopPropagation();
            alert('Tính năng Sửa đang được phát triển');
          }}>
            <Edit2 size={12} />
          </button>
        )}
        <div
          className="cursor-grab text-foreground-tertiary opacity-0 transition-opacity duration-200 p-1 rounded-md hover:bg-foreground/5 group-hover:opacity-50 hover:opacity-100 active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={14} />
        </div>
      </div>
    </Reorder.Item>
  );
}
