import { cn } from "@shared/lib";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { getDynamicCornersClass } from './message-bubble-utils';

interface VoiceNotePlayerProps {
  url: string;
  isUser: boolean;
  isPrevConsecutive?: boolean;
  isNextConsecutive?: boolean;
}

// --- CONSTANTS (Clean Code: Tránh Magic Numbers) ---
const WAVEFORM_BAR_COUNT = 22;

export function VoiceNotePlayer({
  url,
  isUser,
  isPrevConsecutive = false,
  isNextConsecutive = false,
}: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isPlaying) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  // Smooth 60fps loop for rendering playback progress
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.warn('[Audio] Play error:', err));
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const pct = parseFloat(e.target.value);
    const newTime = (pct / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const barHeights = [6, 10, 14, 8, 4, 12, 16, 10, 6, 14, 12, 8, 16, 10, 4, 12, 14, 8, 6, 10, 8, 4];

  return (
    <div className={cn(
      "flex items-center gap-3 py-6 px-4.5 min-w-40 w-56 h-11 shadow-sm relative select-none",
      getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-2xl"),
      isUser 
        ? "bg-background-secondary text-foreground border-none" 
        : "bg-primary text-primary-content border-none"
    )}>
      {/* Play/Pause Button */}
      <button 
        type="button"
        onClick={togglePlay} 
        className="flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer"
      >
        {isPlaying ? (
          <Pause 
            size={15} 
            fill="currentColor" 
            className={isUser ? "text-foreground" : "text-primary-content"} 
          />
        ) : (
          <Play 
            size={15} 
            fill="currentColor" 
            className={cn(
              "ml-0.5",
              isUser ? "text-foreground" : "text-primary-content"
            )} 
          />
        )}
      </button>

      {/* Waveform & Playhead Container */}
      <div className="flex-1 flex items-center relative h-6 min-w-0 mx-1">
        {/* Waveform Bars */}
        <div className="w-full flex items-center justify-between gap-[2px] h-4">
          {barHeights.map((barHeight, i) => {
            const animHeight = isPlaying 
              ? barHeight * (0.8 + Math.sin(currentTime * 8 + i * 0.5) * 0.2) 
              : barHeight;

            // Compute exact relative sub-range progress for this bar
            const barCount = WAVEFORM_BAR_COUNT;
            const startPct = (i / barCount) * 100;
            const endPct = ((i + 1) / barCount) * 100;

            let fillPct = 0;
            if (progress >= endPct) {
              fillPct = 100;
            } else if (progress <= startPct) {
              fillPct = 0;
            } else {
              fillPct = ((progress - startPct) / (endPct - startPct)) * 100;
            }

            // High-contrast adaptivity using modern native CSS color-mix
            const activeColor = isUser ? "currentColor" : "#ffffff";
            const inactiveColor = isUser ? "color-mix(in srgb, currentColor 25%, transparent)" : "rgba(255, 255, 255, 0.3)";

            return (
              <div 
                key={i} 
                className="w-[2px] rounded-full transition-all duration-75" 
                style={{ 
                  height: `${Math.max(3, Math.min(16, animHeight))}px`,
                  background: `linear-gradient(to right, ${activeColor} ${fillPct}%, ${inactiveColor} ${fillPct}%)`
                }}
              />
            );
          })}
        </div>

        {/* Transparent Range Slider for Seeking */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress} 
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>

      {/* Playback Time / Duration */}
      <span className={cn(
        "text-[11px] font-semibold select-none tabular-nums shrink-0 ml-1.5",
        isUser ? "text-foreground-secondary" : "text-primary-content/95"
      )}>
        {formatTime(
          currentTime > 0 
            ? Math.max(0, Math.ceil(duration - currentTime)) 
            : Math.ceil(duration || 0)
        )}
      </span>
    </div>
  );
}
