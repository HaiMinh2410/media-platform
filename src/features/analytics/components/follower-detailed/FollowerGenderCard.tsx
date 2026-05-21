import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Info } from 'lucide-react';

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowerGenderCardProps {
  genderDataRaw: DemographicItem[];
}

const GENDER_COLORS = {
  female: '#f43f5e', // Sleek Rose
  male: '#3b82f6',   // Sleek Blue
  unknown: '#9ca3af' // Sleek Gray
};

export function FollowerGenderCard({
  genderDataRaw = []
}: FollowerGenderCardProps) {
  const totalGenders = genderDataRaw.reduce((sum, g) => sum + g.value, 0) || 1;

  const genderData = genderDataRaw.map((g) => {
    let name = 'Khác';
    let color = GENDER_COLORS.unknown;
    const lowerName = g.name.toLowerCase();

    if (lowerName === 'f' || lowerName.includes('female') || lowerName.includes('nữ')) {
      name = 'Nữ';
      color = GENDER_COLORS.female;
    } else if (lowerName === 'm' || lowerName.includes('male') || lowerName.includes('nam')) {
      name = 'Nam';
      color = GENDER_COLORS.male;
    }

    return {
      name,
      value: g.value,
      percentage: Math.round((g.value / totalGenders) * 100),
      color
    };
  }).filter((g) => g.value > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users size={18} className="text-secondary" />
          <h4 className="font-bold text-foreground tracking-tight">Tỷ lệ Giới tính</h4>
        </div>

        {genderData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-foreground/20 text-xs">Không có dữ liệu giới tính</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Donut Chart container */}
            <div className="w-[150px] h-[150px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inside Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-foreground/35 font-bold uppercase tracking-wider">Giới tính</span>
                <span className="text-sm font-black text-foreground">
                  {genderData[0]?.name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Custom Legend list */}
            <div className="flex-1 space-y-3.5 w-full">
              {genderData.map((gender, idx) => (
                <div key={idx} className="flex justify-between items-center bg-foreground/1 border border-foreground/10 p-2.5 rounded-xl group hover:bg-foreground/3 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: gender.color, boxShadow: `0 0 10px ${gender.color}30` }} />
                    <span className="text-xs font-semibold text-foreground/60 group-hover:text-foreground transition-colors">{gender.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground">{gender.percentage}%</span>
                    <span className="block text-[8px] text-foreground/30 font-medium">({gender.value.toLocaleString()})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center gap-2 text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
        <Info size={14} className="text-secondary/50" />
        <span>Cân bằng giới tính: {genderData[0]?.name || 'N/A'} chiếm ưu thế</span>
      </div>
    </motion.div>
  );
}
