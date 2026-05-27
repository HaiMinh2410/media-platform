'use client';

import React, { useState } from 'react';
import { Post } from '@features/posts/types';
import { PostStatusBadge } from './post-status-badge';
import { MoreVertical, Trash2, Calendar, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@shared/lib/utils';
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
      "group relative bg-base-100 border border-base-content/5 shadow-xs rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md active:scale-[0.99] transition-all duration-300",
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
            <Eye className="text-base-content/30" size={48} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <PostStatusBadge status={post.status} />
        </div>

        {post.mediaUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 badge badge-sm badge-soft bg-base-300/80 backdrop-blur-md text-base-content font-mono border-none">
            +{post.mediaUrls.length - 1} more
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-base-content line-clamp-2 leading-relaxed">
            {post.content || <span className="text-base-content/30 italic">No content</span>}
          </p>
          
          <div className="dropdown dropdown-end dropdown-top shrink-0">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-xs p-1 rounded-lg text-base-content/60 hover:bg-base-200"
            >
              <MoreVertical size={16} />
            </div>
            <ul 
              tabIndex={0} 
              className="dropdown-content menu p-1 shadow-lg bg-base-200 border border-base-content/10 rounded-xl w-32 z-20"
            >
              <li>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-xs text-error hover:bg-error/10 font-bold uppercase tracking-wider py-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-base-content/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base-content/50">
            <Calendar size={12} />
            <span className="text-11 font-medium">
              {post.status === 'scheduled' && post.scheduledAt 
                ? format(new Date(post.scheduledAt), 'MMM d, h:mm a')
                : format(new Date(post.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          {post.status === 'failed' && post.errorMessage && (
            <div className="flex items-center gap-1 text-error" title={post.errorMessage}>
              <AlertTriangle size={12} />
              <span className="text-2xs font-bold uppercase">Error</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
