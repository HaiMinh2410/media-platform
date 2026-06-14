import { cn } from "@shared/lib";
import { PortalTooltip, RangeSelector } from "@shared/ui";

import React, { useRef, useState, useEffect } from 'react';
import { Info, X, Plus } from 'lucide-react';
import { useInboxStore } from '../../../store/inbox.store';

interface TagManagerProps {
  workspaceId: string;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
  setIsManageTagsOpen: (isOpen: boolean) => void;
}

export function TagManager({ workspaceId, tags, onUpdateTags, setIsManageTagsOpen }: TagManagerProps) {
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const [isMounted, setIsMounted] = useState(false);
  
  const tagTriggerRef = useRef<HTMLDivElement>(null);
  const tagTooltipAnchorRef = useRef<HTMLDivElement>(null);
  
  const [isTagTooltipOpen, setIsTagTooltipOpen] = useState(false);
  
  const { availableTags, setAvailableTags } = useInboxStore();

  useEffect(() => {
    const fetchTags = async () => {
      if (!workspaceId || workspaceId === 'all') return;
      try {
        const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
        const json = await res.json();
        if (json.data) setAvailableTags(json.data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    
    if (availableTags.length === 0) {
      fetchTags();
    }
  }, [workspaceId, availableTags.length, setAvailableTags]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isTagDropdownOpen && tagTriggerRef.current) {
      const rect = tagTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownPosition(spaceBelow < 320 ? 'top' : 'bottom');
    }
  }, [isTagDropdownOpen]);

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  const toggleTag = (tag: string) => {
    const triggerRefresh = useInboxStore.getState().triggerRefresh;
    const { name: newTagName } = parseTag(tag);
    const hasBlocked = tags.some(t => parseTag(t).name === 'Bị chặn');
    const hasPriority = tags.some(t => parseTag(t).name === 'Ưu tiên');
    const hasRestricted = tags.some(t => parseTag(t).name === 'Hạn chế');

    if (tags.some(t => parseTag(t).name === newTagName)) {
      onUpdateTags(tags.filter(t => parseTag(t).name !== newTagName));
      triggerRefresh();
      return;
    }

    if (hasBlocked) {
      alert('Tài khoản đã bị chặn, không thể thêm nhãn khác.');
      return;
    }

    if (newTagName === 'Bị chặn' && tags.length > 0) {
      if (confirm('Khi gắn nhãn "Bị chặn", các nhãn khác sẽ bị gỡ bỏ. Tiếp tục?')) {
        onUpdateTags([tag]);
        triggerRefresh();
      }
      return;
    }

    if (newTagName === 'Ưu tiên' && hasRestricted) {
      alert('Không thể gắn nhãn "Ưu tiên" khi đã có nhãn "Hạn chế".');
      return;
    }

    if (newTagName === 'Hạn chế' && hasPriority) {
      alert('Không thể gắn nhãn "Hạn chế" khi đã có nhãn "Ưu tiên".');
      return;
    }

    onUpdateTags([...tags, tag]);
    triggerRefresh();
  };

  const unappliedTags = availableTags.filter((at: string) => 
    !tags.some(t => parseTag(t).name === parseTag(at).name) &&
    parseTag(at).name !== 'Bị chặn'
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-base-content/50 flex items-center gap-2">
          Nhãn 
          <div
            ref={tagTooltipAnchorRef}
            onMouseEnter={() => setIsTagTooltipOpen(true)}
            onMouseLeave={() => setIsTagTooltipOpen(false)}
            className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors flex items-center"
          >
            <Info size={14} />
          </div>
          <PortalTooltip
            active={isMounted && isTagTooltipOpen}
            anchorRef={tagTooltipAnchorRef}
            showArrow
            position="top"
            align="left"
            className="w-72 text-xs font-normal leading-relaxed text-base-content"
          >
            <div className="space-y-1 p-0.5">
              <p className="font-bold text-base-content">Nhãn hội thoại</p>
              <p className="text-base-content/60">
                Gắn nhãn giúp phân loại các cuộc hội thoại để dễ dàng quản lý, lọc và tìm kiếm theo chủ đề hoặc trạng thái.
              </p>
            </div>
          </PortalTooltip>
        </h3>
        <span 
          className="text-sm text-primary cursor-pointer hover:underline"
          onClick={() => setIsManageTagsOpen(true)}
        >
          Quản lý nhãn
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map(tag => {
            const { name, color } = parseTag(tag);
            return (
              <span 
                key={tag} 
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: `${color}15`, 
                  color: color,
                  border: `1px solid ${color}30`
                }}
              >
                {name}
                <X 
                  size={12} 
                  className="cursor-pointer opacity-50 hover:opacity-100 hover:text-red-400 transition-all" 
                  onClick={() => toggleTag(tag)}
                />
              </span>
            );
          })
        ) : (
          <p className="text-xs text-base-content/40 italic my-2">
            Chưa có nhãn nào được gắn
          </p>
        )}
      </div>

      <RangeSelector
        ref={tagTriggerRef}
        isOpen={isTagDropdownOpen}
        onOpenChange={setIsTagDropdownOpen}
        position={dropdownPosition}
        className="w-full mt-2"
        menuMinWidth="w-full min-w-full"
        dropdownClassName="bg-base-100 rounded-xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col p-1.5 gap-0.5 w-full left-0 right-0"
        customTrigger={
          <div 
            className="flex items-center justify-between w-full p-2.5 bg-base-200 border border-base-content/10 rounded-lg text-sm text-base-content cursor-pointer transition-all hover:bg-base-300 hover:border-primary"
          >
            <span>Thêm nhãn</span>
            <Plus size={16} />
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-base-content/10 flex flex-col gap-0.5">
          {unappliedTags.length > 0 ? (
            unappliedTags.map((tag: string) => {
              const { name, color } = parseTag(tag);
              return (
                <div 
                  key={tag} 
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-base-content/5"
                  onClick={() => {
                    toggleTag(tag);
                    setIsTagDropdownOpen(false);
                  }}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="font-bold text-sm text-base-content truncate">{name}</span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-base-content/40 italic">Không còn nhãn nào để thêm</div>
          )}
        </div>
      </RangeSelector>
    </div>
  );
}
