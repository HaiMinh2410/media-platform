import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Info, Sparkles } from "lucide-react";

interface DemographicItem {
  name: string;
  value: number;
}

interface FollowerGenderCardProps {
  genderDataRaw: DemographicItem[];
}

const GENDER_COLORS = {
  female: "var(--color-secondary)", // Secondary Rose
  male: "var(--color-info)", // Info Blue
  unknown: "var(--color-base-content)", // Neutral Base Content
};

export function FollowerGenderCard({
  genderDataRaw = [],
}: FollowerGenderCardProps) {
  const totalGenders = genderDataRaw.reduce((sum, g) => sum + g.value, 0) || 1;

  const genderData = genderDataRaw
    .map((g) => {
      let name = "Khác";
      let color = GENDER_COLORS.unknown;
      const lowerName = g.name.toLowerCase();

      if (
        lowerName === "f" ||
        lowerName.includes("female") ||
        lowerName.includes("nữ")
      ) {
        name = "Nữ";
        color = GENDER_COLORS.female;
      } else if (
        lowerName === "m" ||
        lowerName.includes("male") ||
        lowerName.includes("nam")
      ) {
        name = "Nam";
        color = GENDER_COLORS.male;
      }

      return {
        name,
        value: g.value,
        percentage: Math.round((g.value / totalGenders) * 100),
        color,
      };
    })
    .filter((g) => g.value > 0)
    .sort((a, b) => {
      const order: Record<string, number> = { Nam: 1, Nữ: 2, Khác: 3 };
      return (order[a.name] || 4) - (order[b.name] || 4);
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-base-100 border border-base-content/5 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[360px] h-full"
    >
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users size={18} className="text-secondary animate-pulse" />
          <h4 className="text-lg font-bold text-base-content tracking-tight">
            Tỷ lệ Giới tính
          </h4>
        </div>

        {genderData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-base-content/40 italic">
              Không có dữ liệu giới tính
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Donut Chart container */}
            <div className="size-50 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="var(--color-base-100)"
                    strokeWidth={2}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Inside Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-base-content/40 font-bold tracking-wide font-mono">
                  Giới tính
                </span>
                <span className="text-lg font-bold tracking-wide text-base-content">
                  {genderData[0]?.name || "N/A"}
                </span>
              </div>
            </div>

            {/* Custom Legend list */}
            <div className="flex-1 divide-y divide-base-content/5 w-full">
              {genderData.map((gender, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-4 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-3 rounded-full shadow-xs"
                      style={{
                        backgroundColor: gender.color,
                        boxShadow: `0 0 8px color-mix(in srgb, ${gender.color} 25%, transparent)`,
                      }}
                    />
                    <span className="text-base-content/80 group-hover:text-base-content transition-colors">
                      {gender.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-base-content font-mono">
                      {gender.percentage}%
                    </span>
                    <span className="block text-xs text-base-content/40 font-medium font-mono">
                      ({gender.value.toLocaleString()})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-base-content/5 flex items-center gap-2 text-sm text-base-content/60 tracking-wider">
        <Info size={14} className="text-secondary/60" />
        <span>
          Cân bằng giới tính:{" "}
          <span className="text-secondary">{genderData[0]?.name || "N/A"}</span>{" "}
          chiếm ưu thế
        </span>
      </div>
    </motion.div>
  );
}
