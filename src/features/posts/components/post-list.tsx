"use client";

import { SlidingTabs, FilterGroup, RangeSelector, Pagination } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "@features/leads/components/double-calendar-picker";
import { Post, PostStatus } from "@features/posts/types";
import { PostCard, BatchPublishSummary } from "./post-card";
import { BatchPublishTracker } from "./publisher/batch-publish-tracker";
import { PostEmptyState } from "./post-empty-state";
import { Loader2, RefreshCw, Trash2, LayoutGrid, Table } from "lucide-react";
import { usePostList } from "../hooks/use-post-list";
import { PostTable } from "./post-table";

type PostListProps = {
  initialPosts: (Post & {
    account?: { name: string; platform: string; avatarUrl?: string };
  })[];
  initialHistory?: BatchPublishSummary[];
  workspaceId: string;
  batchId?: string;
  initialViewMode?: "card" | "table";
};

export function PostList({
  initialPosts,
  initialHistory = [],
  workspaceId,
  batchId,
  initialViewMode = "card",
}: PostListProps) {
  const {
    filter,
    setFilter,
    search,
    setSearch,
    isLoading,
    selectedGroupId,
    setSelectedGroupId,
    onChangeGroup,
    filters,
    setFilters,
    onFilterChange,
    postTypeFilter,
    setPostTypeFilter,
    sortOrder,
    setSortOrder,
    cols,
    sortedItems,
    fetchPosts,
    handleDelete,
    handleDeleteAllFailed,
    filteredPosts,
    filteredHistory,
  } = usePostList({
    initialPosts,
    initialHistory,
    workspaceId,
    batchId,
  });

  const [viewMode, setViewMode] = React.useState<"card" | "table">(initialViewMode);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const handleViewModeChange = (mode: "card" | "table") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      document.cookie = `postListViewMode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, selectedGroupId, filters.date, postTypeFilter, sortOrder]);

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCombinedFilterValue = () => {
    if (filter !== "all") return filter;
    if (postTypeFilter !== "all") return postTypeFilter;
    return "all";
  };

  const handleCombinedFilterChange = (val: string) => {
    if (val === "all") {
      setFilter("all");
      setPostTypeFilter("all");
    } else if (val === "single" || val === "batch") {
      setFilter("all");
      setPostTypeFilter(val);
    } else {
      setFilter(val as PostStatus);
      setPostTypeFilter("all");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <SlidingTabs
            items={[
              {
                value: "card",
                label: "Dạng thẻ",
                icon: LayoutGrid,
                activeBgClass: "bg-primary/10 border border-primary/15",
                activeTextClass: "text-primary font-bold",
              },
              {
                value: "table",
                label: "Dạng bảng",
                icon: Table,
                activeBgClass: "bg-primary/10 border border-primary/15",
                activeTextClass: "text-primary font-bold",
              },
            ]}
            activeValue={viewMode}
            onChange={(val) => handleViewModeChange(val as "card" | "table")}
            size="md"
            layoutId="postListViewModeIndicator"
            className="bg-base-200/30 shrink-0"
            rounded="rounded-full"
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
              triggerClassName="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80"
            />

            {/* Bộ lọc bài viết gộp (Loại & Trạng thái) */}
            <RangeSelector
              value={getCombinedFilterValue()}
              onChange={handleCombinedFilterChange}
              options={[
                { id: "all", label: "Tất cả bài viết" },
                { id: "single", label: "Đăng đơn lẻ", dividerBefore: true },
                { id: "batch", label: "Đăng loạt" },
                { id: "scheduled", label: "Scheduled", dividerBefore: true },
                { id: "published", label: "Published" },
                { id: "failed", label: "Failed" },
              ]}
              menuAlign="right"
              menuMinWidth="w-40"
              size="sm"
              hideIcon={true}
              triggerClassName="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80 font-semibold"
              dropdownClassName="bg-soft mt-0.5"
            />

            {/* Bộ sắp xếp theo thời gian tạo */}
            <RangeSelector
              value={sortOrder}
              onChange={(val) => setSortOrder(val as "desc" | "asc")}
              options={[
                {
                  id: "desc",
                  label: "Mới nhất",
                },
                {
                  id: "asc",
                  label: "Cũ nhất",
                },
              ]}
              menuAlign="right"
              menuMinWidth="w-32"
              size="sm"
              hideIcon={true}
              triggerClassName="btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80 font-semibold"
              dropdownClassName="bg-soft mt-0.5"
            />
          </FilterGroup>
        </div>
      </div>
      {batchId && (
        <BatchPublishTracker batchId={batchId} onFinished={fetchPosts} />
      )}
      {/* Grid hoặc Table */}
      {sortedItems.length > 0 ? (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              {Array.from({ length: cols }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-6">
                  {paginatedItems
                    .filter((_, idx) => idx % cols === colIdx)
                    .map((item) => (
                      <div
                        key={
                          item.type === "batch" ? `batch-${item.id}` : `post-${item.id}`
                        }
                        className="w-full"
                      >
                        {item.type === "batch" ? (
                          <PostCard
                            batch={item.data as BatchPublishSummary}
                            onDelete={handleDelete}
                            workspaceId={workspaceId}
                          />
                        ) : (
                          <PostCard
                            post={item.data as any}
                            onDelete={handleDelete}
                            workspaceId={workspaceId}
                          />
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PostTable
                items={paginatedItems}
                workspaceId={workspaceId}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Pagination Footer */}
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={sortedItems.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="bài viết"
          />
        </>
      ) : (
        <PostEmptyState
          hasFilters={
            filter !== "all" ||
            search !== "" ||
            selectedGroupId !== null ||
            filters.date !== "all" ||
            postTypeFilter !== "all"
          }
          onClear={() => {
            setFilter("all");
            setSearch("");
            setSelectedGroupId(null);
            setFilters({ date: "all" });
            setPostTypeFilter("all");
          }}
        />
      )}
    </div>
  );
}
