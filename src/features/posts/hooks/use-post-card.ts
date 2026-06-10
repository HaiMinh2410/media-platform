"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Post, PostStatus, BatchPublishSummary } from "../types";

export type UsePostCardProps = {
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

export function usePostCard({
  post,
  batch,
  workspaceId,
  onDelete,
}: UsePostCardProps) {
  const isBatch = !post && !!batch;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getDisplayStatus = (
    b: BatchPublishSummary | undefined,
    p: any,
  ): PostStatus => {
    if (isBatch && b) {
      if (b.status === "PROCESSING") return "processing";
      if (b.status === "SCHEDULED") return "scheduled";
      if (b.status === "SUCCESS") return "published";
      return "failed";
    } else if (p) {
      if (p.status === "published") return "published";
      if (p.status === "failed") return "failed";
      if (p.status === "processing") return "processing";

      const isFuture = p.scheduledAt && new Date(p.scheduledAt) > new Date();
      return isFuture ? "scheduled" : "processing";
    }
    return "failed";
  };

  const initialStatus = getDisplayStatus(batch, post);

  const initialAccounts = isBatch
    ? batch.accounts
    : [
        {
          id: post!.accountId,
          name: post!.account?.name || "Social User",
          platform: post!.account?.platform || "platform",
          status:
            post!.status === "scheduled"
              ? post!.scheduledAt && new Date(post!.scheduledAt) > new Date()
                ? ("SCHEDULED" as const)
                : ("PROCESSING" as const)
              : post!.status === "failed"
                ? ("FAILED" as const)
                : ("SUCCESS" as const),
          avatarUrl: post!.account?.avatarUrl,
        },
      ];

  const [status, setStatus] = useState<PostStatus>(initialStatus);
  const [accounts, setAccounts] = useState(initialAccounts);

  useEffect(() => {
    const updatedStatus = getDisplayStatus(batch, post);
    const updatedAccounts = isBatch
      ? batch.accounts
      : [
          {
            id: post!.accountId,
            name: post!.account?.name || "Social User",
            platform: post!.account?.platform || "platform",
            status:
              post!.status === "scheduled"
                ? post!.scheduledAt && new Date(post!.scheduledAt) > new Date()
                  ? ("SCHEDULED" as const)
                  : ("PROCESSING" as const)
                : post!.status === "failed"
                  ? ("FAILED" as const)
                  : ("SUCCESS" as const),
            avatarUrl: post!.account?.avatarUrl,
          },
        ];

    setStatus(updatedStatus);
    setAccounts(updatedAccounts);
  }, [post, batch, isBatch]);

  const id = isBatch ? batch.batchId : post!.id;
  const content = isBatch ? batch.content : post!.content || "";
  const mediaUrls = isBatch ? batch.mediaUrls : post!.mediaUrls;
  const scheduledAt = isBatch ? batch.scheduledAt : post!.scheduledAt;
  const createdAt = isBatch ? batch.createdAt : post!.createdAt;
  const publishedAt = isBatch ? batch.publishedAt : post!.publishedAt;
  const errorMessage = isBatch ? null : post!.errorMessage;

  const getPublishedDate = () => {
    const rawDate = publishedAt || post?.updatedAt || createdAt;
    if (!rawDate) return new Date();

    const dateObj = new Date(rawDate);
    if (scheduledAt) {
      const schedDate = new Date(scheduledAt);
      if (dateObj < schedDate) {
        return schedDate;
      }
    }
    return dateObj;
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa bài viết này?",
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    toast.loading("Đang xóa bài viết...", { id: "delete-post" });

    try {
      let response;
      if (isBatch) {
        response = await fetch(`/api/publish/history?id=${id}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch(`/api/posts/${id}`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to delete",
        );
      }

      toast.success("Xóa bài viết thành công!", { id: "delete-post" });
      if (onDelete) {
        onDelete(id);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(
        error.message || "Không thể xóa bài viết. Vui lòng thử lại sau.",
        { id: "delete-post" },
      );
      setIsDeleting(false);
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isBatch) return;

    const failedAccounts = accounts
      .filter((a) => a.status === "FAILED")
      .map((a) => ({ accountId: a.id, platform: a.platform.toUpperCase() }));

    if (failedAccounts.length === 0) return;

    setIsRetrying(true);
    toast.loading("Đang khởi tạo đăng lại...", { id: "retry-publish" });

    try {
      const response = await fetch("/api/publish/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to retry");
      }

      toast.success("Đã bắt đầu đăng lại các mục lỗi!", {
        id: "retry-publish",
      });
    } catch (error: any) {
      console.error("Retry error:", error);
      toast.error(
        error.message || "Không thể đăng lại. Vui lòng thử lại sau.",
        { id: "retry-publish" },
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (date: any) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Recently";
    }
  };

  const primaryAccount = accounts[0] || {
    name: "Social User",
    platform: "platform",
    avatarUrl: undefined,
  };

  const accountAvatar =
    primaryAccount.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryAccount.name)}&background=random&size=150`;

  const shouldShowExpand = content.length > 80;
  const failCount = accounts.filter((a) => a.status === "FAILED").length;
  const modalId = `post-detail-modal-${id}`;

  const openModal = () => {
    if (typeof document !== "undefined") {
      const modal = document.getElementById(modalId) as HTMLDialogElement;
      modal?.showModal();
    }
  };

  const isMultiAccountBatch = isBatch && accounts.length > 1;

  return {
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
  };
}
