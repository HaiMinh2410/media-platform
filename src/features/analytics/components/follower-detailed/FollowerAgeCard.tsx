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
      className="glass rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Award size={18} className="text-success" />
          <h4 className="font-bold text-foreground tracking-tight">Nhóm tuổi phổ biến</h4>
        </div>

        {topAge.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-foreground/20 text-xs">Không có dữ liệu độ tuổi</span>
          </div>
        ) : (
          <div className="space-y-4">
            {topAge.map((age: DemographicItem, idx: number) => {
              const percent = Math.round((age.value / totalAgeVal) * 100) || 0;
              const visualPct = Math.round((age.value / maxAgeVal) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground/70 group-hover:text-foreground transition-colors">{age.name}</span>
                    <span className="text-foreground font-bold">
                      {age.value.toLocaleString()}{' '}
                      <span className="text-foreground/30 text-[10px] font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${visualPct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center gap-2 text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
        <Sparkles size={14} className="text-success/50" />
        <span>Độ tuổi tập trung lớn nhất: {topAge[0]?.name || 'N/A'}</span>
      </div>
    </motion.div>
  );
}
