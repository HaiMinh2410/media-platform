import React from 'react';
import styles from './inbox.module.css';

export const metadata = {
  title: 'Inbox | Media Platform',
};

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.inboxContainer}>
      {/* 
        This is a placeholder for the Conversation List sidebar. 
        It will be implemented in T049.
      */}
      <aside className={styles.conversationSidebar}>
        <div className={styles.placeholderList}>
          <h2>Inbox</h2>
          <p>Conversation list will appear here.</p>
        </div>
      </aside>
      
      {/* 
        The main chat area. 
        It will display either the empty state (page.tsx) or a specific conversation ([id]/page.tsx). 
      */}
      <main className={styles.chatArea}>
        {children}
      </main>
    </div>
  );
}
