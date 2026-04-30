'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.css';
import { 
  LayoutDashboard, 
  BarChart3, 
  Inbox, 
  Users, 
  PenTool, 
  Files, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    exact: true
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'Inbox',
    href: '/dashboard/inbox',
    icon: <Inbox size={20} />,
    badge: '3'
  },
  {
    label: 'Accounts',
    href: '/dashboard/settings/accounts',
    icon: <Users size={20} />,
  },
  {
    label: 'Composer',
    href: '/dashboard/composer',
    icon: <PenTool size={20} />,
  },
  {
    label: 'Posts',
    href: '/dashboard/posts',
    icon: <Files size={20} />,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings size={20} />,
    exact: true
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '260px');
    }
  }, [isCollapsed, mounted]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  if (!mounted) return <aside className={styles.sidebar} />;

  return (
    <aside className={clsx(styles.sidebar, isCollapsed && styles.collapsed)}>
      <div className={clsx(styles.brand, isCollapsed && styles.collapsed)}>
        <div className={styles.logo}>M</div>
        {!isCollapsed && <span className={styles.brandName}>Media</span>}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.active)}
              data-tooltip={isCollapsed ? item.label : undefined}
            >
              {isActive && <div className={styles.activeIndicator} />}
              <div className={styles.navContent}>
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.label}>{item.label}</span>}
              </div>
              {item.badge && (
                <span className={clsx(styles.badge, isCollapsed && styles.badgeCollapsed)}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={clsx(styles.footer, isCollapsed && styles.collapsed)}>
        <div className={clsx(styles.user, isCollapsed && styles.collapsed)}>
          <div className={styles.avatar}>U</div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>Active User</p>
              <p className={styles.userRole}>Workspace Member</p>
            </div>
          )}
        </div>
        
        <button 
          className={clsx(styles.toggleBtn, isCollapsed && styles.collapsed)} 
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
