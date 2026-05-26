import React from 'react';
import { Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS_MAP = {
  Whale: 'var(--color-status-warning)',    // Vàng Amber của hệ thống
  Luy: 'var(--color-accent-secondary)',    // Hồng Romantic của hệ thống
  Cool: 'var(--color-status-info)',        // Xanh Cyan của hệ thống
  Drainer: 'var(--color-status-error)',    // Đỏ cam của hệ thống
  Unknown: 'var(--color-foreground-tertiary)' // Xám nhạt
};

interface Script {
  id: string;
  name: string;
  fanType: string;
  usageCount: number;
  avgEmotion: number;
  conversionRate: number;
}

interface ScriptsPerformanceTableProps {
  filteredScripts: Script[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFanType: string;
  setSelectedFanType: (t: string) => void;
}

export function ScriptsPerformanceTable({
  filteredScripts,
  searchQuery,
  setSearchQuery,
  selectedFanType,
  setSelectedFanType
}: ScriptsPerformanceTableProps) {
  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="font-bold text-sm tracking-tight font-brand text-base-content">
              Bảng Hiệu Năng Kịch Bản (Scripts Performance)
            </h3>
          </div>
          <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
            Thống kê lượt sử dụng, điểm cải thiện thiện cảm cảm xúc và tỉ lệ chốt đơn của các template hội thoại.
          </p>
        </div>

        {/* Interactive filter & search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Tìm kịch bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-56 text-xs font-semibold rounded-xl bg-base-200 border border-base-content/10 focus:border-primary focus:bg-base-100 outline-none transition-all text-base-content shadow-inner"
            />
          </div>

          {/* Fan Type Filter */}
          <div className="flex items-center gap-0.5 bg-base-200 border border-base-content/10 rounded-xl p-1 shadow-inner">
            {['All', 'Luy', 'Cool', 'Whale', 'Drainer'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFanType(type)}
                className={`px-3 py-1.5 rounded-lg text-3xs font-extrabold tracking-wide uppercase transition-all ${
                  selectedFanType === type
                    ? 'bg-base-content/10 text-base-content shadow-xs'
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-300/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Dynamic Scripts Table representation */}
      <div className="overflow-x-auto border border-base-content/5 rounded-xl shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-base-200 border-b border-base-content/5 text-base-content/60 font-bold uppercase tracking-wider text-3xs">
              <th className="p-4 font-mono font-bold">Tên kịch bản</th>
              <th className="p-4 font-mono font-bold">Loại fan áp dụng</th>
              <th className="p-4 text-right font-mono font-bold">Lượt gửi thành công</th>
              <th className="p-4 text-right font-mono font-bold">Điểm cảm xúc TB</th>
              <th className="p-4 text-right font-mono font-bold">Tỉ lệ chốt đơn</th>
              <th className="p-4 text-center font-mono font-bold">Hiệu suất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-content/5">
            <AnimatePresence mode="popLayout">
              {filteredScripts.length > 0 ? (
                filteredScripts.map((script) => {
                   const color = COLORS_MAP[script.fanType as keyof typeof COLORS_MAP] || COLORS_MAP.Unknown;
                   const scoreWidth = `${script.avgEmotion * 100}%`;
                   const rateWidth = `${script.conversionRate * 100}%`;
                   
                   return (
                     <motion.tr
                        key={script.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-base-200/50 transition-colors cursor-pointer group"
                     >
                        <td className="p-4 font-semibold text-base-content flex items-center gap-2.5">
                          <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div>
                            <span className="group-hover:text-primary transition-colors duration-200">{script.name}</span>
                            <span className="text-3xs text-base-content/40 block mt-0.5 font-mono">{script.id}</span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-3xs font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color}, transparent 90%)`,
                              color: color,
                              border: `1px solid color-mix(in srgb, ${color}, transparent 85%)`
                            }}
                          >
                            {script.fanType}
                          </span>
                        </td>

                        <td className="p-4 text-right font-mono font-bold text-base-content">
                          {script.usageCount.toLocaleString()}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-base-content font-mono">{(script.avgEmotion * 10).toFixed(1)} / 10</span>
                            <div className="w-24 h-1.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-error rounded-full" style={{ width: scoreWidth }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-success font-mono">{(script.conversionRate * 100).toFixed(1)}%</span>
                            <div className="w-24 h-1.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-success rounded-full" style={{ width: rateWidth }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-2xs font-extrabold shadow-xs ${
                              script.conversionRate >= 0.15
                                ? 'bg-success/10 text-success border border-success/20'
                                : script.conversionRate >= 0.05
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-base-200 text-base-content/60 border border-base-content/10'
                            }`}
                          >
                            {script.conversionRate >= 0.15 ? 'Xuất sắc' : script.conversionRate >= 0.05 ? 'Tốt' : 'Trung bình'}
                          </span>
                        </td>
                     </motion.tr>
                   );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-base-content/40 font-semibold font-mono">
                    Không tìm thấy kịch bản nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

    </div>
  );
}
