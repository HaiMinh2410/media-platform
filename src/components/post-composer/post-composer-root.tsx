'use client';

import React, { useState } from 'react';
import { AccountPicker } from '@/components/publisher/account-picker';
import { ContentEditor } from './content-editor';
import { MediaUploader, MediaFile } from './media-uploader';
import { PostPreviewPanel } from '@/components/publisher/post-preview-panel';
import { SchedulingPanel } from './scheduling-panel';
import { PlatformAccount } from '@/domain/types/platform-account';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useValidation } from '@/hooks/use-validation';
import { useDraft } from '@/hooks/use-draft';
import { useEffect } from 'react';

type PostComposerRootProps = {
  accounts: PlatformAccount[];
  workspaceId: string;
};

export function PostComposerRoot({ accounts, workspaceId }: PostComposerRootProps) {
  const router = useRouter();
  
  // State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleAutoSave, clearDraft, getLocalStorageDraft } = useDraft(workspaceId);

  // Restore draft on mount
  useEffect(() => {
    const saved = getLocalStorageDraft();
    if (saved && (saved.content || saved.selectedAccountIds.length > 0 || saved.mediaFiles.length > 0)) {
      toast('Phát hiện bản nháp cũ', {
        description: 'Bạn có muốn khôi phục lại nội dung đang viết dở không?',
        action: {
          label: 'Khôi phục',
          onClick: () => {
            if (saved.content) setContent(saved.content);
            if (saved.selectedAccountIds) setSelectedAccountIds(saved.selectedAccountIds);
            if (saved.mediaFiles) setMediaFiles(saved.mediaFiles);
            toast.success('Đã khôi phục bản nháp');
          }
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

  const activePlatforms = Array.from(
    new Set(
      accounts
        .filter(a => selectedAccountIds.includes(a.id))
        .map(a => a.platform as 'facebook' | 'instagram')
    )
  );

  const validation = useValidation({
    accounts,
    selectedAccountIds,
    content,
    mediaFiles
  });

  const handlePublish = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one account');
      return;
    }
    if (!content && mediaFiles.length === 0) {
      toast.error('Post content or media is required');
      return;
    }
    
    // Check if media is still uploading or transcoding
    if (mediaFiles.some(f => f.status === 'uploading' || f.status === 'transcoding')) {
      toast.error('Please wait for media to finish uploading and processing');
      return;
    }

    if (mediaFiles.some(f => f.status === 'error' || f.status === 'transcode_error')) {
      toast.error('Có lỗi xảy ra với file đính kèm. Vui lòng kiểm tra lại.');
      return;
    }

    if (!validation.isValid) {
      toast.error('Vui lòng khắc phục các lỗi cấu hình trước khi đăng');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/publish/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          accounts: accounts
            .filter(a => selectedAccountIds.includes(a.id))
            .map(a => ({ accountId: a.id, platform: a.platform.toUpperCase() })),
          content,
          mediaUrls: mediaFiles.filter(f => f.status === 'done').map(f => f.url),
          postId: undefined, // Sẽ được mở rộng sau nếu cần liên kết với Post model
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || result.error || 'Failed to initiate publish');
      } else {
        toast.success('Quá trình đăng bài đã được khởi tạo!');
        await clearDraft();
        // Redirect về trang theo dõi trạng thái hoặc danh sách bài viết
        router.push(`/dashboard/posts?batchId=${result.batchId}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-12">

        {/* Editor Column */}
        <div className="space-y-10 pb-20">
          <header className="space-y-4">
            <Link 
              href="/dashboard/posts" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group no-underline"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              Quay lại danh sách bài viết
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-white tracking-tight">Create Post</h1>
              <p className="text-slate-400 text-lg font-medium">Compose and schedule your content across multiple platforms.</p>
            </div>
          </header>

          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccountIds}
            onChange={setSelectedAccountIds}
          />

          <div className="space-y-10 glass-card rounded-[2.5rem] p-8 md:p-10">
            <ContentEditor
              content={content}
              onChange={setContent}
              maxLength={validation.effectiveLimits.maxLength}
              issues={validation.issues}
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
          />
        </div>

        {/* Preview Column (Sticky) */}
        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <PostPreviewPanel
              content={content}
              mediaFiles={mediaFiles}
              activePlatforms={activePlatforms}
            />
          </div>
        </aside>

      </div>
    </div>
  );
}
