"use client";

import React from "react";
import { usePostCard } from "../hooks/use-post-card";
import { PostStatusBadge } from "./post-status-badge";
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
    onDelete,
  });

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

        {/* Modal Xem chi tiết (copy từ PostCard) */}
        <dialog id={modalId} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box p-6 border border-base-content/10 bg-base-100 rounded-3xl shadow-2xl max-w-xl text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-content/5 pb-4 mb-4">
              {isMultiAccountBatch ? (
                <div className="flex items-center gap-3.5">
                  <div className="avatar-group -space-x-5 rtl:space-x-reverse shrink-0">
                    {accounts.slice(0, 2).map((acc, idx) => {
                      const avatarUrl =
                        acc.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=random&size=80`;
                      return (
                        <div
                          key={acc.id || idx}
                          className="avatar border border-base-200"
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
                    {accounts.length > 2 && (
                      <div className="avatar placeholder border border-base-200">
                        <div className="bg-soft text-neutral-content size-8 rounded-full flex items-center justify-center text-xs font-bold">
                          +{accounts.length - 2}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-base-content leading-tight">
                      Đăng loạt bài viết
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs text-base-content/40 leading-none">
                        {status === "published"
                          ? format(getPublishedDate(), "HH:mm:ss - dd/MM")
                          : format(
                              new Date(scheduledAt || createdAt),
                              "HH:mm:ss - dd/MM"
                            )}
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
                            })
                          )
                        ).join(" & ")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0">
                    <img
                      src={accountAvatar}
                      alt={primaryAccount.name}
                      className="size-10 rounded-full object-cover border border-base-content/10"
                    />
                    <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-base-200 flex items-center justify-center">
                      <PlatformIcon
                        platform={primaryAccount.platform}
                        size={12}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-content leading-tight">
                      {primaryAccount.name}
                    </h4>
                    <p className="text-xs text-base-content/40 mt-1.5 font-medium leading-none">
                      {status === "published"
                        ? format(getPublishedDate(), "HH:mm:ss - dd/MM")
                        : format(
                            new Date(scheduledAt || createdAt),
                            "HH:mm:ss - dd/MM"
                          )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {scheduledAt ? (
                  status === "published" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-success/15 text-success border-success/35">
                      <Calendar size={13} className="shrink-0" />
                      Thành công
                    </span>
                  ) : status === "failed" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-error/15 text-error border-error/35">
                      <Calendar size={13} className="shrink-0" />
                      Thất bại
                    </span>
                  ) : status === "processing" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-warning/15 text-warning border-warning/35 animate-pulse">
                      <Calendar size={13} className="shrink-0" />
                      Đang xử lý
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-info/15 text-info border-info/35">
                      <Calendar size={13} className="shrink-0" />
                      Đã lên lịch
                    </span>
                  )
                ) : status === "published" ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-success/10 text-success border-success/35">
                    <CheckCircle2 size={13} className="shrink-0" />
                    Thành công
                  </span>
                ) : status === "failed" ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-error/15 text-error border-error/35">
                    <XCircle size={13} className="shrink-0" />
                    Thất bại
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wider border bg-warning/15 text-warning border-warning/35 animate-pulse">
                    <RefreshCcw size={13} className="animate-spin shrink-0" />
                    Đang đăng...
                  </span>
                )}
              </div>
            </div>

            {/* Publishing Info */}
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

              {status === "scheduled" && scheduledAt && (
                <CountdownTimer
                  targetDate={scheduledAt}
                  className="scale-95 origin-right"
                  onComplete={() => {
                    setStatus("published");
                    if (isBatch) {
                      setAccounts((prev) =>
                        prev.map((a) => ({ ...a, status: "SUCCESS" }))
                      );
                    }
                  }}
                />
              )}
            </div>

            {/* Modal Body */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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

              <div className="py-2">
                {item.type === "post" && item.data.title && (
                  <h5 className="font-bold text-sm text-base-content mb-2">
                    {item.data.title}
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
