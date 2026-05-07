import React from 'react';
import { X, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export type FileAttachment = {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'file';
  previewUrl: string;
};

export function AttachmentPreview({ 
  attachments, 
  onRemove 
}: { 
  attachments: FileAttachment[]; 
  onRemove: (id: string) => void;
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2 pb-1">
      {attachments.map((att) => (
        <div 
          key={att.id} 
          className="relative group flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-foreground/10 bg-background-secondary shadow-sm max-w-[200px]"
        >
          {att.type === 'image' ? (
            <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/5">
              <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-indigo-500/10 text-indigo-500">
              {att.type === 'video' && <Film size={16} />}
              {att.type === 'audio' && <Music size={16} />}
              {att.type === 'file' && <FileText size={16} />}
            </div>
          )}
          
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-medium truncate text-foreground">{att.file.name}</span>
            <span className="text-[9px] text-foreground-tertiary">{formatSize(att.file.size)}</span>
          </div>

          <button 
            type="button"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border border-foreground/10 rounded-full flex items-center justify-center text-foreground-tertiary hover:text-status-error hover:border-status-error/30 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
            onClick={() => onRemove(att.id)}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}
