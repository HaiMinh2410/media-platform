'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, UploadCloud, Film, Loader2 } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type MediaFile = {
  id: string;
  url: string;
  type: 'image' | 'video';
  status: 'uploading' | 'transcoding' | 'done' | 'error' | 'transcode_error';
  progress: number;
  transcodeProgress?: number;
  jobId?: string;
};

import { ValidationIssue } from '@/lib/validation/validation-engine';

type MediaUploaderProps = {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  workspaceId: string;
  maxFiles: number;
  issues: ValidationIssue[];
};

export function MediaUploader({ files, onChange, workspaceId, maxFiles, issues }: MediaUploaderProps) {
  const supabase = createClient();
  const filesRef = useRef(files);
  const onChangeRef = useRef(onChange);
  filesRef.current = files;
  onChangeRef.current = onChange;

  useEffect(() => {
    const interval = setInterval(async () => {
      const transcodingFiles = filesRef.current.filter(f => f.status === 'transcoding' && f.jobId);
      if (transcodingFiles.length === 0) return;

      const newFiles = [...filesRef.current];
      let changed = false;

      for (const file of transcodingFiles) {
        try {
          const res = await fetch(`/api/media/transcode?jobId=${file.jobId}`);
          const result = await res.json();
          if (result.data) {
            const { state, progress, returnvalue } = result.data;
            const targetIdx = newFiles.findIndex(f => f.id === file.id);
            if (targetIdx === -1) continue;
            
            const targetFile = { ...newFiles[targetIdx] };

            if (state === 'completed') {
              targetFile.status = 'done';
              targetFile.url = returnvalue?.transcodedUrl || targetFile.url;
              targetFile.transcodeProgress = 100;
              changed = true;
            } else if (state === 'failed') {
              targetFile.status = 'transcode_error';
              changed = true;
            } else if (progress !== targetFile.transcodeProgress) {
              targetFile.transcodeProgress = typeof progress === 'number' ? progress : 0;
              changed = true;
            }

            newFiles[targetIdx] = targetFile;
          }
        } catch (e) {}
      }

      if (changed) {
        onChangeRef.current(newFiles);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      status: 'uploading',
      progress: 0
    }));

    onChange([...files, ...newFiles]);

    // Handle uploads
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const placeholder = newFiles[i];
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${placeholder.id}.${fileExt}`;
      const filePath = `posts/${workspaceId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        updateFileStatus(placeholder.id, 'error', 0);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
        
        if (placeholder.type === 'video') {
          try {
            const res = await fetch('/api/media/transcode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mediaId: placeholder.id,
                workspaceId,
                url: publicUrl,
                filePath
              })
            });
            const result = await res.json();
            if (result.data?.jobId) {
              updateFileStatus(placeholder.id, 'transcoding', 100, publicUrl, result.data.jobId);
            } else {
              updateFileStatus(placeholder.id, 'transcode_error', 100, publicUrl);
            }
          } catch (e) {
            updateFileStatus(placeholder.id, 'transcode_error', 100, publicUrl);
          }
        } else {
          updateFileStatus(placeholder.id, 'done', 100, publicUrl);
        }
      }
    }
  }, [files, onChange, workspaceId, supabase]);

  const updateFileStatus = (id: string, status: MediaFile['status'], progress: number, url?: string, jobId?: string) => {
    onChange(files.map((f: MediaFile) => f.id === id ? { ...f, status, progress, url: url || f.url, ...(jobId ? { jobId } : {}) } : f));
  };

  const removeFile = (id: string) => {
    onChange(files.filter(f => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles
  });

  const mediaIssues = issues.filter(i => i.message.includes('tệp đính kèm') || i.message.includes('Định dạng'));

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-400">Media Attachments</label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800"
            >
              {file.type === 'image' ? (
                <img src={file.url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <Film className="text-slate-700" size={32} />
                </div>
              )}
              
              {file.status === 'uploading' && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center flex-col gap-2">
                  <Loader2 className="text-blue-500 animate-spin" size={24} />
                  <span className="text-2xs text-blue-200 font-medium">Uploading...</span>
                </div>
              )}

              {file.status === 'transcoding' && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${file.transcodeProgress || 0}%` }} />
                  </div>
                  <span className="text-2xs text-blue-200 font-medium whitespace-nowrap text-center px-1">
                    Processing... {file.transcodeProgress ? `${Math.round(file.transcodeProgress)}%` : ''}
                  </span>
                </div>
              )}

              {file.status === 'error' && (
                <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                  <span className="text-2xs text-red-200 font-medium">Upload Failed</span>
                </div>
              )}

              {file.status === 'transcode_error' && (
                <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center gap-1">
                  <span className="text-2xs text-red-200 font-medium text-center">Video Processing Failed</span>
                </div>
              )}

              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2",
              isDragActive 
                ? "border-blue-500 bg-blue-500/5" 
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className={cn("transition-colors", isDragActive ? "text-blue-500" : "text-slate-600")} size={28} />
            <span className="text-2xs font-medium text-slate-500 uppercase tracking-widest">Add Media</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <p className="text-2xs text-slate-500 italic">
          Max {maxFiles === Infinity ? 'unlimited' : maxFiles} files. Images (JPG, PNG) or Videos (MP4).
        </p>
        {mediaIssues.length > 0 && (
          <div className="flex flex-col gap-1">
            {mediaIssues.map((issue, idx) => (
              <span key={idx} className="text-xs font-medium text-red-400">{issue.message}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
