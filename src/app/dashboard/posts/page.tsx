import React from 'react';
import { createClient } from '@/infrastructure/supabase/server';
import { getPostRepository } from '@/infrastructure/repositories/post.repository';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { PostList } from '@/components/posts/post-list';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { BatchPublishTracker } from '@/components/publisher/batch-publish-tracker';
import { FeatureFlagService, FLAGS } from '@/application/services/feature-flag.service';
import { BatchPublishCard, BatchPublishSummary } from '@/components/publisher/batch-publish-card';
import { db } from '@/lib/db';

export default async function PostsPage({ 
  searchParams 
}: { 
  searchParams: { batchId?: string } 
}) {
  const { batchId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Canary Rollout Check
  if (!FeatureFlagService.isEnabled(user.id, FLAGS.SOCIAL_PUBLISHER_PRO, 100)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-2">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Social Publisher Pro</h2>
        <p className="text-slate-400 font-medium leading-relaxed">
          Tính năng lên lịch và quản lý bài đăng đa nền tảng đang trong giai đoạn thử nghiệm (Canary Rollout).
          Chúng tôi đang triển khai dần cho người dùng và sẽ sớm mở rộng cho tài khoản của bạn!
        </p>
      </div>
    );
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    redirect('/dashboard');
  }

  const postRepo = getPostRepository();
  const { data: posts } = await postRepo.findByWorkspaceId(workspace.id);

  // Fetch History for the "History Card" requirement
  let history: BatchPublishSummary[] = [];

  // Let's just use the DB directly for the server component
  const jobs = await db.publishJob.findMany({
    where: {
      account: {
        profile_id: user.id
      }
    },
    include: {
      account: true
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 15 
  });

  const batchesMap = new Map();
  jobs.forEach(job => {
    const bId = job.batch_id || job.id;
    if (!batchesMap.has(bId)) {
      batchesMap.set(bId, {
        id: job.id,
        batchId: bId,
        content: job.content || '',
        mediaUrls: job.media_urls || [],
        createdAt: job.created_at,
        status: 'SUCCESS',
        accounts: []
      });
    }
    const batch = batchesMap.get(bId);
    batch.accounts.push({
      id: job.account_id,
      name: job.account.name,
      platform: job.platform,
      status: job.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED'
    });
  });

  // Final status calculation for each batch
  history = Array.from(batchesMap.values()).map((batch: any) => {
    const total = batch.accounts.length;
    const success = batch.accounts.filter((a: any) => a.status === 'SUCCESS').length;
    const failed = batch.accounts.filter((a: any) => a.status === 'FAILED').length;

    if (success === total) batch.status = 'SUCCESS';
    else if (failed === total) batch.status = 'FAILED';
    else batch.status = 'PARTIAL';

    return batch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Content Library</h1>
          <p className="text-slate-400 text-lg font-medium">Manage your scheduled posts, drafts, and archives.</p>
        </div>
        
        <Link 
          href="/dashboard/composer"
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-[15px] transition-all hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          Create Post
        </Link>
      </header>
      
      {batchId && <BatchPublishTracker batchId={batchId} />}

      <PostList 
        initialPosts={posts || []} 
        initialHistory={history}
        workspaceId={workspace.id} 
      />
    </div>
  );
}
