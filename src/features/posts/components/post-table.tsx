"use client";

import React from "react";
import { usePostCard } from "../hooks/use-post-card";
import { PostStatusBadge } from "./post-status-badge";
import { PostDetailModal } from "./post-detail-modal";
import { PlatformIcon, RangeSelector } from "@shared/ui";
import { cn } from "@shared/lib";
import {
  MoreVertical,
  Trash2,
  AlertTriangle,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { CountdownTimer } from "./countdown-timer";

type PostTableRowProps = {
  item: {
    type: "batch" | "post";
    id: string;
    date: Date;
    data: any;
  };
  workspaceId: string;
  onDelete?: (id: string) => void;
};

function PostTableRow({ item, workspaceId, onDelete }: PostTableRowProps) {
  const {
    isBatch,
    isDeleting,
    isRetrying,
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
    primaryAccount,
    accountAvatar,
    failCount,
    modalId,
    openModal,
    isMultiAccountBatch,
  } = usePostCard({
    post: item.type === "post" ? item.data : undefined,
    batch: item.type === "batch" ? item.data : undefined,
    workspaceId,
  });

  const post = item.type === "post" ? item.data : undefined;

  return (
    <tr
      className={cn(
        "hover:bg-base-content/5 transition-colors group/row border-b border-base-content/5",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* 1. Kênh đăng */}
      <td className="py-3 px-4">
        {isMultiAccountBatch ? (
          <div className="flex items-center gap-2.5">
            <div className="avatar-group -space-x-4 rtl:space-x-reverse shrink-0">
              {accounts.slice(0, 2).map((acc, index) => {
                const avatarUrl =
                  acc.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=80`;
                return (
                  <div
                    key={acc.id || index}
                    className="avatar border border-base-200"
                  >
                    <div className="size-8 rounded-full">
                      <img
                        src={avatarUrl}
                        alt={acc.name}
                        className="object-cover"
                      />
                    </div>
                  </div>
                );
              })}
              {accounts.length > 2 && (
                <div className="avatar placeholder border border-base-200">
                  <div className="bg-soft text-neutral-content size-8 rounded-full flex items-center justify-center text-xs font-bold">
                    +{accounts.length - 2}
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h5 className="font-semibold text-sm text-base-content leading-tight truncate">
                Đăng loạt bài viết
              </h5>
              <p className="text-xs text-base-content/40 leading-none mt-1">
                {accounts.length} tài khoản •{" "}
                {Array.from(
                  new Set(
                    accounts.map((a) => {
                      const p = a.platform.toLowerCase();
                      return p.charAt(0).toUpperCase() + p.slice(1);
                    })
                  )
                ).join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="relative size-10 shrink-0">
              <img
                src={accountAvatar}
                alt={primaryAccount.name}
                className="size-10 rounded-full object-cover border border-base-content/10"
              />
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-base-200 flex items-center justify-center border border-base-content/5">
                <PlatformIcon platform={primaryAccount.platform} size={13} />
              </div>
            </div>
            <div className="min-w-0">
              <h5 className="font-semibold text-sm text-base-content leading-tight truncate">
                {primaryAccount.name}
              </h5>
            </div>
          </div>
        )}
      </td>

      {/* 2. Nội dung */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 max-w-xs md:max-w-md">
          {mediaUrls && mediaUrls.length > 0 && (
            <div className="size-8 rounded-sm overflow-hidden bg-base-300 shrink-0">
              <img
                src={mediaUrls[0]}
                alt="Thumbnail"
                className="size-8 object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {item.type === "post" && item.data.title && (
              <h6 className="font-bold text-xs text-base-content truncate mb-0.5">
                {item.data.title}
              </h6>
            )}
            <p className="text-xs text-base-content/75 truncate">
              {content || (
                <span className="text-base-content/30 italic">
                  Không có nội dung
                </span>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* 3. Lịch đăng / Ngày đăng */}
      <td className="py-3 px-4">
        <div className="text-xs">
          <p className="font-medium text-base-content">
            {status === "published"
              ? format(getPublishedDate(), "HH:mm - dd/MM/yyyy")
              : format(
                  new Date(scheduledAt || createdAt),
                  "HH:mm - dd/MM/yyyy"
                )}
          </p>
          <p className="text-xs text-base-content/40 mt-0.5 font-semibold">
            {scheduledAt ? "Đặt lịch" : "Đăng trực tiếp"}
          </p>
        </div>
      </td>

      {/* 4. Trạng thái */}
      <td className="py-3 px-4">
        <div className="flex items-center">
          <PostStatusBadge status={status} />
        </div>
      </td>

      {/* 5. Thao tác */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end">
          <RangeSelector
            customTrigger={
              <button className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-200 hover:text-base-content cursor-pointer flex items-center justify-center">
                <MoreVertical size={14} />
              </button>
            }
            menuAlign="right"
            menuMinWidth="w-48"
            size="sm"
            dropdownClassName="bg-soft border-none rounded-lg p-1"
          >
            <button
              onClick={openModal}
              className="flex items-center gap-2 text-xs text-base-content/70 hover:bg-base-200 font-bold py-2 px-3 rounded-lg cursor-pointer text-left w-full transition-colors"
            >
              <Eye size={12} className="shrink-0" />
              <span>Xem chi tiết</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs text-error hover:bg-error/10 font-bold py-2 px-3 rounded-lg cursor-pointer text-left w-full transition-colors"
              >
                <Trash2 size={12} className="shrink-0" />
                <span className="truncate">
                  {status === "published"
                    ? "Gỡ bài viết (MXH & DB)"
                    : "Xóa bài viết"}
                </span>
              </button>
            )}
          </RangeSelector>
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
      </td>
    </tr>
  );
}

export type PostTableProps = {
  items: {
    type: "batch" | "post";
    id: string;
    date: Date;
    data: any;
  }[];
  workspaceId: string;
  onDelete?: (id: string) => void;
};

export function PostTable({ items, workspaceId, onDelete }: PostTableProps) {
  return (
    <div className="overflow-x-auto w-full rounded-lg border border-base-content/10 bg-base-200/40 backdrop-blur-xs">
      <table className="table table-sm w-full">
        <thead>
          <tr className="border-b border-base-content/5 text-base-content/50">
            <th className="p-4 font-semibold text-sm">Kênh đăng</th>
            <th className="p-4 font-semibold text-sm">Nội dung</th>
            <th className="p-4 font-semibold text-sm">Lịch đăng / Ngày đăng</th>
            <th className="p-4 font-semibold text-sm">Trạng thái</th>
            <th className="p-4 font-semibold text-sm text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-content/5">
          {items.map((item) => (
            <PostTableRow
              key={item.id}
              item={item}
              workspaceId={workspaceId}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
