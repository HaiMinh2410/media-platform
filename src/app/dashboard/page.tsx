import React from 'react';
import { db } from '@/lib/db';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getStats(workspaceId: string) {
  // Get all account user IDs in this workspace to filter webhook events
  const accounts = await db.platformAccount.findMany({
    where: { workspaceId },
    select: { platform_user_id: true }
  });
  const pageIds = accounts.map(a => a.platform_user_id);

  const [accountCount, messageCount, conversationCount, eventCount] = await Promise.all([
    db.platformAccount.count({ where: { workspaceId } }),
    db.message.count({ 
      where: { 
        conversation: { 
          platform_accounts: { workspaceId } 
        } 
      } 
    }),
    db.conversation.count({ 
      where: { 
        platform_accounts: { workspaceId } 
      } 
    }),
    db.webhookEvent.count({
      where: {
        externalPageId: { in: pageIds }
      }
    }),
  ]);

  return {
    accounts: accountCount,
    messages: messageCount,
    conversations: conversationCount,
    events: eventCount,
  };
}

async function getRecentMessages(workspaceId: string) {
  return await db.message.findMany({
    where: {
      conversation: { 
        platform_accounts: { workspaceId } 
      }
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      conversation: {
        include: {
          platform_accounts: true
        }
      }
    }
  });
}

async function getActiveAccounts(workspaceId: string) {
  return await db.platformAccount.findMany({
    take: 5,
    where: { 
      workspaceId,
      disconnected_at: null 
    },
    orderBy: { created_at: 'desc' }
  });
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    return (
      <div className="p-10 max-w-[1400px] mx-auto">
        <header className="mb-10">
          <h1 className="text-[2.5rem] mb-1 font-brand font-bold text-gradient">Dashboard</h1>
        </header>
        <div className="glass p-10 text-center rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <p className="text-foreground-secondary text-lg mb-6">You don't have a workspace yet. Please go to settings to set up your account.</p>
          <Link href="/dashboard/settings/accounts" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold transition-all hover:opacity-90 active:scale-[0.98]">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const stats = await getStats(workspace.id);
  const recentMessages = await getRecentMessages(workspace.id);
  const activeAccounts = await getActiveAccounts(workspace.id);

  return (
    <div className="p-10 max-w-[1400px] mx-auto">
      <header className="mb-10">
        <h1 className="text-[2.5rem] mb-1 font-brand font-bold text-gradient">Dashboard</h1>
        <p className="text-foreground-secondary text-[1.1rem]">Welcome back! Here's what's happening with your accounts today.</p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <div className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-violet-500/50">
          <span className="text-[0.875rem] text-foreground-secondary font-medium uppercase tracking-wider">Connected Accounts</span>
          <span className="text-[2rem] font-bold font-brand">{stats.accounts}</span>
          <span className="text-[0.875rem] flex items-center gap-1 text-foreground-tertiary">
            Accounts linked
          </span>
        </div>
        <div className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-violet-500/50">
          <span className="text-[0.875rem] text-foreground-secondary font-medium uppercase tracking-wider">Total Messages</span>
          <span className="text-[2rem] font-bold font-brand">{stats.messages}</span>
          <span className="text-[0.875rem] flex items-center gap-1 text-foreground-tertiary">
            Interactions recorded
          </span>
        </div>
        <div className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-violet-500/50">
          <span className="text-[0.875rem] text-foreground-secondary font-medium uppercase tracking-wider">Conversations</span>
          <span className="text-[2rem] font-bold font-brand">{stats.conversations}</span>
          <span className="text-[0.875rem] flex items-center gap-1 text-foreground-tertiary">
            Total active threads
          </span>
        </div>
        <div className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-violet-500/50">
          <span className="text-[0.875rem] text-foreground-secondary font-medium uppercase tracking-wider">Webhook Events</span>
          <span className="text-[2rem] font-bold font-brand">{stats.events}</span>
          <span className="text-[0.875rem] flex items-center gap-1 text-foreground-tertiary">
            Real-time events processed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <section className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-5">
          <div className="text-[1.25rem] font-semibold flex justify-between items-center text-foreground">
            Recent Messages
            <Link href="/dashboard/inbox" className="text-gradient text-[0.9rem]">View All</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentMessages.length > 0 ? (
              recentMessages.map((msg) => {
                const conversation = msg.conversation as any;
                return (
                  <div key={msg.id} className="p-4 rounded-[16px] bg-white/[0.02] border border-white/5 flex items-center gap-4 transition-all hover:bg-white/[0.05]">
                    <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 overflow-hidden">
                      {conversation.customer_avatar ? (
                        <img 
                          src={conversation.customer_avatar} 
                          alt={conversation.customer_name || msg.senderId} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-[0.75rem] font-bold">
                          {(conversation.customer_name || msg.senderId).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[0.95rem] text-foreground truncate">{conversation.customer_name || msg.senderId}</div>
                      <div className="text-[0.85rem] text-foreground-secondary truncate">{msg.content.substring(0, 60)}{msg.content.length > 60 ? '...' : ''}</div>
                    </div>
                    <div className="text-[0.85rem] text-foreground-tertiary shrink-0">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[0.85rem] text-foreground-tertiary p-5 text-center">No messages yet.</div>
            )}
          </div>
        </section>

        <section className="glass p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-5">
          <div className="text-[1.25rem] font-semibold flex justify-between items-center text-foreground">
            Your Accounts
            <Link href="/dashboard/settings/accounts" className="text-gradient text-[0.9rem]">Manage</Link>
          </div>
          <div className="flex flex-col gap-3">
            {activeAccounts.length > 0 ? (
              activeAccounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-[16px] bg-white/[0.02] border border-white/5 flex items-center gap-4 transition-all hover:bg-white/[0.05]">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-[12px] flex items-center justify-center text-white shrink-0 font-bold",
                      acc.platform === 'facebook' ? "bg-[#1877F2]" : 
                      acc.platform === 'instagram' ? "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]" : 
                      "bg-gradient-to-br from-indigo-500 to-violet-600"
                    )}
                  >
                    <span>{acc.platform[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[0.95rem] text-foreground truncate">{acc.platform_user_name}</div>
                    <div className="text-[0.85rem] text-foreground-secondary capitalize">{acc.platform}</div>
                  </div>
                  <span className="px-2 py-1 rounded-[6px] text-[0.75rem] font-bold uppercase bg-emerald-500/10 text-emerald-400 shrink-0">
                    Connected
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[0.85rem] text-foreground-tertiary p-5 text-center">No accounts connected.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
