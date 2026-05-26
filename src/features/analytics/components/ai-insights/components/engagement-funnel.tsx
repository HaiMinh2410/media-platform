import React from 'react';
import { Cpu, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function EngagementFunnel() {
  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm tracking-tight font-brand text-base-content">
            Phễu Tương Tác Giai Đoạn AI
          </h3>
        </div>
        <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
          Phân tích điểm rò rỉ tỷ lệ phản hồi qua từng giai đoạn Playbook.
        </p>
      </div>

      <div className="space-y-4 my-6">
        
        {/* Giai đoạn 1 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-primary">G1: Xây Dựng Lòng Tin (Build Trust)</span>
            <span className="font-bold font-mono">100% (Tiếp nhận)</span>
          </div>
          <div className="w-full h-2.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1 }} className="h-full bg-primary rounded-full" />
          </div>
        </div>

        {/* Giai đoạn 2 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-secondary">G2: Làm Ấm & Kết Nối (Warm-up)</span>
            <span className="font-bold font-mono">72.4% (Duy trì)</span>
          </div>
          <div className="w-full h-2.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: '72.4%' }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-secondary rounded-full" />
          </div>
        </div>

        {/* Giai đoạn 3 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-warning">G3: Độc Quyền VIP (Upsell Links)</span>
            <span className="font-bold font-mono">34.8% (Đủ điều kiện)</span>
          </div>
          <div className="w-full h-2.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: '34.8%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-warning rounded-full" />
          </div>
        </div>

        {/* Giao dịch mua hàng */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-success">Giao dịch mua hàng (Purchase)</span>
            <span className="text-success font-mono">8.6% (Chuyển đổi)</span>
          </div>
          <div className="w-full h-2.5 bg-base-200 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: '8.6%' }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-success rounded-full" />
          </div>
        </div>

      </div>

      <div className="bg-base-200/50 border border-base-content/5 rounded-xl p-3 text-xs text-base-content/60 leading-relaxed flex items-start gap-2 shadow-inner">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
        <span>
          <strong>Gợi ý tối ưu:</strong> Tỷ lệ rò rỉ chủ yếu xuất hiện khi chuyển từ <strong>G2 sang G3</strong> (rơi mất 37.6%). Cần cải thiện kịch bản làm ấm bằng các turn thoại gợi ý khéo léo để tăng tỉ lệ gửi link chốt đơn.
        </span>
      </div>
    </div>
  );
}
