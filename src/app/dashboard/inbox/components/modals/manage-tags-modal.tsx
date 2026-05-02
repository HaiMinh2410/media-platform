'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Trash2, ChevronDown, Edit2, Check } from 'lucide-react';
import styles from './manage-tags-modal.module.css';
import clsx from 'clsx';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
];

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  tags,
  onUpdateTags
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAddColorPickerOpen, setIsAddColorPickerOpen] = useState(false);
  const [isEditColorPickerOpen, setIsEditColorPickerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!isOpen) return null;

  const parseTag = (tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const tagName = newTagName.trim();
      if (!tags.some(t => parseTag(t).name === tagName)) {
        onUpdateTags([...tags, `${tagName}::${selectedColor}`]);
        setNewTagName('');
      }
    }
  };

  const handleDeleteTag = (tagName: string) => {
    onUpdateTags(tags.filter(t => t !== tagName));
  };

  const handleStartEdit = (tag: string) => {
    const { name, color } = parseTag(tag);
    setEditingTag(tag);
    setEditValue(name);
    setEditColor(color);
  };

  const handleSaveEdit = () => {
    if (editingTag && editValue.trim()) {
      const newTag = `${editValue.trim()}::${editColor}`;
      onUpdateTags(tags.map(t => t === editingTag ? newTag : t));
      setEditingTag(null);
    } else {
      setEditingTag(null);
    }
  };

  const filteredTags = tags.filter(tag => 
    parseTag(tag).name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Quản lý nhãn tùy chỉnh</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.description}>
            Dùng nhãn để mô tả và sắp xếp mọi người theo bất kỳ cách nào bạn muốn, chẳng hạn như kiểu khách hàng hoặc các đơn đặt hàng trước đó. Chỉ những người quản lý Trang của bạn mới có thể nhìn thấy nhãn.
          </p>

          <div className={styles.addTagSection}>
            <div className={styles.colorPickerWrapper}>
              <div 
                className={styles.colorPicker} 
                style={{ borderColor: selectedColor, background: `${selectedColor}10` }}
                onClick={() => setIsAddColorPickerOpen(!isAddColorPickerOpen)}
              >
                <div className={styles.colorDot} style={{ backgroundColor: selectedColor }} />
                <ChevronDown size={14} style={{ color: selectedColor }} />
              </div>
              
              {isAddColorPickerOpen && (
                <div className={styles.colorPopover}>
                  {PRESET_COLORS.map(color => (
                    <div 
                      key={color}
                      className={clsx(styles.colorOption, selectedColor === color && styles.colorOptionActive)}
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
              className={styles.tagInput}
              placeholder="Đặt tên nhãn..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button 
              className={styles.addBtn}
              onClick={handleAddTag}
              disabled={!newTagName.trim()}
              style={{ backgroundColor: selectedColor }}
            >
              Thêm nhãn
            </button>
          </div>

          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.tagList}>
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => {
                const { name, color } = parseTag(tag);
                const isEditing = editingTag === tag;
                
                return (
                  <div key={tag} className={styles.tagItem}>
                    <div className={styles.tagContent}>
                      {isEditing ? (
                        <div className={styles.editControls}>
                          <div className={styles.colorPickerWrapper}>
                            <div 
                              className={styles.colorPickerSmall} 
                              style={{ backgroundColor: editColor }}
                              onClick={() => setIsEditColorPickerOpen(!isEditColorPickerOpen)}
                            />
                            {isEditColorPickerOpen && editingTag === tag && (
                              <div className={styles.colorPopoverSmall}>
                                {PRESET_COLORS.map(c => (
                                  <div 
                                    key={c}
                                    className={clsx(styles.colorOptionSmall, editColor === c && styles.colorOptionActive)}
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
                            className={styles.editInput}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <div className={styles.colorDot} style={{ backgroundColor: color, width: '20px', height: '20px' }} />
                          <span className={styles.tagName}>{name}</span>
                        </>
                      )}
                    </div>
                    <div className={styles.tagActions}>
                      {isEditing ? (
                        <button 
                          className={styles.actionBtnActive}
                          onClick={handleSaveEdit}
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleStartEdit(tag)}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        className={clsx(styles.actionBtn, styles.deleteBtn)}
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '20px' }}>
                {searchQuery ? 'Không tìm thấy nhãn phù hợp' : 'Chưa có nhãn nào'}
              </p>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.doneBtn} onClick={onClose}>Xong</button>
        </div>
      </div>
    </div>
  );
};
