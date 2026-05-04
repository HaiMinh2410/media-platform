'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, UploadCloud, Film, Loader2 } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type MediaFile = {
  id: string;
  url: string;
  type: 'image' | 'video';
  status: 'uploading' | 'done' | 'error';
  progress: number;
};

type MediaUploaderProps = {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  workspaceId: string;
};

export function MediaUploader({ files, onChange, workspaceId }: MediaUploaderProps) {
  const supabase = createClient();

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
        
        updateFileStatus(placeholder.id, 'done', 100, publicUrl);
      }
    }
  }, [files, onChange, workspaceId, supabase]);

  const updateFileStatus = (id: string, status: MediaFile['status'], progress: number, url?: string) => {
    onChange(files.map((f: MediaFile) => f.id === id ? { ...f, status, progress, url: url || f.url } : f));
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
    maxFiles: 10
  });

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

              {file.status === 'error' && (
                <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                  <span className="text-2xs text-red-200 font-medium">Failed</span>
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

        {files.length < 10 && (
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
      
      <p className="text-2xs text-slate-500 italic">
        Max 10 files. Images (JPG, PNG) or Videos (MP4).
      </p>
    </div>
  );
}
