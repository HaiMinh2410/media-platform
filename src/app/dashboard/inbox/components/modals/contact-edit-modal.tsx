'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-base-200 w-full max-w-[500px] rounded-2xl overflow-hidden shadow-2xl border border-foreground/10 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex justify-between items-center border-b border-foreground/10 bg-foreground/[0.02]">
          <h2 className="text-lg font-semibold text-foreground m-0">Chỉnh sửa thông tin liên hệ</h2>
          <button 
            className="p-1.5 rounded-lg text-foreground-tertiary hover:bg-foreground/5 hover:text-foreground transition-all"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          <div className="flex justify-center mb-2">
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-background-tertiary flex items-center justify-center border-3 border-foreground/10 shadow-xl">
              {initialData.avatar ? (
                <img src={initialData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[2rem] text-foreground-tertiary">{initialData.name?.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground-secondary">
              Số điện thoại <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
            </label>
            <div className="flex gap-3">
              <select className="w-[120px] px-3 py-2.5 bg-background-secondary border border-foreground/10 rounded-xl text-[0.9375rem] text-foreground outline-none cursor-pointer focus:border-accent-primary transition-all">
                <option value="+1">+1</option>
                <option value="+84">+84</option>
              </select>
              <input
                type="text"
                name="phone"
                className="flex-1 px-3 py-2.5 bg-background-secondary border border-foreground/10 rounded-xl text-[0.9375rem] text-foreground outline-none focus:border-accent-primary focus:bg-background-tertiary focus:ring-4 focus:ring-accent-primary/10 transition-all"
                placeholder=""
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground-secondary">
              Email <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2.5 bg-background-secondary border border-foreground/10 rounded-xl text-[0.9375rem] text-foreground outline-none focus:border-accent-primary focus:bg-background-tertiary focus:ring-4 focus:ring-accent-primary/10 transition-all"
              placeholder=""
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground-secondary">
              Ngày sinh <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
            </label>
            <div className="flex gap-3">
              <select
                name="birthdayMonth"
                className="flex-1 px-3 py-2.5 bg-background-secondary border border-foreground/10 rounded-xl text-[0.9375rem] text-foreground outline-none cursor-pointer focus:border-accent-primary transition-all"
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
                className="flex-1 px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-[0.9375rem] text-white outline-none cursor-pointer focus:border-sky-500 transition-all"
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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground-secondary">
              Địa chỉ <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
            </label>
            <input
              type="text"
              name="address"
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-[0.9375rem] text-white outline-none focus:border-sky-500 focus:bg-black/30 focus:ring-4 focus:ring-sky-500/10 transition-all"
              placeholder=""
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground-secondary">
              Tỉnh/Thành phố <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
            </label>
            <input
              type="text"
              name="city"
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-[0.9375rem] text-white outline-none focus:border-sky-500 focus:bg-black/30 focus:ring-4 focus:ring-sky-500/10 transition-all"
              placeholder=""
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-semibold text-foreground-secondary">
                Tiểu bang <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
              </label>
              <input
                type="text"
                name="state"
                className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-[0.9375rem] text-white outline-none focus:border-sky-500 focus:bg-black/30 focus:ring-4 focus:ring-sky-500/10 transition-all"
                placeholder=""
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-semibold text-gray-200">
                Mã zip/Mã bưu chính <span className="font-normal text-foreground-tertiary text-xs ml-1">· Không bắt buộc</span>
              </label>
              <input
                type="text"
                name="zipCode"
                className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-[0.9375rem] text-white outline-none focus:border-sky-500 focus:bg-black/30 focus:ring-4 focus:ring-sky-500/10 transition-all"
                placeholder=""
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-foreground/10 flex justify-end gap-3 bg-background-tertiary">
          <button 
            className="px-6 py-2.5 border border-foreground/10 bg-transparent text-foreground-secondary text-sm font-medium rounded-xl cursor-pointer transition-all hover:bg-foreground/5 hover:text-foreground hover:border-foreground/20 active:scale-[0.98]" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            className="px-8 py-2.5 border-none bg-gradient-to-br from-sky-500 to-sky-600 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-sky-500/20 hover:-translate-y-px hover:shadow-sky-500/30 hover:brightness-110 active:translate-y-0" 
            onClick={handleSave}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
