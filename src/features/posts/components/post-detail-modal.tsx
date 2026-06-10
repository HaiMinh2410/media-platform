"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle2, XCircle, RefreshCcw, AlertTriangle } from "lucide-react";
import { cn } from "@shared/lib";
import { RangeSelector, AccountAvatar } from "@shared/ui";
import { CountdownTimer } from "./countdown-timer";

type PostDetailModalProps = {
  modalId: string;
  isBatch: boolean;
  isMultiAccountBatch: boolean;
  accounts: any[];
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<any>>;
  scheduledAt?: string | Date | null;
  createdAt?: string | Date;
  errorMessage?: string | null;
  getPublishedDate: () => Date;
  handleRetry: (e: React.MouseEvent) => Promise<void>;
  primaryAccount: any;
  accountAvatar?: string;
  failCount: number;
  isRetrying: boolean;
  content: string;
  mediaUrls?: string[] | null;
  id: string;
  post?: any;
};

export function PostDetailModal({
  modalId,
  isBatch,
  isMultiAccountBatch,
  accounts,
  setAccounts,
  status,
  setStatus,
  scheduledAt,
  createdAt,
  errorMessage,
  getPublishedDate,
  handleRetry,
  primaryAccount,
  accountAvatar,
  failCount,
  isRetrying,
  content,
  mediaUrls,
  id,
  post,
}: PostDetailModalProps) {
  const formatTime = (date: any) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Recently";
    }
  };

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
                              acc.status === "DELETED" && "bg-base-content/10 text-base-content/50",
                            )}
                          >
                            {acc.status === "SUCCESS" && "Đã đăng"}
                            {acc.status === "FAILED" && "Thất bại"}
                            {acc.status === "PROCESSING" && "Đang xử lý"}
                            {acc.status === "SCHEDULED" && "Lên lịch"}
                            {acc.status === "DELETED" && "Đã gỡ"}
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
          )}

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
  );
}
