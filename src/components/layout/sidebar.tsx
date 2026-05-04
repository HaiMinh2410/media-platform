'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  Inbox, 
  Users, 
  PenTool, 
  Files, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentWorkspaceUnreadCountAction, getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';
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

  if (!mounted) return <aside className="fixed left-0 top-0 h-screen bg-background-secondary border-r border-foreground/10 z-50 w-[260px]" />;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-background-secondary border-r border-foreground/10 flex flex-col z-50 transition-[width,padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-x-hidden",
      isCollapsed ? "w-[80px] p-8 px-3" : "w-[260px] p-8 px-4"
    )}>
      <div className={cn(
        "flex items-center gap-3 px-4 mb-12 transition-all duration-300",
        isCollapsed && "px-0 justify-center"
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-sm flex items-center justify-center font-extrabold text-primary-content font-brand shrink-0">
          {userData?.workspaceName?.charAt(0) || 'M'}
        </div>
        {!isCollapsed && <span className="font-brand text-xl font-bold tracking-tight whitespace-nowrap">{userData?.workspaceName || 'Media'}</span>}
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center justify-between p-3 rounded-md text-foreground-secondary font-medium transition-all duration-200 relative no-underline hover:bg-foreground/5 hover:text-foreground group",
                isCollapsed && "justify-center",
                isActive && "bg-primary/10 text-foreground border border-primary/30 shadow-md shadow-primary/10",
                isCollapsed && "after:content-[attr(data-tooltip)] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:ml-3 after:px-3 after:py-1.5 after:bg-base-200 after:text-foreground after:text-xs after:rounded-sm after:whitespace-nowrap after:opacity-0 after:pointer-events-none after:transition-all after:duration-200 after:z-[100] after:border after:border-foreground/10 after:shadow-lg hover:after:opacity-100 hover:after:translate-x-1"
              )}
              data-tooltip={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-[25%] h-1/2 w-[3px] bg-primary rounded-r-sm" />
              )}
              <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
                <span className={cn("w-5 h-5 flex items-center justify-center shrink-0 transition-colors", isActive && "text-primary")}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-[0.9375rem] whitespace-nowrap">{item.label}</span>}
              </div>
              {item.badge && (
                <span className={cn(
                  "bg-primary text-primary-content text-[0.75rem] font-bold px-2 py-0.5 rounded-full leading-none transition-all",
                  isCollapsed ? "absolute top-1 right-1 text-[10px] px-1" : "relative"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "mt-auto p-2 bg-foreground/5 rounded-lg border border-foreground/10 flex flex-col gap-4 transition-all duration-300 mb-4",
        isCollapsed && "p-2 items-center"
      )}>
        <button 
          className={cn(
            "w-full h-8 bg-foreground/5 border border-foreground/10 rounded-sm text-foreground-tertiary flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-foreground/10 hover:text-foreground",
            isCollapsed && "w-8"
          )} 
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

