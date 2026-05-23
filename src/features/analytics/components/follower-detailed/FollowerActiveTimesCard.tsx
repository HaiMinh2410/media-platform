import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart3, Info, Sparkles } from 'lucide-react';
import { cn } from '../primitives';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface FollowerActiveTimesCardProps {
  activeTimes: Record<string, number[]> | null;
}

const DAYS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"] as const;
const TIME_LABELS_FULL = ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];

export function FollowerActiveTimesCard({
  activeTimes
}: FollowerActiveTimesCardProps) {
  const currentDayIndex = new Date().getDay();
  const initialDay = DAYS[(currentDayIndex + 6) % 7];
  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>(initialDay);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md flex flex-col justify-between min-h-[380px]"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-secondary animate-pulse" />
            <h4 className="font-bold text-base-content tracking-tight">Giờ hoạt động nhiều nhất</h4>
          </div>

          {/* Day Selector Tabs */}
          {activeTimes && (
            <div className="flex p-0.5 bg-base-200/70 border border-base-content/5 rounded-2xl select-none flex-wrap max-w-[200px] justify-end shadow-inner">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer",
                    activeDay === d 
                      ? "bg-secondary text-secondary-content shadow-sm font-extrabold" 
                      : "text-base-content/40 hover:text-base-content/70"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {!activeTimes ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-base-content/20 mb-2" />
            <span className="text-base-content/20 text-xs font-semibold">Không có dữ liệu giờ hoạt động</span>
          </div>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="text-xs font-bold text-base-content/50 mb-2 uppercase tracking-wider">
              Thời gian online nhiều nhất
            </div>
            
            <div className="h-[220px] w-full mt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDay}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {(() => {
                    const dayData = activeTimes[activeDay] || [0, 0, 0, 0, 0, 0, 0, 0];
                    const chartData = TIME_LABELS_FULL.map((label, idx) => ({
                      time: label,
                      value: dayData[idx] || 0
                    }));

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="activeTimeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="var(--color-base-content)" 
                            opacity={0.06} 
                            vertical={false} 
                          />
                          <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tick={{ 
                              fill: 'var(--color-base-content)', 
                              opacity: 0.5, 
                              fontSize: 9, 
                              fontWeight: 700, 
                              fontFamily: 'var(--font-sans, sans-serif)' 
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ 
                              fill: 'var(--color-base-content)', 
                              opacity: 0.5, 
                              fontSize: 9, 
                              fontWeight: 700, 
                              fontFamily: 'monospace' 
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-base-100 border border-base-content/10 px-3 py-2 rounded-2xl shadow-xl">
                                    <p className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider font-mono">
                                      {payload[0].payload.time}
                                    </p>
                                    <p className="text-sm font-extrabold text-secondary mt-0.5">
                                      {payload[0].value?.toLocaleString()} <span className="text-xs text-base-content/60 font-medium">hoạt động</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-secondary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#activeTimeGrad)"
                            activeDot={{ 
                              r: 6, 
                              stroke: 'var(--color-base-100)', 
                              strokeWidth: 2, 
                              fill: 'var(--color-secondary)',
                              className: 'shadow-lg'
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-base-content/5 flex items-center gap-2 text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">
        <Info size={14} className="text-secondary/50" />
        <span>Follower hoạt động sôi nổi nhất vào 9 PM</span>
      </div>
    </motion.div>
  );
}
