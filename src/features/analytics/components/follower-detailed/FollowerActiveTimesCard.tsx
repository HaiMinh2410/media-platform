import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart3, Info } from 'lucide-react';
import { cn } from '../primitives';

interface FollowerActiveTimesCardProps {
  activeTimes: Record<string, number[]> | null;
}

const DAYS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"] as const;
const TIME_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

function ActiveTimeBarRow({ label, value, max, index }: { label: string; value: number; max: number; index: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  
  return (
    <div className="flex items-center gap-3 mb-2.5 last:mb-0 group">
      <div className="w-8 text-foreground/40 text-[10px] font-bold text-right shrink-0 transition-colors group-hover:text-foreground/60">
        {label}
      </div>
      <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full shadow-lg shadow-pink-500/10"
          style={{ background: '#e91e8c' }}
        />
      </div>
      <div className="w-10 text-foreground/70 text-[10px] font-bold text-right shrink-0 group-hover:text-foreground transition-colors">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

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
      className="glass rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-secondary animate-pulse" />
            <h4 className="font-bold text-foreground tracking-tight">Giờ hoạt động nhiều nhất</h4>
          </div>

          {/* Day Selector Tabs */}
          {activeTimes && (
            <div className="flex p-0.5 bg-foreground/5 border border-foreground/10 rounded-xl select-none flex-wrap max-w-[200px] justify-end">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer",
                    activeDay === d ? "bg-secondary text-secondary-content shadow-lg font-extrabold" : "text-foreground/40 hover:text-foreground/80"
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
            <BarChart3 className="w-8 h-8 text-foreground/20 mb-2" />
            <span className="text-foreground/20 text-xs font-semibold">Không có dữ liệu giờ hoạt động</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">Thời gian online nhiều nhất</div>
            <div className="space-y-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const dayData = activeTimes[activeDay] || [0, 0, 0, 0, 0, 0, 0, 0];
                    const maxActive = Math.max(...dayData, 1);
                    return TIME_LABELS.map((h, i) => (
                      <ActiveTimeBarRow
                        key={h}
                        label={h}
                        value={dayData[i] || 0}
                        max={maxActive}
                        index={i}
                      />
                    ));
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center gap-2 text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
        <Info size={14} className="text-secondary/50" />
        <span>Follower hoạt động sôi nổi nhất vào 9 PM</span>
      </div>
    </motion.div>
  );
}
