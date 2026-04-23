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

      <PostList initialPosts={posts || []} workspaceId={workspace.id} />
    </div>
  );
}
