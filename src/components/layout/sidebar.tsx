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
import { getCurrentWorkspaceIdAction, getCurrentWorkspaceUnreadCountAction, getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';
import { useUnreadRealtime } from '@/app/dashboard/inbox/hooks/use-unread-realtime';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ name: string; avatar?: string | null; role: string; workspaceName: string } | null>(null);

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
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined
    },
    {
      label: 'Leads',
      href: '/dashboard/leads',
      icon: <Users size={20} />,
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

  const refreshUnreadCount = React.useCallback(() => {
    getCurrentWorkspaceUnreadCountAction().then(res => {
      if (res.data !== null) setUnreadCount(res.data);
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
    setMounted(true);
    
    // Get workspace ID and user data
    getCurrentUserWorkspaceAction().then(res => {
      if (res.data) {
        setWorkspaceId(res.data.workspace.id);
        setUserData({
          name: res.data.user.name,
          avatar: res.data.user.avatar,
          role: res.data.user.role,
          workspaceName: res.data.workspace.name
        });
      }
    });
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Real-time updates
  useUnreadRealtime({
    workspaceId: workspaceId || '',
    onRefresh: refreshUnreadCount
  });

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
        <div className={styles.logo}>{userData?.workspaceName?.charAt(0) || 'M'}</div>
        {!isCollapsed && <span className={styles.brandName}>{userData?.workspaceName || 'Media'}</span>}
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
          <div className={styles.avatar}>
            {userData?.avatar ? <img src={userData.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (userData?.name?.charAt(0) || 'U')}
          </div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{userData?.name || 'Active User'}</p>
              <p className={styles.userRole}>{userData?.role || 'Workspace Member'}</p>
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

