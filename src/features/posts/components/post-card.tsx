"use client";

import { cn } from "@shared/lib";
import { PlatformIcon, RangeSelector } from "@shared/ui";

import React from "react";
import { Post, BatchPublishSummary } from "@features/posts/types";
import { PostStatusBadge } from "./post-status-badge";
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
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { CountdownTimer } from "./countdown-timer";
import { usePostCard } from "../hooks/use-post-card";

export type { BatchPublishSummary };
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

export function PostCard({
  post,
  batch,
  workspaceId,
  onDelete,
}: PostCardProps) {
  const {
    isBatch,
    isDeleting,
    isRetrying,
    isExpanded,
    setIsExpanded,
    status,
    setStatus,
    accounts,
    setAccounts,
    id,
    content,
    mediaUrls,
    scheduledAt,
    createdAt,
    publishedAt,
    errorMessage,
    getPublishedDate,
    handleDelete,
    handleRetry,
    formatTime,
    primaryAccount,
    accountAvatar,
    shouldShowExpand,
    failCount,
    modalId,
    openModal,
    isMultiAccountBatch,
  } = usePostCard({
    post,
    batch,
    workspaceId,
    onDelete,
  });

  const renderSmartBadge = () => {
    if (scheduledAt) {
      if (status === "published") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-success/15 text-success border-success/35">
            <Calendar size={13} className="shrink-0" />
            Thành công
          </span>
        );
      }
      if (status === "failed") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-error/15 text-error border-error/35">
            <Calendar size={13} className="shrink-0" />
            Thất bại
          </span>
        );
      }
      if (status === "processing") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-warning/15 text-warning border-warning/35 animate-pulse">
            <Calendar size={13} className="shrink-0" />
            Đang xử lý
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-info/15 text-info border-info/35">
          <Calendar size={13} className="shrink-0" />
          Đã lên lịch
        </span>
      );
    } else {
      // Đăng trực tiếp
      if (status === "published") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-success/10 text-success border-success/35">
            <CheckCircle2 size={13} className="shrink-0" />
            Thành công
          </span>
        );
      }
      if (status === "failed") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-error/15 text-error border-error/35">
            <XCircle size={13} className="shrink-0" />
            Thất bại
          </span>
        );
      }
      if (status === "processing") {
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold tracking-wider border bg-warning/15 text-warning border-warning/35 animate-pulse">
            <RefreshCcw size={13} className="animate-spin shrink-0" />
            Đang đăng...
          </span>
        );
      }
    }
    return null;
  };

  const renderHeader = (isModal = false) => {
    if (isMultiAccountBatch) {
      const visibleAccounts = accounts.slice(0, 2);
      const extraCount = accounts.length - 2;

      return (
        <div className="flex items-center gap-3.5">
          {/* Avatar Stack (Dropdown if in Modal, Static if on Card) */}
          {isModal ? (
            <RangeSelector
              customTrigger={
                <div className="avatar-group -space-x-5 rtl:space-x-reverse cursor-pointer flex items-center shrink-0">
                  {visibleAccounts.map((acc, index) => {
                    const avatarUrl =
                      acc.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=80`;
                    return (
                      <div
                        key={acc.id || index}
                        className="avatar border-3 border-base-200"
                      >
                        <div className="size-8 rounded-full">
                          <img
                            src={avatarUrl}
                            alt={acc.name}
                            className="object-cover rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {extraCount > 0 && (
                    <div className="avatar placeholder border-3 border-base-200">
                      <div className="bg-soft text-neutral-content size-8 rounded-full flex items-center justify-center text-xs font-bold">
                        +{extraCount}
                      </div>
                    </div>
                  )}
                </div>
              }
              menuAlign="left"
              menuMinWidth="w-72"
              dropdownClassName="bg-soft border border-base-content/10 rounded-xl p-2"
            >
              <div className="flex flex-col gap-2 w-full">
                <h5 className="text-xs font-semibold text-base-content/40 tracking-wide pl-1.5 pt-1">
                  Danh sách tài khoản ({accounts.length})
                </h5>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {accounts.map((acc) => {
                    const avatar =
                      acc.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=100`;
                    return (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-1.5 hover:bg-base-100/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative size-8 shrink-0">
                            <img
                              src={avatar}
                              alt={acc.name}
                              className="size-8 rounded-full object-cover border border-base-content/10"
                            />
                            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-base-200 flex items-center justify-center border border-base-content/5 shadow-xs">
                              <PlatformIcon platform={acc.platform} size={12} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h6 className="font-bold text-xs text-base-content leading-tight truncate">
                              {acc.name}
                            </h6>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </RangeSelector>
          ) : (
            <div className="avatar-group -space-x-5 rtl:space-x-reverse shrink-0">
              {visibleAccounts.map((acc, index) => {
                const avatarUrl =
                  acc.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=80`;
                return (
                  <div
                    key={acc.id || index}
                    className="avatar border-3 border-base-200"
                  >
                    <div className="size-8 rounded-full">
                      <img
                        src={avatarUrl}
                        alt={acc.name}
                        className="object-cover rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
              {extraCount > 0 && (
                <div className="avatar placeholder border-3 border-base-200">
                  <div className="bg-soft text-neutral-content size-8 rounded-full flex items-center justify-center text-xs font-bold">
                    +{extraCount}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Title & Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-semibold text-base-content leading-tight">
                Đăng loạt bài viết
              </h4>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-base-content/40 leading-none">
                {isModal && status === "published"
                  ? format(getPublishedDate(), "HH:mm:ss - dd/MM")
                  : formatTime(scheduledAt || createdAt)}
              </p>
              <span className="text-base-content/20 text-2xs leading-none">
                •
              </span>
              <p className="text-xs font-semibold text-primary/80 tracking-wide leading-none">
                {Array.from(
                  new Set(
                    accounts.map((a) => {
                      const p = a.platform.toLowerCase();
                      return p.charAt(0).toUpperCase() + p.slice(1);
                    }),
                  ),
                ).join(" & ")}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default Single Account Header
    return (
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0">
          <img
            src={accountAvatar}
            alt={primaryAccount.name}
            className="size-10 rounded-full object-cover border border-base-content/10"
          />
          {accounts.length === 1 && (
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-base-200 flex items-center justify-center">
              <PlatformIcon platform={primaryAccount.platform} size={12} />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-base-content leading-tight">
              {primaryAccount.name}
            </h4>
          </div>
          <p className="text-xs text-base-content/40 mt-1.5 font-medium leading-none">
            {isModal && status === "published"
              ? format(getPublishedDate(), "HH:mm:ss - dd/MM")
              : formatTime(scheduledAt || createdAt)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "group bg-base-200 rounded-4xl p-4.5 px-5 gap-4  overflow-hidden hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 w-full relative flex flex-col break-inside-avoid",
        isDeleting && "opacity-50 pointer-events-none",
      )}
    >
      {/* A. Header của Thẻ (User Info) */}
      <div className="flex items-center justify-between">
        {renderHeader()}

        <div className="flex items-center gap-2 shrink-0">
          {(!mediaUrls || mediaUrls.length === 0) && (
            <PostStatusBadge status={status} />
          )}
          <RangeSelector
            customTrigger={
              <button className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-200 hover:text-base-content cursor-pointer flex items-center justify-center">
                <MoreVertical size={16} />
              </button>
            }
            menuAlign="right"
            menuMinWidth="w-48"
            size="sm"
            dropdownClassName="bg-base-100 border-none rounded-lg p-1"
          >
            <button
              onClick={openModal}
              className="flex items-center gap-2 text-xs text-base-content/70 hover:bg-base-200 font-bold py-2 px-3 rounded-lg cursor-pointer text-left w-full transition-colors"
            >
              <Eye size={14} className="shrink-0" />
              <span>Xem chi tiết</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs text-error hover:bg-error/10 font-bold py-2 px-3 rounded-lg cursor-pointer text-left w-full transition-colors"
              >
                <Trash2 size={14} className="shrink-0" />
                <span className="truncate">
                  {status === "published"
                    ? "Gỡ bài viết (MXH & DB)"
                    : "Xóa bài viết"}
                </span>
              </button>
            )}
          </RangeSelector>
        </div>
      </div>

      {/* B. Body của Thẻ (Visual Content) */}
      {mediaUrls && mediaUrls.length > 0 && (
        <div className="relative overflow-hidden">
          <div className="relative rounded-2xl overflow-hidden bg-base-300">
            <img
              src={mediaUrls[0]}
              alt="Post media"
              className="w-full h-auto object-cover max-h-[380px] group-hover:scale-102 transition-transform duration-500 rounded-2xl"
            />

            <div className="absolute top-3 right-3">
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
      <div className="flex items-center justify-between mt-1 shrink-0 select-none">
        <div className="flex items-center gap-5">
          <div
            className="transition-all duration-300 transform hover:scale-110 text-base-content/60 hover:text-error cursor-default"
          >
            <Heart size={20} />
          </div>
          <div className="text-base-content/60 hover:text-primary transition-all duration-300 hover:scale-110 cursor-default">
            <MessageCircle size={20} />
          </div>
          <div className="text-base-content/60 hover:text-info transition-all duration-300 hover:scale-110 cursor-default">
            <Send size={20} />
          </div>
        </div>

        <div
          className="transition-all duration-300 transform hover:scale-110 text-base-content/60 hover:text-primary cursor-default"
        >
          <Bookmark size={20} />
        </div>
      </div>

      {/* D. Caption & Footer */}
      <div className="space-y-3 grow">
        <div className="space-y-1">
          {!isBatch && post?.title && (
            <h5 className="font-bold text-sm text-base-content leading-tight mb-1">
              {post.title}
            </h5>
          )}
          <p className="text-sm text-base-content/80 leading-relaxed wrap-break-word">
            {shouldShowExpand ? (
              <>
                {isExpanded ? content : `${content.slice(0, 80)}...`}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary hover:underline ml-1 font-bold inline-block cursor-pointer text-xs"
                >
                  {isExpanded ? " less" : "more"}
                </button>
              </>
            ) : (
              content || (
                <span className="text-base-content/30 italic">
                  Không có nội dung
                </span>
              )
            )}
          </p>
        </div>

        {/* Failed error or retry inside footer for batch error */}
        {status === "failed" && (
          <>
            {errorMessage && (
              <div className="mt-2 flex items-center gap-1.5 text-error bg-error/5 p-2 rounded-xl border border-error/10 text-xs font-semibold">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="line-clamp-1">{errorMessage}</span>
              </div>
            )}
            {isBatch && failCount > 0 && (
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
                  <RefreshCcw
                    size={12}
                    className={cn(isRetrying && "animate-spin")}
                  />
                  {isRetrying ? "Đang gửi..." : "Đăng lại"}
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
            {renderHeader(true)}

            <div className="flex items-center gap-2">
              {renderSmartBadge()}
            </div>
          </div>

          {/* Thông tin xuất bản (Publishing Info) tối giản */}
          <div className="flex items-center justify-between text-xs text-base-content/60 mb-3">
            <div className="flex items-center gap-4">
              {scheduledAt && (
                <div className="flex items-center gap-1">
                  <span>Lịch đăng:</span>
                  <span className="font-semibold text-info">
                    {format(new Date(scheduledAt), "HH:mm - dd/MM")}
                  </span>
                </div>
              )}
            </div>

            {/* Schedule & Countdown Section tối giản */}
            {status === "scheduled" && scheduledAt && (
              <CountdownTimer
                targetDate={scheduledAt}
                className="scale-95 origin-right"
                onComplete={() => {
                  setStatus("published");
                  if (isBatch) {
                    setAccounts((prev) =>
                      prev.map((a) => ({ ...a, status: "SUCCESS" })),
                    );
                  }
                }}
              />
            )}
          </div>

          {/* Modal Body */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Media Gallery trong Modal */}
            {mediaUrls && mediaUrls.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-xl overflow-hidden bg-base-300">
                {mediaUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Media ${idx + 1}`}
                    className="w-full h-auto object-cover max-h-[300px] mx-auto"
                  />
                ))}
              </div>
            )}

            {/* Post Content */}
            <div className="py-2">
              {!isBatch && post?.title && (
                <h5 className="font-bold text-sm text-base-content mb-2">
                  {post.title}
                </h5>
              )}
              <p className="text-sm text-base-content/90 whitespace-pre-wrap leading-relaxed wrap-break-word font-medium">
                {content || (
                  <span className="text-base-content/30 italic">
                    Không có nội dung
                  </span>
                )}
              </p>
            </div>

            {/* Failed Section */}
            {status === "failed" && (
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
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-action border-t border-base-content/5 pt-4 mt-2 flex justify-between items-center">
            <span className="text-2xs text-base-content/30 font-mono">
              {isBatch ? `Batch ID: ${id}` : `ID: ${id}`}
            </span>
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-sm btn-soft px-4 rounded-xl font-semibold">
                Đóng
              </button>
              {isBatch && failCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleRetry(e);
                    (
                      document.getElementById(modalId) as HTMLDialogElement
                    )?.close();
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
