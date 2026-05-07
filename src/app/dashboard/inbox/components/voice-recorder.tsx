'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
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
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start recording automatically when mounted
    startRecording();
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleStopAndConfirm = () => {
    stopRecording();
    // Wait for data available
    setTimeout(() => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onConfirm(blob);
    }, 100);
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between w-full p-2 bg-background-base rounded-lg border border-red-500/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse text-red-500">
          <Mic size={16} />
        </div>
        <span className="text-red-500 font-mono font-medium text-sm">
          {formatTime(duration)}
        </span>
        
        {/* Fake Visualizer */}
        <div className="flex items-end gap-[3px] h-6 px-2">
          {Array.from({ length: 15 }).map((_, i) => {
            const height = isRecording ? Math.random() * 100 : 10;
            return (
              <motion.div 
                key={i} 
                className="w-1 bg-red-500/50 rounded-t-sm"
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.1, repeat: Infinity, repeatType: 'reverse' }}
                style={{ height: '10%' }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          type="button" 
          onClick={handleCancel}
          className="w-8 h-8 rounded-full bg-background-secondary text-foreground-secondary flex items-center justify-center hover:bg-foreground/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
        <button 
          type="button" 
          onClick={handleStopAndConfirm}
          className="w-8 h-8 rounded-full bg-accent-gradient text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
