'use client';

import React, { useState } from 'react';
import { PlatformSelector } from './platform-selector';
import { ContentEditor } from './content-editor';
import { MediaUploader } from './media-uploader';
import { PostPreview } from './post-preview';
import { SchedulingPanel } from './scheduling-panel';
import { PlatformAccount } from '@/domain/types/platform-account';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type PostComposerRootProps = {
  accounts: PlatformAccount[];
  workspaceId: string;
};

export function PostComposerRoot({ accounts, workspaceId }: PostComposerRootProps) {
  const router = useRouter();
  
  // State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{ id: string; url: string; status: 'uploading' | 'done' | 'error'; type: 'image' | 'video'; progress: number; alt?: string }[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state for preview
  const primaryAccountId = selectedAccountIds[0];
  const primaryAccount = accounts.find(a => a.id === primaryAccountId);
  const previewPlatform = primaryAccount?.platform === 'instagram' ? 'instagram' : 'facebook';

  const handlePublish = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one account');
      return;
    }
    if (!content && mediaFiles.length === 0) {
      toast.error('Post content or media is required');
      return;
    }
    
    // Check if media is still uploading
    if (mediaFiles.some(f => f.status === 'uploading')) {
      toast.error('Please wait for media to finish uploading');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          accountIds: selectedAccountIds,
          content,
          mediaUrls: mediaFiles.filter(f => f.status === 'done').map(f => f.url),
          scheduledAt: scheduledAt?.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to create post');
      } else {
        toast.success(scheduledAt ? 'Post scheduled successfully' : 'Post published successfully');
        router.push('/dashboard');
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
    <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8">
      {/* Editor Column */}
      <div className="space-y-8 pb-20">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Create Post</h1>
          <p className="text-slate-500 text-sm">Compose and schedule your content across multiple platforms.</p>
        </header>

        <PlatformSelector 
          accounts={accounts} 
          selectedIds={selectedAccountIds} 
          onChange={setSelectedAccountIds} 
        />

        <div className="space-y-8 bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
          <ContentEditor 
            content={content} 
            onChange={setContent} 
          />
          
          <MediaUploader 
            files={mediaFiles} 
            onChange={setMediaFiles} 
            workspaceId={workspaceId} 
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
          <PostPreview 
            content={content} 
            mediaUrls={mediaFiles.filter(f => f.status === 'done').map(f => f.url)} 
            platform={previewPlatform}
          />
        </div>
      </aside>
    </div>
  );
}
