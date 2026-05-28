import React from 'react';
import { Info } from 'lucide-react';

export function LeadsStats() {
  return (
    <div className="bg-[#f0f6ff] dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/20 rounded-xl py-3 px-5 flex flex-col md:flex-row justify-between items-center w-full gap-4 shadow-3xs">
      {/* 3 chỉ số bên trái */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1 text-xs md:text-sm text-sky-900 dark:text-sky-300">
        
        {/* Chỉ số 1: Tiếp nhận */}
        <div className="flex items-center gap-1.5">
          <span className="opacity-80">Số khách hàng tiềm năng ở giai đoạn tiếp nhận:</span>
          <span className="font-bold text-sky-950 dark:text-sky-100 text-sm">3</span>
          <Info size={13} className="text-sky-500/80 cursor-pointer shrink-0" />
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-sky-900 hidden md:block" />

        {/* Chỉ số 2: Đã chuyển đổi */}
        <div className="flex items-center gap-1.5">
          <span className="opacity-80">Số khách hàng tiềm năng đã chuyển đổi:</span>
          <span className="font-bold text-sky-950 dark:text-sky-100 text-sm">--</span>
          <Info size={13} className="text-sky-500/80 cursor-pointer shrink-0" />
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-sky-900 hidden md:block" />

        {/* Chỉ số 3: Tỷ lệ chuyển đổi */}
        <div className="flex items-center gap-1.5">
          <span className="opacity-80">Tỷ lệ chuyển đổi:</span>
          <span className="font-bold text-sky-950 dark:text-sky-100 text-sm">--</span>
          <Info size={13} className="text-sky-500/80 cursor-pointer shrink-0" />
        </div>

      </div>

      {/* Nút Xem tất cả bên phải */}
      <button className="text-[#0064d2] hover:text-[#0052ad] text-xs font-bold transition-all shrink-0 hover:underline">
        Xem tất cả
      </button>
    </div>
  );
}
