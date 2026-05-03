'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Trash2, ChevronDown, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useInboxStore } from '../../store/inbox.store';

interface ManageTagsModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
];

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAddColorPickerOpen, setIsAddColorPickerOpen] = useState(false);
  const [isEditColorPickerOpen, setIsEditColorPickerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const triggerRefresh = useInboxStore((state) => state.triggerRefresh);
  const setAvailableTags = useInboxStore((state) => state.setAvailableTags);

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.data) {
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: 'numeric' });
        const currentTodayTag = `Ngày hôm nay (${currentDate})`;
        
        const filtered = (json.data as string[]).filter(t => {
          const name = t.split('::')[0];
          // Exclude "Bị chặn"
          if (name === 'Bị chặn') return false;
          // Exclude old "Today" tags (keep only the current one)
          if (name.startsWith('Ngày hôm nay (') && name !== currentTodayTag) return false;
          return true;
        });
        
        setTags(filtered);
        setAvailableTags(json.data); // Sync all tags with global store including 'Bị chặn' and old 'Today' for filtering elsewhere
      }
    } catch (err) {
      console.error('Failed to fetch workspace tags:', err);
    }
  };

  React.useEffect(() => {
    if (isOpen && workspaceId) {
      fetchTags();
    }
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  const handleAddTag = async () => {
    const tagName = newTagName.trim();
    if (!tagName) return;

    if (tagName === 'Bị chặn') {
      toast.error('Không thể tạo nhãn hệ thống "Bị chặn" thủ công.');
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = tags.some(t => parseTag(t).name.toLowerCase() === tagName.toLowerCase());
    
    if (isDuplicate) {
      toast.error('Nhãn đã tồn tại');
      return;
    }

    try {
      await fetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ workspaceId, name: tagName, color: selectedColor }),
      });
      fetchTags();
      triggerRefresh();
      setNewTagName('');
      toast.success('Đã thêm nhãn mới');
    } catch (err) {
      console.error('Failed to add tag:', err);
      toast.error('Không thể thêm nhãn. Vui lòng thử lại.');
    }
  };

  const handleDeleteTag = async (tagString: string) => {
    const { name } = parseTag(tagString);
    if (!confirm(`Bạn có chắc chắn muốn xóa nhãn "${name}" khỏi toàn hệ thống?`)) return;
    try {
      await fetch(`/api/tags?workspaceId=${workspaceId}&name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      fetchTags();
      triggerRefresh();
      toast.success('Đã xóa nhãn');
    } catch (err) {
      console.error('Failed to delete tag:', err);
      toast.error('Không thể xóa nhãn.');
    }
  };

  const handleStartEdit = (tag: string) => {
    const { name, color } = parseTag(tag);
    setEditingTag(tag);
    setEditValue(name);
    setEditColor(color);
  };

  const handleSaveEdit = async () => {
    const newName = editValue.trim();
    if (editingTag && newName) {
      const { name: oldName } = parseTag(editingTag);
      
      if (newName === 'Bị chặn') {
        toast.error('Không thể đổi tên thành nhãn hệ thống "Bị chặn".');
        return;
      }

      // Check if new name already exists (excluding the current tag being edited)
      const isDuplicate = tags.some(t => {
        const { name } = parseTag(t);
        return t !== editingTag && name.toLowerCase() === newName.toLowerCase();
      });

      if (isDuplicate) {
        toast.error('Nhãn đã tồn tại');
        return;
      }

      try {
        await fetch('/api/tags', {
          method: 'PATCH',
          body: JSON.stringify({ 
            workspaceId, 
            oldName, 
            newName, 
            color: editColor 
          }),
        });
        fetchTags();
        triggerRefresh();
        setEditingTag(null);
        toast.success('Đã cập nhật nhãn');
      } catch (err) {
        console.error('Failed to update tag:', err);
        toast.error('Không thể cập nhật nhãn.');
      }
    } else {
      setEditingTag(null);
    }
  };

  const filteredTags = tags.filter(tag => 
    parseTag(tag).name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-base-200 w-full max-w-[520px] rounded-xl overflow-hidden shadow-2xl border border-foreground/10 flex flex-col max-h-[90vh] text-foreground"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex justify-between items-center border-b border-foreground/10">
          <h2 className="text-lg font-semibold m-0">Quản lý nhãn tùy chỉnh</h2>
          <button 
            className="p-1.5 rounded-lg text-foreground-tertiary hover:bg-foreground/5 hover:text-foreground transition-all"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <p className="text-sm text-foreground-tertiary leading-relaxed m-0">
            Dùng nhãn để mô tả và sắp xếp mọi người theo bất kỳ cách nào bạn muốn, chẳng hạn như kiểu khách hàng hoặc các đơn đặt hàng trước đó. Chỉ những người quản lý Trang của bạn mới có thể nhìn thấy nhãn.
          </p>

          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-lg p-3 flex items-center gap-3">
            <div className="relative">
              <div 
                className="flex items-center justify-center gap-1 px-2 py-1 bg-background-secondary border border-foreground/10 rounded-md cursor-pointer transition-all hover:border-foreground/20 hover:bg-foreground/5" 
                style={{ borderColor: `${selectedColor}40`, background: `${selectedColor}10` }}
                onClick={() => setIsAddColorPickerOpen(!isAddColorPickerOpen)}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedColor }} />
                <ChevronDown size={14} style={{ color: selectedColor }} />
              </div>
              
              {isAddColorPickerOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 bg-base-300 border border-foreground/10 rounded-lg p-2 grid grid-cols-4 gap-1.5 z-[100] shadow-2xl min-w-[120px]">
                  {PRESET_COLORS.map(color => (
                    <div 
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center border-2 border-transparent",
                        selectedColor === color && "border-white"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setSelectedColor(color);
                        setIsAddColorPickerOpen(false);
                      }}
                    >
                      {selectedColor === color && <Check size={14} color="#fff" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input 
              type="text" 
              className="flex-1 bg-background-secondary border border-foreground/10 rounded-md px-3 py-2 text-[0.9375rem] text-foreground outline-none focus:border-accent-primary transition-all"
              placeholder="Đặt tên nhãn..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button 
              className="px-5 py-2 bg-accent-primary text-white border-none rounded-md font-semibold text-[0.9375rem] cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
              onClick={handleAddTag}
              disabled={!newTagName.trim()}
              style={{ backgroundColor: selectedColor }}
            >
              Thêm nhãn
            </button>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <input 
              type="text" 
              className="w-full bg-background-secondary border border-foreground/10 rounded-md py-2 pl-10 pr-3 text-foreground text-[0.9375rem] outline-none focus:border-accent-primary transition-all"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => {
                const { name, color } = parseTag(tag);
                const isEditing = editingTag === tag;
                
                return (
                  <div key={tag} className="flex justify-between items-center py-3 px-1 border-b border-foreground/[0.05] last:border-0 group">
                    <div className="flex items-center gap-4 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div 
                              className="w-4 h-4 rounded-md cursor-pointer border border-foreground/20 transition-transform hover:scale-110" 
                              style={{ backgroundColor: editColor }}
                              onClick={() => setIsEditColorPickerOpen(!isEditColorPickerOpen)}
                            />
                            {isEditColorPickerOpen && editingTag === tag && (
                              <div className="absolute top-full left-0 bg-base-300 border border-foreground/10 rounded-lg p-2 grid grid-cols-4 gap-1.5 z-[110] shadow-2xl mt-1">
                                {PRESET_COLORS.map(c => (
                                  <div 
                                    key={c}
                                    className={cn(
                                      "w-[18px] h-[18px] rounded cursor-pointer flex items-center justify-center transition-transform hover:scale-110",
                                      editColor === c && "ring-2 ring-white ring-offset-1 ring-offset-base-300"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => {
                                      setEditColor(c);
                                      setIsEditColorPickerOpen(false);
                                    }}
                                  >
                                    {editColor === c && <Check size={12} color="#fff" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <input 
                            className="bg-foreground/5 border border-accent-primary rounded px-2 py-1 text-foreground text-xs outline-none w-[120px]"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[0.9375rem] text-foreground font-normal">{name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <button 
                          className="flex items-center justify-center p-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all"
                          onClick={handleSaveEdit}
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button 
                          className="flex items-center justify-center p-2 rounded-md bg-transparent border border-foreground/10 text-foreground-tertiary hover:bg-foreground/5 hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => handleStartEdit(tag)}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        className="flex items-center justify-center p-2 rounded-md bg-transparent border border-foreground/10 text-foreground-tertiary hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-foreground-tertiary text-sm mt-5">
                {searchQuery ? 'Không tìm thấy nhãn phù hợp' : 'Chưa có nhãn nào'}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-foreground/10 flex justify-end bg-background-tertiary">
          <button 
            className="px-6 py-2 bg-foreground text-background border-none rounded-md font-bold text-[0.9375rem] cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]" 
            onClick={onClose}
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
