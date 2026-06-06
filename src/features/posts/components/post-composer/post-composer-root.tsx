"use client";

import React, { useState, useEffect } from "react";
import { AccountPicker } from "@features/posts/components/publisher/account-picker";
import { ContentEditor } from "./content-editor";
import { MediaUploader, MediaFile } from "./media-uploader";
import { PostPreviewPanel } from "@features/posts/components/publisher/post-preview-panel";
import {
  BatchPublishToast,
  AccountPublishState,
} from "@features/posts/components/publisher/batch-publish-toast";
import { SchedulingPanel } from "./scheduling-panel";
import { PlatformAccount } from "@features/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Lock,
  PenSquare,
  Eye,
} from "lucide-react";
import { useValidation } from "@features/posts/hooks/use-validation";
import { useDraft } from "@features/posts/hooks/use-draft";
import { motion, AnimatePresence } from "framer-motion";

type PostComposerRootProps = {
  accounts: any[];
  workspaceId: string;
};

export function PostComposerRoot({
  accounts,
  workspaceId,
}: PostComposerRootProps) {
  const router = useRouter();

  // State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPublishToast, setShowPublishToast] = useState(false);
  const [publishProgress, setPublishProgress] = useState<AccountPublishState[]>(
    [],
  );

  const { handleAutoSave, clearDraft, getLocalStorageDraft } =
    useDraft(workspaceId);

  // Restore draft on mount
  useEffect(() => {
    const saved = getLocalStorageDraft();
    if (
      saved &&
      (saved.content ||
        saved.selectedAccountIds.length > 0 ||
        saved.mediaFiles.length > 0)
    ) {
      toast("Phát hiện bản nháp cũ", {
        description: "Bạn có muốn khôi phục lại nội dung đang viết dở không?",
        action: {
          label: "Khôi phục",
          onClick: () => {
            if (saved.content) setContent(saved.content);
            if (saved.selectedAccountIds)
              setSelectedAccountIds(saved.selectedAccountIds);
            if (saved.mediaFiles) setMediaFiles(saved.mediaFiles);
            toast.success("Đã khôi phục bản nháp");
          },
        },
        duration: 8000,
      });
    }
  }, []); // Run once on mount

  // Auto-save effect
  useEffect(() => {
    if (content || selectedAccountIds.length > 0 || mediaFiles.length > 0) {
      const timer = setTimeout(() => {
        handleAutoSave({ content, selectedAccountIds, mediaFiles });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, selectedAccountIds, mediaFiles, handleAutoSave]);

  // Cleanup legacy accounts from selection (e.g. if restored from a draft)
  useEffect(() => {
    if (selectedAccountIds.length > 0 && accounts.length > 0) {
      const validSelectedIds = selectedAccountIds.filter((id) => {
        const account = accounts.find((a) => a.id === id);
        return account && !(account as any).is_legacy;
      });

      if (validSelectedIds.length !== selectedAccountIds.length) {
        setSelectedAccountIds(validSelectedIds);
      }
    }
  }, [accounts, selectedAccountIds]);

  const selectedAccounts = accounts.filter((a) =>
    selectedAccountIds.includes(a.id),
  );
  const activePlatforms = Array.from(
    new Set(
      selectedAccounts.map(
        (a) => a.platform.toLowerCase() as "facebook" | "instagram",
      ),
    ),
  );

  const validation = useValidation({
    accounts,
    selectedAccountIds,
    content,
    mediaFiles,
  });

  const handlePublish = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error("Please select at least one account");
      return;
    }
    if (!content && mediaFiles.length === 0) {
      toast.error("Post content or media is required");
      return;
    }

    // Check if media is still uploading or transcoding
    if (
      mediaFiles.some(
        (f) => f.status === "uploading" || f.status === "transcoding",
      )
    ) {
      toast.error("Please wait for media to finish uploading and processing");
      return;
    }

    if (
      mediaFiles.some(
        (f) => f.status === "error" || f.status === "transcode_error",
      )
    ) {
      toast.error("Có lỗi xảy ra với file đính kèm. Vui lòng kiểm tra lại.");
      return;
    }

    if (!validation.isValid) {
      toast.error("Vui lòng khắc phục các lỗi cấu hình trước khi đăng");
      return;
    }

    setIsSubmitting(true);

    // Prepare initial progress state for toast
    const initialProgress: AccountPublishState[] = selectedAccounts.map(
      (acc) => ({
        id: acc.id,
        name: acc.name,
        platform: acc.platform,
        status: "PENDING",
        avatar_url: acc.avatar_url,
      }),
    );

    setPublishProgress(initialProgress);
    setShowPublishToast(true);

    try {
      const response = await fetch("/api/publish/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          accounts: selectedAccounts.map((a) => ({
            accountId: a.id,
            platform: a.platform.toUpperCase(),
          })),
          content,
          mediaUrls: mediaFiles
            .filter((f) => f.status === "done")
            .map((f) => f.url),
          scheduledAt: scheduledAt?.toISOString(),
          postId: undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.message || result.error || "Failed to initiate publish",
        );
        setShowPublishToast(false);
      } else {
        toast.success("Quá trình đăng bài đã được khởi tạo!");
        await clearDraft();
        setTimeout(() => {
          router.push(`/dashboard/posts?batchId=${result.batchId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An unexpected error occurred");
      setShowPublishToast(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasInstagram = activePlatforms.includes("instagram");
  const hasLink = /https?:\/\/[^\s]+/.test(content);
  const igAccountNames = selectedAccounts
    .filter((a) => a.platform.toLowerCase() === "instagram")
    .map((a) => a.name)
    .join(", ");

  return (
    <div className="min-h-screen space-y-8">
      {/* Top Navbar / Header */}
      <div className="h-14 border-b border-base-content/5 flex items-center justify-between">
        <Link
          href="/dashboard/posts"
          className="inline-flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          SocialPub Pro
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN (Composer) */}
        <div className="xl:col-span-8 space-y-6">
          <h2 className="flex items-center text-lg font-semibold text-base-content/40 tracking-wide gap-2">
            <PenSquare size={14} />
            Soạn bài đăng
          </h2>

          <div className="space-y-4">
            <AccountPicker
              accounts={accounts}
              selectedIds={selectedAccountIds}
              onChange={setSelectedAccountIds}
            />

            <AnimatePresence>
              {hasLink && hasInstagram && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="alert alert-warning bg-warning/10 border-warning/20 text-warning text-xs rounded-xl items-start gap-3 shadow-xs"
                >
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Link sẽ không thể nhấp được trên Instagram của{" "}
                    <span className="font-bold">{igAccountNames}</span>
                  </div>
                </motion.div>
              )}

              {hasInstagram && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="alert alert-info bg-info/10 border-info/20 text-info text-xs rounded-xl items-center gap-3 shadow-xs"
                >
                  <Lock size={15} className="shrink-0" />
                  <div className="flex-1">
                    Tỷ lệ ảnh tự động khóa theo chuẩn Instagram: 1:1 / 4:5 /
                    16:9 — tối đa 10 media
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-base-200 border border-base-content/5 shadow-inner rounded-2xl overflow-hidden flex flex-col">
            <ContentEditor
              content={content}
              onChange={setContent}
              maxLength={validation.effectiveLimits.maxLength}
              mediaCount={mediaFiles.length}
              issues={validation.issues}
              hasInstagram={hasInstagram}
              platformCount={activePlatforms.length}
            />

            <MediaUploader
              files={mediaFiles}
              onChange={setMediaFiles}
              workspaceId={workspaceId}
              maxFiles={validation.effectiveLimits.maxMedia}
              issues={validation.issues}
            />
          </div>

          <SchedulingPanel
            scheduledAt={scheduledAt}
            onChange={setScheduledAt}
            isSubmitting={isSubmitting}
            onPublish={handlePublish}
            selectedAccountCount={selectedAccountIds.length}
          />
        </div>

        {/* RIGHT COLUMN (Preview) */}
        <aside className="hidden xl:block xl:col-span-4 border-l border-base-content/10 border-dashed pl-8 relative">
          <div className="sticky top-8">
            <h2 className="flex items-center text-lg font-semibold text-base-content/40 tracking-wide gap-2 mb-6">
              <Eye size={14} />
              Xem trước
            </h2>
            <PostPreviewPanel
              content={content}
              mediaFiles={mediaFiles}
              activePlatforms={activePlatforms}
              accounts={selectedAccounts}
            />
          </div>
        </aside>
      </div>

      {/* Batch Publish Toast */}
      <AnimatePresence>
        {showPublishToast && (
          <BatchPublishToast
            initialAccounts={publishProgress}
            onClose={() => setShowPublishToast(false)}
            onRetry={(failedIds) => {
              console.log("Retrying for accounts:", failedIds);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
