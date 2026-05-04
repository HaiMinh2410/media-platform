import React from 'react';
import { Phone, Mail, Cake, Home, Plus } from 'lucide-react';

interface ContactDetailsProps {
  contactInfo?: {
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactDetails({ contactInfo, onEdit, onDelete }: ContactDetailsProps) {
  const hasContactInfo = !!(contactInfo?.phone || contactInfo?.email || contactInfo?.address || contactInfo?.birthday);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider">Chi tiết liên hệ</h3>
        {hasContactInfo && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-accent-primary cursor-pointer hover:underline" onClick={onEdit}>Chỉnh sửa</span>
            <span className="text-xs text-red-400 cursor-pointer hover:underline" onClick={onDelete}>Xóa</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {hasContactInfo ? (
          <>
            <p className="text-11 font-bold text-foreground-tertiary uppercase tracking-wider mb-1">Chi tiết đã thêm</p>
            {contactInfo?.phone && (
              <div className="flex items-center gap-2 text-13 text-foreground-secondary">
                <Phone size={16} className="text-foreground-tertiary" />
                <span className="truncate">{contactInfo.phone}</span>
              </div>
            )}
            {contactInfo?.email && (
              <div className="flex items-center gap-2 text-13 text-foreground-secondary">
                <Mail size={16} className="text-foreground-tertiary" />
                <span className="truncate">{contactInfo.email}</span>
              </div>
            )}
            {contactInfo?.birthday && (
              <div className="flex items-center gap-2 text-13 text-foreground-secondary">
                <Cake size={16} className="text-foreground-tertiary" />
                <span className="truncate">
                  {new Date(contactInfo.birthday).getDate()} tháng {new Date(contactInfo.birthday).getMonth() + 1}
                </span>
              </div>
            )}
            {contactInfo?.address && (
              <div className="flex items-center gap-2 text-13 text-foreground-secondary">
                <Home size={16} className="text-foreground-tertiary" />
                <span className="truncate">{contactInfo.address}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-13 text-foreground-tertiary leading-normal mb-1">Bổ sung chi tiết về người liên hệ này.</p>
            <button 
              className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-white/20 rounded-lg text-13 text-foreground-tertiary transition-all hover:border-white/40 hover:text-foreground-secondary" 
              onClick={onEdit}
            >
              <Plus size={16} /> Thêm chi tiết
            </button>
          </>
        )}
      </div>
    </div>
  );
}
