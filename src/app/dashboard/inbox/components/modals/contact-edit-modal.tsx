'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './contact-edit-modal.module.css';

interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: {
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export function ContactEditModal({ isOpen, onClose, onSave, initialData }: ContactEditModalProps) {
  const [formData, setFormData] = useState({
    phone: initialData.phone || '',
    email: initialData.email || '',
    birthdayMonth: '',
    birthdayDay: '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Map camelCase to snake_case for backend
    const dataToSave = {
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      // Handle birthday if month and day are selected
      birthday: (formData.birthdayMonth && formData.birthdayDay) 
        ? new Date(2000, parseInt(formData.birthdayMonth) - 1, parseInt(formData.birthdayDay))
        : undefined
    };
    onSave(dataToSave);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Chỉnh sửa thông tin liên hệ</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarCircle}>
              {initialData.avatar ? (
                <img src={initialData.avatar} alt="Avatar" className={styles.avatarImg} />
              ) : (
                <span style={{ fontSize: '2rem', color: '#9ca3af' }}>{initialData.name?.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Số điện thoại <span className={styles.labelNote}>· Không bắt buộc</span>
            </label>
            <div className={styles.inputGroup}>
              <select className={styles.select} style={{ width: '120px' }}>
                <option value="+1">+1</option>
                <option value="+84">+84</option>
              </select>
              <input
                type="text"
                name="phone"
                className={styles.input}
                placeholder=""
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Email <span className={styles.labelNote}>· Không bắt buộc</span>
            </label>
            <input
              type="email"
              name="email"
              className={styles.input}
              placeholder=""
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Ngày sinh <span className={styles.labelNote}>· Không bắt buộc</span>
            </label>
            <div className={styles.row}>
              <select
                name="birthdayMonth"
                className={styles.select}
                style={{ flex: 1 }}
                value={formData.birthdayMonth}
                onChange={handleChange}
              >
                <option value="">Tháng</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                name="birthdayDay"
                className={styles.select}
                style={{ flex: 1 }}
                value={formData.birthdayDay}
                onChange={handleChange}
              >
                <option value="">Ngày</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Địa chỉ <span className={styles.labelNote}>· Không bắt buộc</span>
            </label>
            <input
              type="text"
              name="address"
              className={styles.input}
              placeholder=""
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Tỉnh/Thành phố <span className={styles.labelNote}>· Không bắt buộc</span>
            </label>
            <input
              type="text"
              name="city"
              className={styles.input}
              placeholder=""
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.label}>
                Tiểu bang <span className={styles.labelNote}>· Không bắt buộc</span>
              </label>
              <input
                type="text"
                name="state"
                className={styles.input}
                placeholder=""
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className={styles.label}>
                Mã zip/Mã bưu chính <span className={styles.labelNote}>· Không bắt buộc</span>
              </label>
              <input
                type="text"
                name="zipCode"
                className={styles.input}
                placeholder=""
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Hủy</button>
          <button className={styles.saveBtn} onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
