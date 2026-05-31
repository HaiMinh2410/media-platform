'use client';

import { cn } from "@shared/lib";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

export type BatchPublishSummary = {
  id: string;
  batchId: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  scheduledAt?: Date | null;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SCHEDULED';
  accounts: {
    id: string;
    name: string;
    platform: string;
    status: 'SUCCESS' | 'FAILED' | 'SCHEDULED';
    avatarUrl?: string;
  }[];
};

type BatchPublishCardProps = {
  batch: BatchPublishSummary;
  workspaceId: string;
};

// Mock users database for hashing (shared with post-card)
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

export function BatchPublishCard({ batch, workspaceId }: BatchPublishCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const mock = getMockData(batch.batchId);
  const batchContent = batch.content || '';
  const shouldShowExpand = batchContent.length > 80;
  const failCount = batch.accounts.filter(a => a.status === 'FAILED').length;

  const primaryAccount = batch.accounts[0] || { name: 'Social User', platform: 'platform', avatarUrl: undefined };
  const accountAvatar = primaryAccount.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryAccount.name)}&background=random&size=150`;

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const failedAccounts = batch.accounts
      .filter(a => a.status === 'FAILED')
      .map(a => ({ accountId: a.id, platform: a.platform.toUpperCase() }));

    if (failedAccounts.length === 0) return;

    setIsRetrying(true);
    toast.loading('Đang khởi tạo đăng lại...', { id: 'retry-publish' });

    try {
      const response = await fetch('/api/publish/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.batchId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry');
      }

      toast.success('Đã bắt đầu đăng lại các mục lỗi!', { id: 'retry-publish' });
    } catch (error: any) {
      console.error('Retry error:', error);
      toast.error(error.message || 'Không thể đăng lại. Vui lòng thử lại sau.', { id: 'retry-publish' });
    } finally {
      setIsRetrying(false);
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
    <div className="group bg-base-200 border border-base-content/5 shadow-xs rounded-4xl overflow-hidden hover:-translate-y-1.5 hover:shadow-lg active:scale-[0.99] transition-all duration-300 w-full relative flex flex-col mb-6 break-inside-avoid">
      {/* A. Header của Thẻ (User Info) */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img 
            src={accountAvatar} 
            alt={primaryAccount.name} 
            className="w-10 h-10 rounded-full object-cover border border-base-content/10"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-base-content leading-tight">{primaryAccount.name}</h4>
            </div>
            <p className="text-[11px] text-base-content/40 mt-1.5 font-medium leading-none">
             {formatTime(batch.scheduledAt || batch.createdAt)}
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
                  onClick={() => toast.info('Mục này thuộc tiến trình đăng loạt')}
                  className="flex items-center gap-2 text-xs text-base-content/70 hover:bg-base-200 font-bold py-2 rounded-lg cursor-pointer"
                >
                  <Eye size={14} />
                  View Batch
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
            src={batch.mediaUrls.length > 0 ? batch.mediaUrls[0] : mock.fallbackImage} 
            alt="Batch media" 
            className="w-full h-auto object-cover max-h-[380px] group-hover:scale-102 transition-transform duration-500 rounded-2xl"
          />
          
          {/* Status Badge overlay */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider border backdrop-blur-md transition-colors shadow-xs",
              batch.status === 'SUCCESS' && "bg-success/20 text-success border-success/30",
              batch.status === 'FAILED' && "bg-error/20 text-error border-error/30",
              batch.status === 'PARTIAL' && "bg-warning/20 text-warning border-warning/30",
              batch.status === 'SCHEDULED' && "bg-info/20 text-info border-info/30"
            )}>
              {batch.status === 'SUCCESS' && <CheckCircle2 size={12} />}
              {batch.status === 'FAILED' && <XCircle size={12} />}
              {batch.status === 'PARTIAL' && <AlertCircle size={12} />}
              {batch.status === 'SCHEDULED' && <Calendar size={12} />}
              
              {batch.status === 'SUCCESS' && 'Thành công'}
              {batch.status === 'FAILED' && 'Thất bại'}
              {batch.status === 'PARTIAL' && 'Một phần'}
              {batch.status === 'SCHEDULED' && 'Đã lên lịch'}
            </div>
          </div>

          {batch.mediaUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 badge badge-sm badge-soft bg-base-300/80 backdrop-blur-md text-base-content font-mono border-none font-bold">
              +{batch.mediaUrls.length - 1} more
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

      <div className="px-4 pb-4 pt-1 space-y-3 grow">
        <p className="text-sm text-base-content/80 leading-relaxed font-medium wrap-break-word">
          {shouldShowExpand ? (
            <>
              {isExpanded ? batchContent : `${batchContent.slice(0, 80)}...`}
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-primary hover:underline ml-1 font-bold inline-block cursor-pointer text-xs"
              >
                {isExpanded ? ' less' : 'more'}
              </button>
            </>
          ) : (
            batchContent || <span className="text-base-content/30 italic">Không có nội dung</span>
          )}
        </p>

        {/* Retry button inside card footer area */}
        {failCount > 0 && (
          <div className="pt-2 border-t border-base-content/5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-error/80 uppercase font-mono tracking-wider flex items-center gap-1">
              <AlertCircle size={12} />
              {failCount} nền tảng lỗi
            </span>
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="btn btn-xs btn-soft btn-error rounded-xl font-bold gap-1 cursor-pointer hover:shadow-xs transition-all h-7 px-2.5"
            >
              <RefreshCcw size={12} className={cn(isRetrying && "animate-spin")} />
              {isRetrying ? 'Đang gửi...' : 'Đăng lại'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
