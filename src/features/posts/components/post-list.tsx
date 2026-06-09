"use client";

import { SlidingTabs, FilterGroup } from "@shared/ui";
import { cn } from "@shared/lib";

import React, { useState } from "react";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "@features/leads/components/double-calendar-picker";
import { useInboxStore } from "@features/inbox/store/inbox.store";
import { Post, PostStatus } from "@features/posts/types";
import { PostCard, BatchPublishSummary } from "./post-card";
import { BatchPublishTracker } from "./publisher/batch-publish-tracker";
import { PostEmptyState } from "./post-empty-state";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

import { createClient } from "@shared/api/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type PostListProps = {
  initialPosts: (Post & {
    account?: { name: string; platform: string; avatarUrl?: string };
  })[];
  initialHistory?: BatchPublishSummary[];
  workspaceId: string;
  batchId?: string;
};

export function PostList({
  initialPosts,
  initialHistory = [],
  workspaceId,
  batchId,
}: PostListProps) {
  const router = useRouter();
  const [posts, setPosts] =
    useState<
      (Post & {
        account?: { name: string; platform: string; avatarUrl?: string };
      })[]
    >(initialPosts);
  const [history, setHistory] = useState<BatchPublishSummary[]>(initialHistory);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ date: string }>({ date: "all" });
  const { accountGroups } = useInboxStore();
  const supabase = createClient();

  const onChangeGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
  };

  const onFilterChange = (key: "date", value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const checkMatchesDate = (dateVal: Date | string | null | undefined) => {
    if (filters.date === "all") return true;
    if (!dateVal) return false;

    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return false;

    dateObj.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const referenceToday =
      now.getFullYear() >= 2026 ? now : new Date(2026, 4, 28);
    referenceToday.setHours(0, 0, 0, 0);

    const getFormattedDate = (d: Date) => {
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const dateValFormatted = getFormattedDate(dateObj);

    if (filters.date === "Hôm nay") {
      return dateValFormatted === getFormattedDate(referenceToday);
    } else if (filters.date === "Hôm qua") {
      const yesterday = new Date(referenceToday);
      yesterday.setDate(referenceToday.getDate() - 1);
      return dateValFormatted === getFormattedDate(yesterday);
    } else if (filters.date === "7 ngày qua") {
      const past7Days = new Date(referenceToday);
      past7Days.setDate(referenceToday.getDate() - 7);
      return dateObj >= past7Days && dateObj <= referenceToday;
    } else if (filters.date === "14 ngày qua") {
      const past14Days = new Date(referenceToday);
      past14Days.setDate(referenceToday.getDate() - 14);
      return dateObj >= past14Days && dateObj <= referenceToday;
    } else if (filters.date === "30 ngày qua") {
      const past30Days = new Date(referenceToday);
      past30Days.setDate(referenceToday.getDate() - 30);
      return dateObj >= past30Days && dateObj <= referenceToday;
    } else if (filters.date === "90 ngày qua") {
      const past90Days = new Date(referenceToday);
      past90Days.setDate(referenceToday.getDate() - 90);
      return dateObj >= past90Days && dateObj <= referenceToday;
    } else if (filters.date === "Tháng này") {
      return (
        dateObj.getMonth() === referenceToday.getMonth() &&
        dateObj.getFullYear() === referenceToday.getFullYear()
      );
    } else if (filters.date.includes(" - ")) {
      const parts = filters.date.split(" - ");
      const startParts = parts[0].split("/");
      const endParts = parts[1].split("/");

      const startDate = new Date(
        parseInt(startParts[2]),
        parseInt(startParts[1]) - 1,
        parseInt(startParts[0]),
      );
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(
        parseInt(endParts[2]),
        parseInt(endParts[1]) - 1,
        parseInt(endParts[0]),
      );
      endDate.setHours(23, 59, 59, 999);

      return dateObj >= startDate && dateObj <= endDate;
    } else {
      return dateValFormatted === filters.date;
    }
  };

  useEffect(() => {
    // Subscribe to realtime updates for publish_jobs and posts
    const channel = supabase
      .channel("public:posts_and_jobs_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "publish_jobs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newJob = payload.new as any;
            const bId = newJob.batch_id || newJob.batchId || newJob.id;
            const accountId = newJob.account_id || newJob.accountId;
            const platform = newJob.platform;
            const content = newJob.content;
            const mediaUrls = newJob.media_urls || newJob.mediaUrls || [];
            const createdAt = newJob.created_at || newJob.createdAt;

            setHistory((prev) => {
              const existingBatch = prev.find((b) => b.batchId === bId);

              if (existingBatch) {
                // If batch exists, just add the account if not already there
                return prev.map((b) => {
                  if (b.batchId === bId) {
                    if (b.accounts.some((a) => a.id === accountId))
                      return b;
                    return {
                      ...b,
                      accounts: [
                        ...b.accounts,
                        {
                          id: accountId,
                          name: "Loading...", // Temporary until refresh
                          platform: platform,
                          status: "SCHEDULED",
                        },
                      ],
                    };
                  }
                  return b;
                });
              } else {
                // Create new batch entry
                const newBatch: BatchPublishSummary = {
                  id: newJob.id,
                  batchId: bId,
                  content: content || "",
                  mediaUrls: mediaUrls,
                  createdAt: new Date(createdAt),
                  status: "SCHEDULED",
                  accounts: [
                    {
                      id: accountId,
                      name: "Loading...",
                      platform: platform,
                      status: "SCHEDULED",
                    },
                  ],
                };
                return [newBatch, ...prev];
              }
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedJob = payload.new as any;
            console.log("[Realtime Update] Received updatedJob:", updatedJob);
            const targetBatchId = updatedJob.batch_id || updatedJob.batchId || updatedJob.id;
            const targetAccountId = updatedJob.account_id || updatedJob.accountId;
            const jobStatus = updatedJob.status;
            const scheduledAt = updatedJob.scheduled_at || updatedJob.scheduledAt;

            setHistory((prev) => {
              return prev.map((batch) => {
                if (batch.batchId !== targetBatchId) {
                  return batch;
                }
                console.log("[Realtime Update] Found matching batch:", batch.batchId);

                // Find and update the specific account
                const updatedAccounts = batch.accounts.map((acc) => {
                  const isMatch = acc.id === targetAccountId;
                  console.log(`[Realtime Update] Comparing acc.id (${acc.id}) with targetAccountId (${targetAccountId}) -> match: ${isMatch}`);
                  if (isMatch) {
                    let accountStatus: "SUCCESS" | "FAILED" | "SCHEDULED" | "PROCESSING" =
                      "FAILED";
                    if (jobStatus === "COMPLETED") {
                      accountStatus = "SUCCESS";
                    } else if (jobStatus === "RUNNING") {
                      accountStatus = "PROCESSING";
                    } else if (jobStatus === "PENDING") {
                      const isFuture = scheduledAt && new Date(scheduledAt) > new Date();
                      accountStatus = isFuture ? "SCHEDULED" : "PROCESSING";
                    } else if (jobStatus === "FAILED") {
                      accountStatus = "FAILED";
                    }

                    console.log(`[Realtime Update] Setting account ${acc.id} status to: ${accountStatus}`);
                    return { ...acc, status: accountStatus };
                  }
                  return acc;
                });

                // Recalculate aggregate status
                const total = updatedAccounts.length;
                const success = updatedAccounts.filter(
                  (a) => a.status === "SUCCESS",
                ).length;
                const failed = updatedAccounts.filter(
                  (a) => a.status === "FAILED",
                ).length;
                const processing = updatedAccounts.filter(
                  (a) => a.status === "PROCESSING",
                ).length;
                const scheduled = updatedAccounts.filter(
                  (a) => a.status === "SCHEDULED",
                ).length;

                let newBatchStatus:
                  | "SUCCESS"
                  | "PARTIAL"
                  | "FAILED"
                  | "SCHEDULED"
                  | "PROCESSING" = "SCHEDULED";
                
                if (processing > 0) {
                  newBatchStatus = "PROCESSING";
                } else if (scheduled > 0) {
                  newBatchStatus = "SCHEDULED";
                } else if (success === total) {
                  newBatchStatus = "SUCCESS";
                } else if (failed === total) {
                  newBatchStatus = "FAILED";
                } else {
                  newBatchStatus = "PARTIAL";
                }

                console.log(`[Realtime Update] Calculated newBatchStatus: ${newBatchStatus} (total: ${total}, success: ${success}, failed: ${failed}, processing: ${processing}, scheduled: ${scheduled})`);

                return {
                  ...batch,
                  status: newBatchStatus,
                  accounts: updatedAccounts,
                };
              });
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedPost = payload.new as any;
            const targetPostId = updatedPost.id;
            const postStatus = updatedPost.status;
            const publishedAt = updatedPost.published_at || updatedPost.publishedAt;
            const errorMessage = updatedPost.error_message || updatedPost.errorMessage;
            const platformPostId = updatedPost.platform_post_id || updatedPost.platformPostId;
            const updatedAt = updatedPost.updated_at || updatedPost.updatedAt;

            setPosts((prev) =>
              prev.map((p) =>
                p.id === targetPostId
                  ? {
                      ...p,
                      status: postStatus as PostStatus,
                      publishedAt: publishedAt ? new Date(publishedAt) : null,
                      errorMessage: errorMessage,
                      platformPostId: platformPostId,
                      updatedAt: new Date(updatedAt),
                    }
                  : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedPost = payload.old as any;
            setPosts((prev) => prev.filter((p) => p.id !== deletedPost.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?workspaceId=${workspaceId}`);
      const result = await res.json();
      if (result.data) {
        setPosts(result.data);
      }

      // Also refresh history manually if needed
      const historyRes = await fetch(
        `/api/publish/history?workspaceId=${workspaceId}`,
      );
      const historyResult = await historyRes.json();
      if (historyResult.data) {
        setHistory(historyResult.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGroup = accountGroups.find((g) => g.id === selectedGroupId);
  const groupAccountIds = selectedGroup
    ? selectedGroup.members.map((m) => m.id)
    : [];

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = filter === "all" || post.status === filter;
    const matchesSearch =
      post.content?.toLowerCase().includes(search.toLowerCase()) ||
      post.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCluster =
      !selectedGroupId || groupAccountIds.includes(post.accountId);
    const matchesDate = checkMatchesDate(
      post.createdAt || post.scheduledAt || post.publishedAt,
    );
    return matchesStatus && matchesSearch && matchesCluster && matchesDate;
  });

  const filteredHistory = history.filter((batch) => {
    const matchesStatus =
      filter === "all" ||
      (filter === "published" && batch.status === "SUCCESS") ||
      (filter === "failed" &&
        (batch.status === "FAILED" || batch.status === "PARTIAL")) ||
      (filter === "scheduled" && batch.status === "SCHEDULED");
    const matchesSearch = batch.content
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCluster =
      !selectedGroupId ||
      !selectedGroup ||
      batch.accounts.some((acc) =>
        selectedGroup.members.some(
          (member) =>
            (acc.platformId &&
              member.externalId === acc.platformId &&
              member.platform.toLowerCase() === acc.platform.toLowerCase()) ||
            (member.name.toLowerCase() === acc.name.toLowerCase() &&
              member.platform.toLowerCase() === acc.platform.toLowerCase()) ||
            member.id === acc.id,
        ),
      );

    const matchesDate = checkMatchesDate(batch.createdAt || batch.scheduledAt);
    return matchesStatus && matchesSearch && matchesCluster && matchesDate;
  });

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setHistory((prev) => prev.filter((h) => h.batchId !== id && h.id !== id));
    router.refresh();
  };

  const handleDeleteAllFailed = async () => {
    const totalCount = filteredPosts.length + filteredHistory.length;
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tất cả ${totalCount} bài viết bị lỗi không? Action này không thể hoàn tác.`,
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    toast.loading("Đang xóa tất cả bài viết bị lỗi...", {
      id: "delete-all-failed",
    });

    try {
      const postIdsToDelete = filteredPosts.map((p) => p.id);
      const batchIdsToDelete = filteredHistory.map((h) => h.batchId);

      const deletePostsPromises = postIdsToDelete.map((id) =>
        fetch(`/api/posts/${id}`, { method: "DELETE" }),
      );
      const deleteBatchesPromises = batchIdsToDelete.map((id) =>
        fetch(`/api/publish/history?id=${id}`, { method: "DELETE" }),
      );

      const results = await Promise.all([
        ...deletePostsPromises,
        ...deleteBatchesPromises,
      ]);

      const failedRequests = results.filter((r) => !r.ok);
      if (failedRequests.length > 0) {
        throw new Error(`Có ${failedRequests.length} bài viết không thể xóa.`);
      }

      toast.success(`Đã xóa thành công tất cả ${totalCount} bài viết bị lỗi!`, {
        id: "delete-all-failed",
      });

      setPosts((prev) => prev.filter((p) => !postIdsToDelete.includes(p.id)));
      setHistory((prev) =>
        prev.filter(
          (h) =>
            !batchIdsToDelete.includes(h.batchId) &&
            !batchIdsToDelete.includes(h.id),
        ),
      );
      router.refresh();
    } catch (error: any) {
      console.error("Delete all failed error:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi xóa hàng loạt.", {
        id: "delete-all-failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {batchId && (
        <BatchPublishTracker 
          batchId={batchId} 
          onFinished={fetchPosts} 
        />
      )}
      {/* Filters Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <SlidingTabs
            items={[
              { value: "all", label: "All" },
              { value: "scheduled", label: "Scheduled" },
              { value: "published", label: "Published" },
              { value: "failed", label: "Failed" },
            ]}
            activeValue={filter}
            onChange={(val) => setFilter(val as PostStatus | "all")}
            size="sm"
            layoutId="postListFilterTabs"
          />
          {filter === "failed" &&
            (filteredPosts.length > 0 || filteredHistory.length > 0) && (
              <button
                onClick={handleDeleteAllFailed}
                className="btn btn-soft btn-error btn-sm rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                Xóa tất cả lỗi ({filteredPosts.length + filteredHistory.length})
              </button>
            )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            disabled={isLoading}
            className="btn btn-ghost border border-base-content/5 bg-base-200/30 hover:bg-base-200 rounded-xl p-2.5 text-base-content/60 hover:text-base-content transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
          <FilterGroup>
            <ClusterSelector
              workspaceId={workspaceId}
              selectedGroupId={selectedGroupId}
              onChangeGroup={onChangeGroup}
              triggerClassName={cn(
                "btn btn-soft btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                selectedGroupId &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />

            {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
            <DoubleCalendarPicker
              selectedDate={filters.date}
              onSelectDate={(date) => onFilterChange("date", date)}
              triggerClassName={cn(
                "btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                filters.date !== "all" &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />
          </FilterGroup>
        </div>
      </div>

      {/* Grid */}
      {filteredPosts.length > 0 || filteredHistory.length > 0 ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:balance] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredHistory.map((batch) => (
            <div
              key={batch.batchId}
              className="break-inside-avoid mb-6 inline-block w-full"
            >
              <PostCard
                batch={batch}
                onDelete={handleDelete}
                workspaceId={workspaceId}
              />
            </div>
          ))}
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="break-inside-avoid mb-6 inline-block w-full"
            >
              <PostCard
                post={post}
                onDelete={handleDelete}
                workspaceId={workspaceId}
              />
            </div>
          ))}
        </div>
      ) : (
        <PostEmptyState
          hasFilters={
            filter !== "all" ||
            search !== "" ||
            selectedGroupId !== null ||
            filters.date !== "all"
          }
          onClear={() => {
            setFilter("all");
            setSearch("");
            setSelectedGroupId(null);
            setFilters({ date: "all" });
          }}
        />
      )}
    </div>
  );
}
