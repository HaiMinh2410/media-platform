'use client';

import { cn } from "@shared/lib";

import React, { useState } from 'react';
import { Post } from '@features/posts/types';
import { PostStatusBadge } from './post-status-badge';
import { 
  MoreVertical, 
  Trash2, 
  Calendar, 
  Eye, 
  AlertTriangle, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type PostCardProps = {
  post: Post;
  onDelete: (id: string) => void;
};

// Mock users database for hashing
const MOCK_USERS = [
  { name: 'Sonya Leena', location: 'Dubai, UAE', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Adam Addisin', location: 'Oklahoma, US', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Andrew Dewitt', location: 'Overland Park, KS', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Nicole Segall', location: 'New Delhi, India', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { name: 'Michael Gilmore', location: 'Lawrence, KS', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Damian Efron', location: 'Birmingham, UK', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
];

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472214222541-d510753a49fa?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop&q=80',
];

// Consistent Hashing Helper
const getMockData = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const userIndex = Math.abs(hash) % MOCK_USERS.length;
  const imageIndex = Math.abs(hash * 3) % MOCK_IMAGES.length;
  
  const user = MOCK_USERS[userIndex];
  const fallbackImage = MOCK_IMAGES[imageIndex];
  
  const likesCount = (Math.abs(hash * 13) % 450) + 12;
  const otherUsers = MOCK_USERS.filter(u => u.name !== user.name);
  const likerName = otherUsers[Math.abs(hash * 7) % otherUsers.length].name.split(' ')[0];
  const likerAvatars = otherUsers.slice(0, 2).map(u => u.avatar);
  
  return {
    user,
    fallbackImage,
    likesCount,
    likerName,
    likerAvatars
  };
};

export function PostCard({ post, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const mock = getMockData(post.id);
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
            src={mock.user.avatar} 
            alt={mock.user.name} 
            className="w-10 h-10 rounded-full object-cover border border-base-content/10"
          />
          <div>
            <h4 className="font-bold text-sm text-base-content leading-tight">{mock.user.name}</h4>
            <p className="text-xs text-base-content/40 mt-1.5 font-medium leading-none">
              {formatTime(post.scheduledAt || post.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
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
      <div className="px-4 py-2 relative overflow-hidden">
        <div className="relative rounded-2xl overflow-hidden bg-base-300">
          <img 
            src={post.mediaUrls.length > 0 ? post.mediaUrls[0] : mock.fallbackImage} 
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

      {/* D. Footer của Thẻ (Social Proof & Caption) */}
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-base-content/80 font-medium shrink-0">
        <div className="avatar-group -space-x-2.5 rtl:space-x-reverse shrink-0">
          {mock.likerAvatars.map((av, index) => (
            <div key={index} className="avatar w-5 h-5 border border-base-100">
              <img src={av} alt="Liker" />
            </div>
          ))}
        </div>
        <span className="text-[11px] text-base-content/70">
          Liked by <span className="font-bold text-base-content">{mock.likerName}</span> and <span className="font-bold text-base-content">{isLiked ? mock.likesCount + 1 : mock.likesCount} others</span>
        </span>
      </div>

      <div className="px-4 pb-4 pt-1 space-y-1 grow">
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
