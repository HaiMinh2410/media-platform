import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Lead } from './types';

interface LeadCardProps {
  lead: Lead;
}

// Icon Messenger chính thức cực kỳ đẹp mắt
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="text-[#0084FF] shrink-0">
    <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.913 1.448 5.501 3.7 7.208V22l3.39-1.859c.92.256 1.895.395 2.91.395 5.523 0 10-4.146 10-9.243S17.523 2 12 2zm1.26 12.15l-2.48-2.65-4.83 2.65 5.3-5.63 2.53 2.7 4.73-2.7-5.25 5.63z" />
  </svg>
);

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <div 
      className="bg-base-100 rounded-xl p-3 border border-base-200 dark:border-base-800 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-sm hover:border-sky-300 dark:hover:border-sky-800 shadow-3xs group active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        {/* Avatar có đè Messenger icon ở góc dưới bên phải */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-base-300 bg-linear-to-tr from-sky-100 to-indigo-100 text-sky-700 flex items-center justify-center font-bold text-sm">
            {lead.avatar ? (
              <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
            ) : (
              <span>{lead.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {/* Huy hiệu Messenger */}
          {lead.platform === 'messenger' && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-base-200 rounded-full p-0.5 shadow-2xs border border-base-200 dark:border-base-800 flex items-center justify-center">
              <MessengerIcon />
            </div>
          )}
        </div>

        {/* Thông tin khách hàng */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-xs md:text-sm font-bold text-base-content leading-tight truncate">
            {lead.name}
          </div>
          {/* Badge nguồn */}
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded text-[10px] font-semibold w-max">
            {lead.source}
          </span>
        </div>
      </div>

      {/* Nút Ba chấm (luôn hiển thị) */}
      <button className="btn btn-xs btn-ghost btn-square rounded-lg text-base-content/50 hover:text-base-content/80 hover:bg-base-200 shrink-0">
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}
