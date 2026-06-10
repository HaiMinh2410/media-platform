'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date | string | null | undefined;
  className?: string;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, className = '', onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false,
      };
    };

    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (initial.isOver) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isOver) {
        if (onComplete) onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!targetDate) return null;
  
  if (timeLeft.isOver) {
    return (
      <span className="text-warning text-xs font-bold animate-pulse flex items-center gap-1.5 bg-warning/10 px-2 py-1 rounded-lg border border-warning/20">
        <Clock size={12} />
        Sắp đăng...
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Clock size={16} className="text-info shrink-0" />
      <div className="flex items-center gap-1 underline underline-offset-2">
        {timeLeft.days > 0 && (
          <>
            <span className="font-mono font-bold text-xs">{timeLeft.days}</span>
            <span className="text-2xs text-base-content/50 mr-1">nngày</span>
          </>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <>
            <span className="font-mono font-bold text-xs">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="text-2xs text-base-content/50 mr-1">giờ</span>
          </>
        )}
        <span className="font-mono font-bold text-sm">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-base-content/50 mr-1">phút</span>
        
        <span className="font-mono font-bold text-sm">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-base-content/50">giây</span>
      </div>
    </div>
  );
}
