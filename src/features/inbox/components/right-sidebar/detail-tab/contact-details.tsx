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
        <h3 className="text-xs font-bold text-base-content/40 uppercase tracking-wider font-mono">Chi tiết liên hệ</h3>
        {hasContactInfo && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary cursor-pointer hover:underline font-mono" onClick={onEdit}>Chỉnh sửa</span>
            <span className="text-xs text-error cursor-pointer hover:underline font-mono" onClick={onDelete}>Xóa</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {hasContactInfo ? (
          <>
            <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-1 font-mono">Chi tiết đã thêm</p>
            {contactInfo?.phone && (
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Phone size={16} className="text-base-content/40" />
                <span className="truncate">{contactInfo.phone}</span>
              </div>
            )}
            {contactInfo?.email && (
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Mail size={16} className="text-base-content/40" />
                <span className="truncate">{contactInfo.email}</span>
              </div>
            )}
            {contactInfo?.birthday && (
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Cake size={16} className="text-base-content/40" />
                <span className="truncate">
                  {new Date(contactInfo.birthday).getDate()} tháng {new Date(contactInfo.birthday).getMonth() + 1}
                </span>
              </div>
            )}
            {contactInfo?.address && (
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Home size={16} className="text-base-content/40" />
                <span className="truncate">{contactInfo.address}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-base-content/40 leading-normal mb-1">Bổ sung chi tiết về người liên hệ này.</p>
            <button 
              className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-base-content/20 rounded-lg text-sm text-base-content/40 transition-all hover:border-base-content/40 hover:text-base-content/70 animate-none bg-transparent cursor-pointer" 
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
