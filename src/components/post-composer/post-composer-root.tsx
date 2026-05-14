'use client';

import React, { useState, useEffect } from 'react';
import { AccountPicker } from '@/components/publisher/account-picker';
import { ContentEditor } from './content-editor';
import { MediaUploader, MediaFile } from './media-uploader';
import { PostPreviewPanel } from '@/components/publisher/post-preview-panel';
import { SchedulingPanel } from './scheduling-panel';
import { PlatformAccount } from '@/domain/types/platform-account';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Lock } from 'lucide-react';
import { useValidation } from '@/hooks/use-validation';
import { useDraft } from '@/hooks/use-draft';
import { motion, AnimatePresence } from 'framer-motion';

type PostComposerRootProps = {
  accounts: any[];
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
        .map(a => a.platform.toLowerCase() as 'facebook' | 'instagram')
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

  const hasInstagram = activePlatforms.includes('instagram');
  const hasLink = /https?:\/\/[^\s]+/.test(content);
  const igAccountNames = accounts
    .filter(a => selectedAccountIds.includes(a.id) && a.platform.toLowerCase() === 'instagram')
    .map(a => a.name)
    .join(', ');

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white font-sans selection:bg-[#4f7cff]/30">
      {/* Top Navbar / Header */}
      <div className="h-14 bg-[#161920] border-b border-[#2a2f42] flex items-center px-6 justify-between">
        <Link 
          href="/dashboard/posts" 
          className="inline-flex items-center gap-2 text-[#7a7a9a] hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          SocialPub Pro
        </Link>
        <div className="flex items-center gap-4 text-[#7a7a9a] text-[11px] uppercase tracking-widest font-mono">
          <span className="hover:text-white cursor-pointer transition-colors">📅 Lịch</span>
          <span className="hover:text-white cursor-pointer transition-colors">📊 Báo cáo</span>
          <span className="hover:text-white cursor-pointer transition-colors">👤 Tài khoản</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-10">

          {/* LEFT COLUMN (Composer) */}
          <div className="space-y-6 pb-20">
            <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              ✍️ SOẠN BÀI ĐĂNG
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
                    className="flex items-start gap-3 bg-[#fff8e7] border border-[#f5a623] rounded-lg px-4 py-3 text-[#7a5a00] shadow-sm"
                  >
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="text-[13px] leading-[1.6]">
                      <span className="font-bold">Link không nhấp được trên Instagram của:</span> {igAccountNames}
                    </div>
                  </motion.div>
                )}
                
                {hasInstagram && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-3 bg-[#dce8ff] border-[1.5px] border-[#2d5be3] rounded-lg px-4 py-2.5 text-[#1a3a8c] shadow-sm"
                  >
                    <Lock size={15} className="shrink-0" />
                    <div className="text-[12px] flex-1">
                      Tỷ lệ ảnh khóa theo IG: 1:1 / 4:5 / 16:9
                    </div>
                    <div className="text-[11px] text-[#2d5be3] font-medium">
                      Tối đa 10 media · Strictest Rule đang áp dụng
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-[12px] overflow-hidden flex flex-col">
              <ContentEditor
                content={content}
                onChange={setContent}
                maxLength={validation.effectiveLimits.maxLength}
                issues={validation.issues}
                hasInstagram={hasInstagram}
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

            <div className="flex items-center gap-4">
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="flex-1 bg-[#4f7cff] hover:bg-[#3d6bed] disabled:opacity-50 text-white font-bold text-[13px] h-[48px] rounded-[6px] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Đang xử lý...' : '🚀 Đăng ngay'}
                {!isSubmitting && selectedAccountIds.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px]">[{selectedAccountIds.length}]</span>
                )}
              </button>
              <button 
                className="w-32 bg-[#252836] hover:bg-[#2a2f42] text-white font-bold text-[13px] h-[48px] rounded-[6px] transition-all border border-[#2a2f42]"
              >
                💾 Lưu nháp
              </button>
            </div>
            
          </div>

          {/* RIGHT COLUMN (Preview) */}
          <aside className="hidden xl:block border-l border-[#2a2f42] border-dashed pl-10 relative">
            <div className="sticky top-8">
              <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                👁️ XEM TRƯỚC
              </h2>
              <PostPreviewPanel
                content={content}
                mediaFiles={mediaFiles}
                activePlatforms={activePlatforms}
                accounts={accounts.filter(a => selectedAccountIds.includes(a.id))}
              />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

