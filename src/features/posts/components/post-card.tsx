'use client';

import { cn } from "@shared/lib";

import React, { useState } from 'react';
import { Post } from '@features/posts/types';
import { PostStatusBadge } from './post-status-badge';
import { 
  MoreVertical, 
  Trash2, 
  AlertTriangle, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type PostCardProps = {
  post: Post & {
    account?: {
      name: string;
      platform: string;
      avatarUrl?: string;
    };
  };
  onDelete: (id: string) => void;
};

export function PostCard({ post, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const accountName = post.account?.name || 'Social User';
  const accountAvatar = post.account?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(accountName)}&background=random&size=150`;

  const postContent = post.content || '';
  const shouldShowExpand = postContent.length > 80;

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

  const formatTime = (date: any) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className={cn(
      "group bg-base-200 border border-base-content/5 shadow-xs rounded-4xl overflow-hidden hover:-translate-y-1.5 hover:shadow-lg active:scale-[0.99] transition-all duration-300 w-full relative flex flex-col mb-6 break-inside-avoid",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
      {/* A. Header của Thẻ (User Info) */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img 
            src={accountAvatar} 
            alt={accountName} 
            className="w-10 h-10 rounded-full object-cover border border-base-content/10"
          />
          <div>
            <h4 className="font-bold text-sm text-base-content leading-tight">{accountName}</h4>
            <p className="text-xs text-base-content/40 mt-1.5 font-medium leading-none">
              {formatTime(post.scheduledAt || post.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {(!post.mediaUrls || post.mediaUrls.length === 0) && (
            <PostStatusBadge status={post.status} />
          )}
          <div className="dropdown dropdown-end">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-200 hover:text-base-content cursor-pointer"
            >
              <MoreVertical size={16} />
            </div>
            <ul 
              tabIndex={0} 
              className="dropdown-content menu p-1 shadow-lg bg-base-100 border border-base-content/10 rounded-xl w-32 z-20"
            >
              <li>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-xs text-error hover:bg-error/10 font-bold py-2 rounded-lg cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* B. Body của Thẻ (Visual Content) */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="px-4 py-2 relative overflow-hidden">
          <div className="relative rounded-2xl overflow-hidden bg-base-300">
            <img 
              src={post.mediaUrls[0]} 
              alt={post.title || "Post media"} 
              className="w-full h-auto object-cover max-h-[380px] group-hover:scale-102 transition-transform duration-500 rounded-2xl"
            />
            
            <div className="absolute top-3 left-3">
              <PostStatusBadge status={post.status} />
            </div>

            {post.mediaUrls.length > 1 && (
              <div className="absolute bottom-3 right-3 badge badge-sm badge-soft bg-base-300/80 backdrop-blur-md text-base-content font-mono border-none font-bold">
                +{post.mediaUrls.length - 1} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* C. Gương tương tác (Interaction Bar) */}
      <div className="flex items-center justify-between px-4 py-2 mt-1 shrink-0">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsLiked(!isLiked)} 
            className={cn(
              "transition-all duration-300 transform active:scale-75 hover:scale-110 cursor-pointer",
              isLiked ? "text-error fill-error" : "text-base-content/60 hover:text-error"
            )}
          >
            <Heart size={20} />
          </button>
          <button className="text-base-content/60 hover:text-primary transition-all duration-300 hover:scale-110 cursor-pointer">
            <MessageCircle size={20} />
          </button>
          <button className="text-base-content/60 hover:text-info transition-all duration-300 hover:scale-110 cursor-pointer">
            <Send size={20} />
          </button>
        </div>
        
        <button 
          onClick={() => setIsBookmarked(!isBookmarked)} 
          className={cn(
            "transition-all duration-300 transform active:scale-75 hover:scale-110 cursor-pointer",
            isBookmarked ? "text-primary fill-primary" : "text-base-content/60 hover:text-primary"
          )}
        >
          <Bookmark size={20} />
        </button>
      </div>

      {/* D. Caption & Footer */}
      <div className="px-4 pb-4 pt-2 space-y-1 grow">
        {post.title && <h5 className="font-bold text-sm text-base-content leading-tight mb-1">{post.title}</h5>}
        <p className="text-sm text-base-content/80 leading-relaxed font-medium wrap-break-word">
          {shouldShowExpand ? (
            <>
              {isExpanded ? postContent : `${postContent.slice(0, 80)}...`}
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-primary hover:underline ml-1 font-bold inline-block cursor-pointer text-xs"
              >
                {isExpanded ? ' less' : 'more'}
              </button>
            </>
          ) : (
            postContent || <span className="text-base-content/30 italic">No content</span>
          )}
        </p>

        {post.status === 'failed' && post.errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-error bg-error/5 p-2 rounded-xl border border-error/10 text-xs font-semibold">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="line-clamp-1">{post.errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
