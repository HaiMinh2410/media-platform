'use client';

import React, { useState } from 'react';
import { Post } from '@/domain/types/posts';
import { PostStatusBadge } from './post-status-badge';
import { MoreVertical, Trash2, Calendar, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
type PostCardProps = {
  post: Post;
  onDelete: (id: string) => void;
};

export function PostCard({ post, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted');
        onDelete(post.id);
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('Error deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "group relative bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden hover:border-foreground/20 transition-all duration-300",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
      {/* Media Preview */}
      <div className="aspect-video bg-base-300 relative overflow-hidden">
        {post.mediaUrls.length > 0 ? (
          <img 
            src={post.mediaUrls[0]} 
            alt="Post media" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="text-foreground-tertiary" size={48} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <PostStatusBadge status={post.status} />
        </div>

        {post.mediaUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-foreground/60 backdrop-blur-md text-background text-2xs px-2 py-1 rounded-md">
            +{post.mediaUrls.length - 1} more
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
            {post.content || <span className="text-foreground-tertiary italic">No content</span>}
          </p>
          
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded-lg hover:bg-foreground/5 text-foreground-secondary transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)} 
                />
                <div className="absolute right-0 bottom-full mb-2 w-32 bg-base-200 border border-foreground/10 rounded-xl shadow-2xl z-20 py-1 animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => {
                      setShowActions(false);
                      handleDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-11 text-red-400 hover:bg-red-500/10 transition-colors text-left font-bold uppercase tracking-wider"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-foreground/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Calendar size={12} />
            <span className="text-11 font-medium">
              {post.status === 'scheduled' && post.scheduledAt 
                ? format(new Date(post.scheduledAt), 'MMM d, h:mm a')
                : format(new Date(post.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          {post.status === 'failed' && post.errorMessage && (
            <div className="flex items-center gap-1 text-red-500" title={post.errorMessage}>
              <AlertTriangle size={12} />
              <span className="text-2xs font-bold uppercase">Error</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
