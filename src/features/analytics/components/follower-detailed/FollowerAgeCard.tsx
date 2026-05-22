import React from 'react';
import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowerAgeCardProps {
  ageData: DemographicItem[];
}

export function FollowerAgeCard({
  ageData = []
}: FollowerAgeCardProps) {
  const topAge = ageData.slice(0, 5);
  const maxAgeVal = topAge.length > 0 ? Math.max(...topAge.map((a) => a.value)) : 100;
  const totalAgeVal = ageData.reduce((sum, a) => sum + a.value, 0) || 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md flex flex-col justify-between font-sans"
    >
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Award size={18} className="text-success animate-pulse" />
          <h4 className="font-bold text-base-content tracking-tight font-brand">Nhóm tuổi phổ biến</h4>
        </div>

        {topAge.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-base-content/20 text-xs font-semibold">Không có dữ liệu độ tuổi</span>
          </div>
        ) : (
          <div className="space-y-4">
            {topAge.map((age: DemographicItem, idx: number) => {
              const percent = Math.round((age.value / totalAgeVal) * 100) || 0;
              const visualPct = Math.round((age.value / maxAgeVal) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-base-content/70 group-hover:text-base-content transition-colors font-brand">{age.name}</span>
                    <span className="text-base-content font-bold font-mono">
                      {age.value.toLocaleString()}{' '}
                      <span className="text-base-content/40 text-[10px] font-normal font-mono">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-base-200 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${visualPct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full bg-linear-to-r from-success to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-base-content/5 flex items-center gap-2 text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">
        <Sparkles size={14} className="text-success/50" />
        <span>Độ tuổi tập trung lớn nhất: {topAge[0]?.name || 'N/A'}</span>
      </div>
    </motion.div>
  );
}
