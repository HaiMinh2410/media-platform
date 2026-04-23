import React from 'react';
import { createClient } from '@/infrastructure/supabase/server';
import { getPostRepository } from '@/infrastructure/repositories/post.repository';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { PostList } from '@/components/posts/post-list';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    redirect('/dashboard');
  }

  const postRepo = getPostRepository();
  const { data: posts } = await postRepo.findByWorkspaceId(workspace.id);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Library</h1>
          <p className="text-slate-500 text-sm">Manage your scheduled posts, drafts, and archives.</p>
        </div>
        
        <Link 
          href="/dashboard/composer"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} />
          New Post
        </Link>
      </header>

      <PostList initialPosts={posts || []} workspaceId={workspace.id} />
    </div>
  );
}
