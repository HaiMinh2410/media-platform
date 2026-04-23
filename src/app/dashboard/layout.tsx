import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import styles from './dashboard-layout.module.css';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Toaster position="top-right" theme="dark" richColors />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
