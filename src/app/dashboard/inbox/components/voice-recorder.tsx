'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Square, Play, X, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SendButton } from './send-button';

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
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
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
    setPlaybackTime(0);
  };

  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;
    let localRecorder: MediaRecorder | null = null;
    let animationFrameId: number | null = null;

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

        const startTime = Date.now();
        const tick = () => {
          if (!active || isCancelledRef.current) return;
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          setDuration(elapsedSeconds);
          animationFrameId = requestAnimationFrame(tick);
          animationFrameRef.current = animationFrameId;
        };
        animationFrameId = requestAnimationFrame(tick);
        animationFrameRef.current = animationFrameId;
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
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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

  useEffect(() => {
    if (isRecording && duration >= 180) {
      handlePauseRecording();
    }
  }, [duration, isRecording]);

  const handlePauseRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      if (!audioRef.current) {
        const audio = new Audio(previewUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlayingPreview(false);
          setPlaybackTime(0);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      }
      
      audioRef.current.play().catch(err => {
        console.error('Error playing audio preview:', err);
      });
      setIsPlayingPreview(true);

      const tickPlayback = () => {
        if (audioRef.current && !audioRef.current.paused) {
          setPlaybackTime(audioRef.current.currentTime);
          animationFrameRef.current = requestAnimationFrame(tickPlayback);
        }
      };
      animationFrameRef.current = requestAnimationFrame(tickPlayback);
    }
  };

  const handleConfirm = () => {
    cleanupAudio();

    if (isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    const totalSecs = Math.floor(time);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
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
        
        {/* Progress Fill Background Overlay */}
        <div 
          className="absolute inset-y-0 left-0 bg-white/15 pointer-events-none z-0"
          style={{ width: `${isRecording ? (duration / 180) * 100 : (duration > 0 ? (playbackTime / duration) * 100 : 0)}%` }}
        />

        {/* Left Side inside Capsule: White circle with stop or play button */}
        {isRecording ? (
          <button 
            type="button" 
            onClick={handlePauseRecording}
            className="w-6.5 h-6.5 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] z-10"
            title="Dừng ghi âm"
            style={{ width: '26px', height: '26px' }}
          >
            <Square fill="#0084FF" className="text-[#0084FF] size-1/2" />
          </button>
        ) : (
          <button 
            type="button" 
            onClick={togglePlayPreview}
            className="size-full rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] z-10"
            title={isPlayingPreview ? "Tạm dừng nghe thử" : "Nghe thử ghi âm"}
            style={{ width: '26px', height: '26px' }}
          >
            {isPlayingPreview ? (
              <Pause fill="#0084FF" className="text-[#0084FF] size-2/3" />
            ) : (
              <Play fill="#0084FF" className="text-[#0084FF] ml-0.5 size-2/3" />
            )}
          </button>
        )}

        {/* Right Side inside Capsule: White badge containing blue timer text */}
        <div className="bg-white rounded-full px-2.5 py-0.5 flex items-center justify-center min-w-[46px] h-6 shrink-0 shadow-sm mr-0.5 z-10">
          <span className="font-mono text-sm font-extrabold text-[#0084FF]">
            {formatTime(isRecording ? duration : Math.max(Math.ceil(duration - playbackTime), 0))}
          </span>
        </div>
      </div>

      {/* Right Send Button: Blue paper plane pointing right */}
      <SendButton 
        type="button" 
        onClick={handleConfirm}
        className="w-8 h-8 rounded-full bg-transparent text-[#0084FF] hover:scale-110 active:scale-90 shrink-0"
        iconClassName="text-[#0084FF] fill-current"
        size={20}
        title="Xác nhận và đính kèm"
      />
    </div>
  );
}
