"use client";

import { cn } from "@shared/lib";
import { RangeSelector, AccountAvatar } from "@shared/ui";

import React from "react";
import { Post, BatchPublishSummary } from "@features/posts/types";
import { PostStatusBadge } from "./post-status-badge";
import { PostDetailModal } from "./post-detail-modal";
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
                  {visibleAccounts.map((acc, index) => (
                    <AccountAvatar
                      key={acc.id || index}
                      avatarUrl={acc.avatarUrl}
                      name={acc.name}
                      platform={acc.platform}
                      size={8}
                      showPlatformIcon={false}
                      className="border-3 border-base-200 rounded-full"
                    />
                  ))}
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
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-1.5 hover:bg-base-100/50 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AccountAvatar
                          avatarUrl={acc.avatarUrl}
                          name={acc.name}
                          platform={acc.platform}
                          size={10}
                          showPlatformIcon={true}
                        />
                        <div className="min-w-0">
                            <h6 className="font-bold text-xs text-base-content leading-tight truncate">
                              {acc.name}
                            </h6>
                          </div>
                        </div>
                        {acc.status && (
                          <span
                            className={cn(
                              "badge badge-xs border-0 font-bold text-3xs px-1.5 py-0.5 rounded-full shrink-0",
                              acc.status === "SUCCESS" && "bg-success/15 text-success",
                              acc.status === "FAILED" && "bg-error/15 text-error",
                              acc.status === "PROCESSING" && "bg-warning/15 text-warning animate-pulse",
                              acc.status === "SCHEDULED" && "bg-info/15 text-info",
                              (acc.status as string) === "DELETED" && "bg-base-content/10 text-base-content/50",
                            )}
                          >
                            {acc.status === "SUCCESS" && "Đã đăng"}
                            {acc.status === "FAILED" && "Thất bại"}
                            {acc.status === "PROCESSING" && "Đang xử lý"}
                            {acc.status === "SCHEDULED" && "Lên lịch"}
                            {(acc.status as string) === "DELETED" && "Đã gỡ"}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </RangeSelector>
          ) : (
            <div className="avatar-group -space-x-5 rtl:space-x-reverse shrink-0">
              {visibleAccounts.map((acc, index) => (
                <AccountAvatar
                  key={acc.id || index}
                  avatarUrl={acc.avatarUrl}
                  name={acc.name}
                  platform={acc.platform}
                  size={10}
                  showPlatformIcon={false}
                  className="border-3 border-base-200 rounded-full"
                />
              ))}
              {extraCount > 0 && (
                <div className="avatar placeholder border-3 border-base-200">
                  <div className="bg-soft text-neutral-content size-10 rounded-full flex items-center justify-center text-xs font-bold">
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
        <AccountAvatar
          avatarUrl={accountAvatar}
          name={primaryAccount.name}
          platform={primaryAccount.platform}
          size={10}
          showPlatformIcon={accounts.length === 1}
        />
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
                <span className="text-xs font-bold text-error/80 tracking-wide flex items-center gap-1">
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
      <PostDetailModal
        modalId={modalId}
        isBatch={isBatch}
        isMultiAccountBatch={isMultiAccountBatch}
        accounts={accounts}
        setAccounts={setAccounts}
        status={status}
        setStatus={setStatus}
        scheduledAt={scheduledAt}
        createdAt={createdAt}
        errorMessage={errorMessage}
        getPublishedDate={getPublishedDate}
        handleRetry={handleRetry}
        primaryAccount={primaryAccount}
        accountAvatar={accountAvatar}
        failCount={failCount}
        isRetrying={isRetrying}
        content={content}
        mediaUrls={mediaUrls}
        id={id}
        post={post}
      />
    </div>
  );
}
