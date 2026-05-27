'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, UploadCloud, Film, Loader2 } from 'lucide-react';
import { createClient } from '@shared/api/supabase/client';
import { cn } from '@shared/lib/utils';
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

import { ValidationIssue } from '@shared/lib/validation/validation-engine';

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

  const updateFileStatus = useCallback((id: string, status: MediaFile['status'], progress: number, url?: string, jobId?: string) => {
    const currentFiles = filesRef.current;
    const updatedFiles = currentFiles.map((f: MediaFile) => 
      f.id === id ? { ...f, status, progress, url: url || f.url, ...(jobId ? { jobId } : {}) } : f
    );
    onChangeRef.current(updatedFiles);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const placeholders: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      status: 'uploading',
      progress: 0
    }));

    const initialFiles = [...filesRef.current, ...placeholders];
    onChangeRef.current(initialFiles);

    // Handle uploads
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const placeholder = placeholders[i];
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${placeholder.id}.${fileExt}`;
      const filePath = `posts/${workspaceId}/${fileName}`;

      try {
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          updateFileStatus(placeholder.id, 'error', 0);
          continue;
        }

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
      } catch (err) {
        console.error('Processing error:', err);
        updateFileStatus(placeholder.id, 'error', 0);
      }
    }
  }, [workspaceId, supabase]);

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
    <div className="bg-base-200 p-4 border-t border-base-content/5">
      <div className="grid grid-cols-4 gap-3">
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-base-300 border border-base-content/5"
            >
              {file.type === 'image' ? (
                <img src={file.url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-base-300">
                  <Film className="text-base-content/40" size={24} />
                </div>
              )}
              
              {file.status === 'uploading' && (
                <div className="absolute inset-0 bg-base-300/80 flex items-center justify-center flex-col gap-2">
                  <Loader2 className="text-primary animate-spin" size={20} />
                </div>
              )}
 
              {file.status === 'transcoding' && (
                <div className="absolute inset-0 bg-base-300/90 flex flex-col items-center justify-center p-3">
                  <div className="w-full bg-base-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${file.transcodeProgress || 0}%` }} />
                  </div>
                </div>
              )}
 
              {file.status === 'error' && (
                <div className="absolute inset-0 bg-error/20 backdrop-blur-xs flex items-center justify-center">
                  <span className="text-2xs text-error font-semibold">Lỗi</span>
                </div>
              )}
 
              {file.status === 'transcode_error' && (
                <div className="absolute inset-0 bg-error/20 backdrop-blur-xs flex flex-col items-center justify-center gap-1">
                  <span className="text-2xs text-error font-semibold text-center">Lỗi xử lý</span>
                </div>
              )}
 
              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-base-300/80 text-base-content/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error hover:text-error-content cursor-pointer shadow-xs"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
 
        {files.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              "aspect-square rounded-xl border border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2",
              isDragActive 
                ? "border-primary bg-primary/10" 
                : "border-base-content/10 bg-base-300/40 hover:border-primary/50 hover:bg-base-200/50"
            )}
          >
            <input {...getInputProps()} />
            <span className="text-xl text-base-content/50 mb-1">🖼️</span>
            <span className="text-2xs font-medium text-base-content/50 uppercase tracking-wide">Thêm</span>
          </div>
        )}
      </div>
      
      {mediaIssues.length > 0 && (
        <div className="flex flex-col gap-1 mt-3">
          {mediaIssues.map((issue, idx) => (
            <span key={idx} className="text-xs font-medium text-error">{issue.message}</span>
          ))}
        </div>
      )}
    </div>
  );
}
