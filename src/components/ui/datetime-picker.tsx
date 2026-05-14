'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, setHours, setMinutes, startOfToday, nextMonday } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type DatetimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
};

export function DatetimePicker({ value, onChange }: DatetimePickerProps) {
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      setTimezone('UTC');
    }
  }, []);

  const presets = [
    { 
      label: 'Chiều nay 15:00', 
      getDate: () => setMinutes(setHours(startOfToday(), 15), 0) 
    },
    { 
      label: 'Sáng mai 09:00', 
      getDate: () => setMinutes(setHours(addDays(startOfToday(), 1), 9), 0) 
    },
    { 
      label: 'Thứ Hai 09:00', 
      getDate: () => setMinutes(setHours(nextMonday(startOfToday()), 9), 0) 
    },
  ];

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(value);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    onChange(newDate);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.getDate())}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all uppercase tracking-wider"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Date Input Wrapper */}
        <div className="relative group">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={14} />
          <input
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none [color-scheme:dark]"
          />
        </div>

        {/* Time Input Wrapper */}
        <div className="relative group">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={14} />
          <input
            type="time"
            value={format(value, 'HH:mm')}
            onChange={handleTimeChange}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Timezone Indicator */}
      <div className="flex items-center gap-2 px-1 text-[10px] font-medium text-slate-500">
        <Globe size={12} className="text-blue-500/60" />
        <span className="bg-slate-800/30 px-2 py-0.5 rounded border border-white/5 text-slate-400">
          {timezone || 'Detecting...'}
        </span>
        <span className="ml-auto italic opacity-40">Múi giờ hệ thống</span>
      </div>
    </div>
  );
}
