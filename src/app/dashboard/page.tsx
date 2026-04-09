import React from 'react';
import { db } from '@/lib/db';
import styles from './dashboard.module.css';
import Link from 'next/link';

async function getStats() {
  const [accountCount, messageCount, conversationCount, eventCount] = await Promise.all([
    db.platformAccount.count(),
    db.message.count(),
    db.conversation.count(),
    db.webhookEvent.count(),
  ]);

  return {
    accounts: accountCount,
    messages: messageCount,
    conversations: conversationCount,
    events: eventCount,
  };
}

async function getRecentMessages() {
  return await db.message.findMany({
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

async function getActiveAccounts() {
  return await db.platformAccount.findMany({
    take: 5,
    where: { disconnected_at: null },
    orderBy: { created_at: 'desc' }
  });
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentMessages = await getRecentMessages();
  const activeAccounts = await getActiveAccounts();

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
          <span className={`${styles.statTrend} ${styles.trendUp}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            Active
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Total Messages</span>
          <span className={styles.statValue}>{stats.messages}</span>
          <span className={`${styles.statTrend} ${styles.trendUp}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            +12% this week
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Conversations</span>
          <span className={styles.statValue}>{stats.conversations}</span>
          <span className={styles.statTrend}>
            Ongoing threads
          </span>
        </div>
        <div className={`${styles.statCard} glass`}>
          <span className={styles.statLabel}>Webhook Events</span>
          <span className={styles.statValue}>{stats.events}</span>
          <span className={`${styles.statTrend} ${styles.trendUp}`}>
            Real-time
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
              recentMessages.map((msg) => (
                <div key={msg.id} className={styles.cardItem}>
                  <div className={styles.itemIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemName}>{msg.senderId}</div>
                    <div className={styles.itemMeta}>{msg.content.substring(0, 60)}{msg.content.length > 60 ? '...' : ''}</div>
                  </div>
                  <div className={styles.itemMeta}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.itemMeta} style={{ padding: '20px', textAlign: 'center' }}>No messages yet.</div>
            )}
          </div>
        </section>

        <section className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            Top Accounts
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
