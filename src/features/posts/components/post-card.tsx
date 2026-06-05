'use client';

import { cn } from "@shared/lib";

import React, { useState, useEffect } from 'react';
import { Post, PostStatus } from '@features/posts/types';
import { PostStatusBadge } from './post-status-badge';
import { 
  MoreVertical, 
  Trash2, 
  AlertTriangle, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CountdownTimer } from './countdown-timer';
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
    platformId?: string;
  }[];
};

export { PostCard as BatchPublishCard };

type PostCardProps = {
  post?: Post & {
    account?: {
      name: string;
      platform: string;
      avatarUrl?: string;
    };
  };
  batch?: BatchPublishSummary;
  workspaceId: string;
  onDelete?: (id: string) => void;
};

export function PostCard({ post, batch, workspaceId, onDelete }: PostCardProps) {
  const isBatch = !post && !!batch;

  // State cục bộ đồng bộ từ props
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Lấy dữ liệu gốc ban đầu
  const initialStatus: PostStatus = isBatch
    ? (batch.status === 'SCHEDULED' ? 'scheduled' : batch.status === 'SUCCESS' ? 'published' : 'failed')
    : post!.status;

  const initialAccounts = isBatch
    ? batch.accounts
    : [{
        id: post!.accountId,
        name: post!.account?.name || 'Social User',
        platform: post!.account?.platform || 'platform',
        status: post!.status === 'scheduled' ? 'SCHEDULED' as const : post!.status === 'failed' ? 'FAILED' as const : 'SUCCESS' as const,
        avatarUrl: post!.account?.avatarUrl
      }];

  const [status, setStatus] = useState<PostStatus>(initialStatus);
  const [accounts, setAccounts] = useState(initialAccounts);

  useEffect(() => {
    const updatedStatus: PostStatus = isBatch
      ? (batch.status === 'SCHEDULED' ? 'scheduled' : batch.status === 'SUCCESS' ? 'published' : 'failed')
      : post!.status;
    const updatedAccounts = isBatch
      ? batch.accounts
      : [{
          id: post!.accountId,
          name: post!.account?.name || 'Social User',
          platform: post!.account?.platform || 'platform',
          status: post!.status === 'scheduled' ? 'SCHEDULED' as const : post!.status === 'failed' ? 'FAILED' as const : 'SUCCESS' as const,
          avatarUrl: post!.account?.avatarUrl
        }];

    setStatus(updatedStatus);
    setAccounts(updatedAccounts);
  }, [post, batch, isBatch]);

  // Các trường thông tin đã chuẩn hóa
  const id = isBatch ? batch.batchId : post!.id;
  const content = isBatch ? batch.content : (post!.content || '');
  const mediaUrls = isBatch ? batch.mediaUrls : post!.mediaUrls;
  const scheduledAt = isBatch ? batch.scheduledAt : post!.scheduledAt;
  const createdAt = isBatch ? batch.createdAt : post!.createdAt;
  const errorMessage = isBatch ? null : post!.errorMessage;
  const isLegacyDraft = !isBatch; // Bài viết cũ lẻ từ db

  const primaryAccount = accounts[0] || { name: 'Social User', platform: 'platform', avatarUrl: undefined };
  const accountAvatar = primaryAccount.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryAccount.name)}&background=random&size=150`;

  const shouldShowExpand = content.length > 80;
  const failCount = accounts.filter(a => a.status === 'FAILED').length;

  const modalId = `post-detail-modal-${id}`;
  const openModal = () => {
    if (typeof document !== 'undefined') {
      const modal = document.getElementById(modalId) as HTMLDialogElement;
      modal?.showModal();
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa bài viết này?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    toast.loading("Đang xóa bài viết...", { id: "delete-post" });

    try {
      let response;
      if (isBatch) {
        response = await fetch(`/api/publish/history?id=${id}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/posts/${id}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete');
      }

      toast.success("Xóa bài viết thành công!", { id: "delete-post" });
      if (onDelete) {
        onDelete(id);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Không thể xóa bài viết. Vui lòng thử lại sau.', { id: "delete-post" });
      setIsDeleting(false);
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isBatch) return;

    const failedAccounts = accounts
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
          batchId: id,
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
    <div className={cn(
      "group bg-base-200 border border-base-content/5 shadow-xs rounded-4xl overflow-hidden hover:-translate-y-1.5 hover:shadow-lg active:scale-[0.99] transition-all duration-300 w-full relative flex flex-col mb-6 break-inside-avoid",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
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
              {accounts.length === 1 && (
                <span className="badge badge-2xs badge-ghost capitalize font-semibold opacity-75">
                  {primaryAccount.platform}
                </span>
              )}
              {accounts.length > 1 && (
                <span className="badge badge-2xs badge-primary font-bold">
                  +{accounts.length - 1} tài khoản
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/40 mt-1.5 font-medium leading-none">
              {formatTime(scheduledAt || createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {(!mediaUrls || mediaUrls.length === 0) && (
            <PostStatusBadge status={status} />
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
                  onClick={openModal}
                  className="flex items-center gap-2 text-xs text-base-content/70 hover:bg-base-200 font-bold py-2 rounded-lg cursor-pointer"
                >
                  <Eye size={14} />
                  Xem chi tiết
                </button>
              </li>
              {onDelete && (
                <li>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-xs text-error hover:bg-error/10 font-bold py-2 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={14} />
                    {status === 'published' ? 'Gỡ bài viết (MXH & DB)' : 'Xóa bài viết'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* B. Body của Thẻ (Visual Content) */}
      {mediaUrls && mediaUrls.length > 0 && (
        <div className="px-4 py-2 relative overflow-hidden">
          <div className="relative rounded-2xl overflow-hidden bg-base-300">
            <img 
              src={mediaUrls[0]} 
              alt="Post media" 
              className="w-full h-auto object-cover max-h-[380px] group-hover:scale-102 transition-transform duration-500 rounded-2xl"
            />
            
            <div className="absolute top-3 left-3">
              <PostStatusBadge status={status} />
            </div>

            {mediaUrls.length > 1 && (
              <div className="absolute bottom-3 right-3 badge badge-sm badge-soft bg-base-300/80 backdrop-blur-md text-base-content font-mono border-none font-bold">
                +{mediaUrls.length - 1} more
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
      <div className="px-4 pb-4 pt-2 space-y-3 grow">
        <div className="space-y-1">
          {(!isBatch && post?.title) && <h5 className="font-bold text-sm text-base-content leading-tight mb-1">{post.title}</h5>}
          <p className="text-sm text-base-content/80 leading-relaxed font-medium wrap-break-word">
            {shouldShowExpand ? (
              <>
                {isExpanded ? content : `${content.slice(0, 80)}...`}
                <button 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="text-primary hover:underline ml-1 font-bold inline-block cursor-pointer text-xs"
                >
                  {isExpanded ? ' less' : 'more'}
                </button>
              </>
            ) : (
              content || <span className="text-base-content/30 italic">Không có nội dung</span>
            )}
          </p>
        </div>

        {/* Failed error or retry inside footer for batch error */}
        {status === 'failed' && (
          <>
            {errorMessage && (
              <div className="mt-2 flex items-center gap-1.5 text-error bg-error/5 p-2 rounded-xl border border-error/10 text-xs font-semibold">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="line-clamp-1">{errorMessage}</span>
              </div>
            )}
            {(isBatch && failCount > 0) && (
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
          </>
        )}
      </div>

      {/* Modal Xem chi tiết */}
      <dialog id={modalId} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box p-6 border border-base-content/10 bg-base-100 rounded-3xl shadow-2xl max-w-xl text-left">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-base-content/5 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={accountAvatar} 
                alt={primaryAccount.name} 
                className="w-10 h-10 rounded-full object-cover border border-base-content/10"
              />
              <div>
                <h4 className="font-bold text-sm text-base-content leading-tight">
                  {accounts.length === 1 ? 'Chi tiết bài viết' : 'Chi tiết đăng loạt (Batch)'}
                </h4>
                <p className="text-[11px] text-base-content/40 mt-1 font-medium flex items-center gap-2">
                  {formatTime(scheduledAt || createdAt)}
                  {accounts.length === 1 && (
                    <span className="badge badge-2xs badge-ghost capitalize font-semibold opacity-70">
                      {primaryAccount.platform}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <PostStatusBadge status={status} />
              <form method="dialog">
                <button className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-200">✕</button>
              </form>
            </div>
          </div>

          {/* Modal Body */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Media Gallery trong Modal */}
            {mediaUrls && mediaUrls.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-2xl overflow-hidden bg-base-300">
                {mediaUrls.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    alt={`Media ${idx + 1}`} 
                    className="w-full h-auto object-cover max-h-[300px] mx-auto rounded-xl"
                  />
                ))}
              </div>
            )}

            {/* Post Content */}
            <div className="bg-base-200/50 p-4 rounded-2xl border border-base-content/5">
              {(!isBatch && post?.title) && <h5 className="font-bold text-sm text-base-content mb-2">{post.title}</h5>}
              <p className="text-sm text-base-content/90 whitespace-pre-wrap leading-relaxed wrap-break-word font-medium">
                {content || <span className="text-base-content/30 italic">Không có nội dung</span>}
              </p>
            </div>

            {/* Schedule & Countdown Section */}
            {status === 'scheduled' && scheduledAt && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Lịch đăng dự kiến:
                  </span>
                  <span>
                    {format(new Date(scheduledAt), 'HH:mm - dd/MM/yyyy')}
                  </span>
                </div>
                
                <CountdownTimer 
                  targetDate={scheduledAt} 
                  className="pt-1.5 border-t border-primary/10" 
                  onComplete={() => {
                    setStatus('published');
                    if (isBatch) {
                      setAccounts(prev => prev.map(a => ({ ...a, status: 'SUCCESS' })));
                    }
                  }}
                />
              </div>
            )}

            {/* Failed Section */}
            {status === 'failed' && (
              <div className="space-y-3">
                {errorMessage && (
                  <div className="bg-error/5 p-4 rounded-2xl border border-error/10 space-y-1">
                    <span className="text-xs font-bold text-error flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Lỗi đăng bài:
                    </span>
                    <p className="text-xs text-error/80 leading-relaxed font-semibold">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Accounts Status List */}
            {accounts.length > 1 && (
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-base-content/60 uppercase tracking-wider pl-1">
                  Danh sách tài khoản ({accounts.length})
                </h5>
                <div className="grid grid-cols-1 gap-2.5">
                  {accounts.map((acc) => {
                    const avatar = acc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=100`;
                    return (
                      <div key={acc.id} className="flex items-center justify-between p-3 rounded-2xl bg-base-200/50 border border-base-content/5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={avatar} 
                            alt={acc.name} 
                            className="w-8 h-8 rounded-full object-cover border border-base-content/10" 
                          />
                          <div>
                            <h6 className="font-bold text-xs text-base-content flex items-center gap-1.5">
                              {acc.name}
                              <span className="badge badge-2xs badge-ghost capitalize font-semibold opacity-70">
                                {acc.platform}
                              </span>
                            </h6>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border",
                            acc.status === 'SUCCESS' && "bg-success/15 text-success border-success/20",
                            acc.status === 'FAILED' && "bg-error/15 text-error border-error/20",
                            acc.status === 'SCHEDULED' && "bg-info/15 text-info border-info/20"
                          )}>
                            {acc.status === 'SUCCESS' && <CheckCircle2 size={10} />}
                            {acc.status === 'FAILED' && <XCircle size={10} />}
                            {acc.status === 'SCHEDULED' && <Calendar size={10} />}
                            
                            {acc.status === 'SUCCESS' && 'Thành công'}
                            {acc.status === 'FAILED' && 'Thất bại'}
                            {acc.status === 'SCHEDULED' && 'Đã lên lịch'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-action border-t border-base-content/5 pt-4 mt-4 flex justify-between items-center">
            <span className="text-2xs text-base-content/30 font-mono">
              {isBatch ? `Batch ID: ${id}` : `ID: ${id}`}
            </span>
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-sm btn-ghost rounded-xl font-bold">Đóng</button>
              {(isBatch && failCount > 0) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    handleRetry(e);
                    (document.getElementById(modalId) as HTMLDialogElement)?.close();
                  }}
                  disabled={isRetrying}
                  className="btn btn-sm btn-error rounded-xl font-bold"
                >
                  Đăng lại lỗi
                </button>
              )}
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
