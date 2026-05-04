import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInboxStore } from '../../../store/inbox.store';

interface TagManagerProps {
  workspaceId: string;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
  setIsManageTagsOpen: (isOpen: boolean) => void;
}

export function TagManager({ workspaceId, tags, onUpdateTags, setIsManageTagsOpen }: TagManagerProps) {
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const [isMounted, setIsMounted] = useState(false);
  
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current && 
        !tagDropdownRef.current.contains(event.target as Node) &&
        (!tagMenuRef.current || !tagMenuRef.current.contains(event.target as Node))
      ) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  const toggleTagDropdown = () => {
    if (!isTagDropdownOpen && tagDropdownRef.current) {
      const rect = tagDropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setDropdownDirection(spaceBelow < 300 ? 'up' : 'down');
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
    setIsTagDropdownOpen(!isTagDropdownOpen);
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
        <h3 className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider flex items-center gap-1">
          Nhãn <Info size={14} className="text-foreground-tertiary cursor-help" />
        </h3>
        <span 
          className="text-xs text-accent-primary cursor-pointer hover:underline"
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
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-13 font-medium transition-all"
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
          <p className="text-xs text-foreground-tertiary italic my-2">
            Chưa có nhãn nào được gắn
          </p>
        )}
      </div>

      <div className="relative w-full mt-2" ref={tagDropdownRef}>
        <div 
          className="flex items-center justify-between w-full p-2.5 bg-background-secondary border border-foreground/10 rounded-lg text-sm text-foreground cursor-pointer transition-all hover:bg-background-tertiary hover:border-accent-primary"
          onClick={toggleTagDropdown}
        >
          <span>Thêm nhãn</span>
          <Plus size={16} />
        </div>

        {isTagDropdownOpen && isMounted && createPortal(
          <div 
            ref={tagMenuRef}
            className={cn(
              "fixed bg-base-200 border border-foreground/10 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col",
              dropdownDirection === 'up' && "mb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            )}
            style={{
              top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
              bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-foreground/10">
              {unappliedTags.length > 0 ? (
                unappliedTags.map((tag: string) => {
                  const { name, color } = parseTag(tag);
                  return (
                    <div 
                      key={tag} 
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-foreground/5"
                      onClick={() => {
                        toggleTag(tag);
                        setIsTagDropdownOpen(false);
                      }}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }} 
                      />
                      <span className="font-bold text-sm text-foreground">{name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-13 text-foreground-tertiary italic">Không còn nhãn nào để thêm</div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
