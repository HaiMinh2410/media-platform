import React from 'react';
import { db } from '@/lib/db';
import styles from './dashboard.module.css';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';

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
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={`${styles.title} text-gradient`}>Dashboard</h1>
        </header>
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <p>You don't have a workspace yet. Please go to settings to set up your account.</p>
          <Link href="/dashboard/settings/accounts" className="button-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Go to Settings</Link>
        </div>
      </div>
    );
  }

  const stats = await getStats(workspace.id);
  const recentMessages = await getRecentMessages(workspace.id);
  const activeAccounts = await getActiveAccounts(workspace.id);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.title} text-gradient`}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back! Here's what's happening with your accounts today.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Connected Accounts</span>
          <span className={styles.statValue}>{stats.accounts}</span>
          <span className={styles.statTrend}>
            Accounts linked
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Total Messages</span>
          <span className={styles.statValue}>{stats.messages}</span>
          <span className={styles.statTrend}>
            Interactions recorded
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Conversations</span>
          <span className={styles.statValue}>{stats.conversations}</span>
          <span className={styles.statTrend}>
            Total active threads
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Webhook Events</span>
          <span className={styles.statValue}>{stats.events}</span>
          <span className={styles.statTrend}>
            Real-time events processed
          </span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            Recent Messages
            <Link href="/inbox" className="text-gradient" style={{ fontSize: '0.9rem' }}>View All</Link>
          </div>
          <div className={styles.cardList}>
            {recentMessages.length > 0 ? (
              recentMessages.map((msg) => {
                const conversation = msg.conversation as any;
                return (
                  <div key={msg.id} className={styles.cardItem}>
                    <div className={styles.itemIcon} style={{ overflow: 'hidden', padding: 0 }}>
                      {conversation.customer_avatar ? (
                        <img 
                          src={conversation.customer_avatar} 
                          alt={conversation.customer_name || msg.senderId} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifySelf: 'center', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {(conversation.customer_name || msg.senderId).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemName}>{conversation.customer_name || msg.senderId}</div>
                      <div className={styles.itemMeta}>{msg.content.substring(0, 60)}{msg.content.length > 60 ? '...' : ''}</div>
                    </div>
                    <div className={styles.itemMeta}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.itemMeta} style={{ padding: '20px', textAlign: 'center' }}>No messages yet.</div>
            )}
          </div>
        </section>

        <section className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            Your Accounts
            <Link href="/dashboard/settings/accounts" className="text-gradient" style={{ fontSize: '0.9rem' }}>Manage</Link>
          </div>
          <div className={styles.cardList}>
            {activeAccounts.length > 0 ? (
              activeAccounts.map((acc) => (
                <div key={acc.id} className={styles.cardItem}>
                  <div className={styles.itemIcon} style={{ background: acc.platform === 'facebook' ? '#1877F2' : acc.platform === 'instagram' ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' : 'var(--accent-gradient)' }}>
                    <span>{acc.platform[0].toUpperCase()}</span>
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemName}>{acc.platform_user_name}</div>
                    <div className={styles.itemMeta}>{acc.platform}</div>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeSuccess}`}>Connected</span>
                </div>
              ))
            ) : (
              <div className={styles.itemMeta} style={{ padding: '20px', textAlign: 'center' }}>No accounts connected.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
