'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Trash2, ChevronDown, Edit2 } from 'lucide-react';
import styles from './manage-tags-modal.module.css';
import clsx from 'clsx';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  tags,
  onUpdateTags
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (newTagName.trim() && !tags.includes(newTagName.trim())) {
      onUpdateTags([...tags, newTagName.trim()]);
      setNewTagName('');
    }
  };

  const handleDeleteTag = (tagName: string) => {
    onUpdateTags(tags.filter(t => t !== tagName));
  };

  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
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
            <div className={styles.colorPicker}>
              <div className={styles.colorDot} style={{ backgroundColor: selectedColor }} />
              <ChevronDown size={14} color="#6b7280" />
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
              disabled={!newTagName.trim() || tags.includes(newTagName.trim())}
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
              filteredTags.map(tag => (
                <div key={tag} className={styles.tagItem}>
                  <div className={styles.tagContent}>
                    <div className={styles.colorDot} style={{ backgroundColor: '#6366f1' }} />
                    <span 
                      className={styles.tagBadge}
                      style={{ 
                        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                  <div className={styles.tagActions}>
                    <button className={styles.actionBtn}>
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className={clsx(styles.actionBtn, styles.deleteBtn)}
                      onClick={() => handleDeleteTag(tag)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
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
