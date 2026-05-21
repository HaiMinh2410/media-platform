import { useState, useRef, useCallback } from 'react';
import { FileAttachment } from '../../attachment-preview';

type UseFileAttachmentReturn = {
  files: FileAttachment[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  clearFiles: () => void;
  removeFile: (id: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
};

function classifyFileType(file: File): FileAttachment['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

function mapFilesToAttachments(fileList: File[]): FileAttachment[] {
  return fileList.map(file => ({
    id: Math.random().toString(36).substring(2, 11),
    file,
    type: classifyFileType(file),
    previewUrl: URL.createObjectURL(file),
  }));
}

export function useFileAttachment(): UseFileAttachmentReturn {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearFiles = useCallback(() => setFiles([]), []);

  const removeFile = useCallback(
    (id: string) => setFiles(prev => prev.filter(f => f.id !== id)),
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = mapFilesToAttachments(Array.from(e.target.files));
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const newFiles = mapFilesToAttachments(Array.from(e.dataTransfer.files));
    setFiles(prev => [...prev, ...newFiles]);
  };

  return {
    files,
    fileInputRef,
    isDragging,
    clearFiles,
    removeFile,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
