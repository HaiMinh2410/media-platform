'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Square, Send, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function VoiceRecorder({ 
  onCancel, 
  onConfirm 
}: { 
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {}
      setPreviewUrl(null);
    }
    setIsPlayingPreview(false);
  };

  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;
    let localRecorder: MediaRecorder | null = null;
    let localInterval: NodeJS.Timeout | null = null;

    isCancelledRef.current = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!active || isCancelledRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = stream;
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        localRecorder = mediaRecorder;
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setIsPaused(false);

        localInterval = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
        timerRef.current = localInterval;
      } catch (err) {
        console.error('Microphone access denied or error:', err);
        if (active) {
          onCancel();
        }
      }
    };

    start();

    return () => {
      active = false;
      isCancelledRef.current = true;
      
      if (localInterval) {
        clearInterval(localInterval);
      }
      if (localRecorder && localRecorder.state !== 'inactive') {
        try {
          localRecorder.stop();
        } catch (e) {}
      }
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
      }
    };
  }, []);

  const handlePauseRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(true);

    setTimeout(() => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    }, 100);
  };

  const togglePlayPreview = () => {
    if (!previewUrl) return;

    if (isPlayingPreview) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio(previewUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlayingPreview(false);
        };
      }
      audioRef.current.play().catch(err => {
        console.error('Error playing audio preview:', err);
      });
      setIsPlayingPreview(true);
    }
  };

  const handleConfirm = () => {
    cleanupAudio();

    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      
      setTimeout(() => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onConfirm(blob);
      }, 100);
    } else {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onConfirm(blob);
    }
  };

  const handleCancel = () => {
    cleanupAudio();
    isCancelledRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    onCancel();
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-transparent py-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Left Cancel Button: Small dark circular button with blue X */}
      <button 
        type="button" 
        onClick={handleCancel}
        className="w-8 h-8 rounded-full bg-foreground/5 dark:bg-[#1a1b1c] border border-[#0084FF]/10 text-[#0084FF] flex items-center justify-center hover:bg-[#0084FF]/10 transition-all active:scale-90"
        title="Hủy ghi âm"
      >
        <X size={16} className="text-[#0084FF] stroke-[3]" />
      </button>

      {/* Main Messenger Blue Capsule */}
      <div className="flex-1 flex items-center justify-between h-9 bg-[#0084FF] rounded-full px-1.5 shadow-md relative overflow-hidden">
        
        {/* Left Side inside Capsule: White circle with stop or play button */}
        {isRecording ? (
          <button 
            type="button" 
            onClick={handlePauseRecording}
            className="w-6.5 h-6.5 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
            title="Dừng ghi âm"
            style={{ width: '26px', height: '26px' }}
          >
            <Square size={10} fill="#0084FF" className="text-[#0084FF]" />
          </button>
        ) : (
          <button 
            type="button" 
            onClick={togglePlayPreview}
            className="w-6.5 h-6.5 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
            title={isPlayingPreview ? "Tạm dừng nghe thử" : "Nghe thử ghi âm"}
            style={{ width: '26px', height: '26px' }}
          >
            {isPlayingPreview ? (
              <Square size={10} fill="#0084FF" className="text-[#0084FF]" />
            ) : (
              <Play size={10} fill="#0084FF" className="text-[#0084FF] ml-0.5" />
            )}
          </button>
        )}

        {/* Middle inside Capsule: Waveform Soundwave visualizer in pure white */}
        <div className="flex-1 flex items-center justify-center gap-[3px] h-5 px-4 overflow-hidden">
          {Array.from({ length: 22 }).map((_, i) => {
            const height = isRecording 
              ? Math.random() * 85 + 15 
              : isPlayingPreview 
                ? Math.random() * 70 + 30 
                : 15;
            return (
              <motion.div 
                key={i} 
                className="w-[3px] bg-white rounded-full opacity-80"
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.1, repeat: isRecording || isPlayingPreview ? Infinity : 0, repeatType: 'reverse' }}
                style={{ height: '15%' }}
              />
            );
          })}
        </div>

        {/* Right Side inside Capsule: White badge containing blue timer text */}
        <div className="bg-white rounded-full px-2.5 py-0.5 flex items-center justify-center min-w-[46px] h-6 shrink-0 shadow-sm mr-0.5">
          <span className="font-mono text-xs font-extrabold text-[#0084FF]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Send Button: Blue paper plane pointing right */}
      <button 
        type="button" 
        onClick={handleConfirm}
        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-[#0084FF] hover:scale-110 active:scale-90 transition-all shrink-0"
        title="Xác nhận và đính kèm"
      >
        <Send size={20} className="text-[#0084FF] fill-current" />
      </button>
    </div>
  );
}
