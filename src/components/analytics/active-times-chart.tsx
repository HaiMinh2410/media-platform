'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Users, BarChart3 } from 'lucide-react';
import { cn, COLORS, Skeleton, StatBlock } from './primitives';

interface ActiveTimesChartProps {
  activeTimes: Record<string, number[]> | null;
  totalFollowers: number;
  isLoading?: boolean;
}

const DAYS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"] as const;
const TIME_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

function BarRow({ label, value, max, index }: { label: string; value: number; max: number; index: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  
  return (
    <div className="flex items-center gap-3 mb-2.5 last:mb-0 group">
      <div className="w-8 text-[#888] text-[11px] font-medium text-right shrink-0 transition-colors group-hover:text-[#aaa]">
        {label}
      </div>
      <div className="flex-1 h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full shadow-lg shadow-pink-500/10"
          style={{ background: COLORS.pink }}
        />
      </div>
      <div className="w-10 text-[#ccc] text-[11px] font-bold text-right shrink-0 group-hover:text-white transition-colors">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export function ActiveTimesChart({
  activeTimes,
  totalFollowers,
  isLoading = false,
}: ActiveTimesChartProps) {
  // Map JS getDay() (0-6, 0=Sun) to our DAYS index
  // JS: 0=Su, 1=M, 2=Tu, 3=W, 4=Th, 5=F, 6=Sa
  const currentDayIndex = new Date().getDay();
  const initialDay = DAYS[(currentDayIndex + 6) % 7]; // Map 0->Su, 1->M...
  
  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>(initialDay);

  const isInsufficientData = totalFollowers < 100;

  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 font-sans h-full">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Skeleton className="h-12 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex gap-1.5 mb-6">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-lg" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-2 w-full rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInsufficientData || !activeTimes) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 font-sans h-full flex flex-col justify-center items-center text-center min-h-[300px]">
        <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/10">
          <BarChart3 className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Not enough data</h3>
        <p className="text-[#666] text-sm max-w-[240px] leading-relaxed">
          Your account needs 100+ followers for audience insights.
        </p>
      </div>
    );
  }

  const dayData = activeTimes[activeDay] || [0, 0, 0, 0, 0, 0, 0, 0];
  const maxActive = Math.max(...dayData, 1);

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-white font-sans h-full">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Followers</h3>
        <Info className="w-4 h-4 text-[#555] cursor-help" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Total */}
        <div>
          <StatBlock value={totalFollowers} label="Total followers" />
          
          <div className="mt-8 p-4 bg-pink-500/5 border border-pink-500/10 rounded-xl">
             <div className="flex items-center gap-2 text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">
               <Users className="w-3.5 h-3.5" />
               Audience insight
             </div>
             <p className="text-xs text-[#888] leading-relaxed">
               Most of your followers are active around <span className="text-white font-bold">9 PM</span> on <span className="text-white font-bold">{activeDay === 'Su' ? 'Sundays' : activeDay === 'M' ? 'Mondays' : activeDay + 's'}</span>.
             </p>
          </div>
        </div>

        {/* Right: Active Times */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-[#ccc] mb-4">Most active times</div>
          
          {/* Day Selector */}
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-200 border",
                  activeDay === d 
                    ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20" 
                    : "bg-[#1e1e1e] text-[#888] border-[#222] hover:text-[#bbb] hover:border-[#333]"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="space-y-0.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {TIME_LABELS.map((h, i) => (
                  <BarRow
                    key={h}
                    label={h}
                    value={dayData[i] || 0}
                    max={maxActive}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-6 text-[11px] text-[#888]">
            <div className="w-2 h-2 rounded-full" style={{ background: COLORS.pink }} />
            Followers
          </div>
        </div>
      </div>
    </div>
  );
}
