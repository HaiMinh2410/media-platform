'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Palette,
  Sparkles,
  Activity
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { getCurrentWorkspaceUnreadCountAction, getCurrentUserWorkspaceAction } from '@features/settings/actions/workspace.actions';
import { useUnreadRealtime } from '@features/inbox/hooks/use-unread-realtime';
import { FeatureFlagService, FLAGS } from '@shared/lib/feature-flag.service';
import { ThemeSwitcher } from '@shared/ui/theme-switcher';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ id: string; name: string; avatar?: string | null; role: string; workspaceName: string } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPublisherProEnabled = React.useMemo(() => {
    return FeatureFlagService.isEnabled(userData?.id, FLAGS.SOCIAL_PUBLISHER_PRO, 100);
  }, [userData?.id]);

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
      label: 'Posts',
      href: '/dashboard/posts',
      icon: <Files size={20} />,
      matchPaths: ['/dashboard/posts', '/dashboard/composer']
    },
    {
      label: 'Settings',
      href: '/dashboard/settings/accounts',
      icon: <Settings size={20} />,
    },
  ];

  const refreshUnreadCount = React.useCallback(() => {
    getCurrentWorkspaceUnreadCountAction().then(res => {
      if (res.data !== null) setUnreadCount(res.data);
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    
    getCurrentUserWorkspaceAction().then(res => {
      if (res.data) {
        setWorkspaceId(res.data.workspace.id);
        setUserData({
          id: res.data.user.id,
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
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '260px');
    }
  }, [isCollapsed, mounted]);

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const darkThemes = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'night', 'coffee', 'dim', 'sunset', 'abyss'];
      setIsDark(darkThemes.includes(theme));
    };

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    checkTheme();
    return () => {
      observer.disconnect();
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);


  if (!mounted) return <aside className="fixed left-0 top-0 h-screen bg-background-secondary border-r border-foreground/10 z-50 w-[260px]" />;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-background-secondary border-r border-foreground/10 flex flex-col z-50 transition-[width,padding] duration-300 ease-in-out overflow-x-hidden",
        isCollapsed ? "w-[80px] p-8 px-3" : "w-[260px] p-8 px-4"
      )}
      onMouseEnter={() => {
        hoverTimeoutRef.current = setTimeout(() => {
          setIsCollapsed(false);
        }, 300);
      }}
      onMouseLeave={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setIsCollapsed(true);
      }}
    >
      <div className={cn(
        "flex items-center gap-3 px-4 mb-12 transition-all duration-300",
        isCollapsed && "px-0 justify-center"
      )}>
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img 
            src={isDark ? "/logo-white.png" : "/logo-black.png"} 
            alt="Logo" 
            className="w-full h-full object-contain transition-opacity duration-300" 
          />
        </div>
        {!isCollapsed && <span className="text-xl font-bold tracking-tight whitespace-nowrap">{userData?.workspaceName || 'Media Platform'}</span>}
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : 'matchPaths' in item && Array.isArray(item.matchPaths)
              ? item.matchPaths.some(p => pathname.startsWith(p))
              : pathname.startsWith(item.href);
            
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center justify-between p-3 rounded-md text-foreground-secondary font-medium transition-all duration-200 relative no-underline hover:bg-foreground/5 hover:text-foreground group",
                isCollapsed && "justify-center",
                isActive && "bg-primary/10 text-foreground border border-primary/30 shadow-md shadow-primary/10",
                isCollapsed && "after:content-[attr(data-tooltip)] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:ml-3 after:px-3 after:py-1.5 after:bg-base-200 after:text-foreground after:text-xs after:rounded-sm after:whitespace-nowrap after:opacity-0 after:pointer-events-none after:transition-all after:duration-200 after:z-100 after:border after:border-foreground/10 after:shadow-lg hover:after:opacity-100 hover:after:translate-x-1"
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
                {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </div>
              {item.badge && (
                <span className={cn(
                  "bg-primary text-primary-content text-xs font-bold px-2 py-0.5 rounded-full leading-none transition-all",
                  isCollapsed ? "absolute top-1 right-1 text-2xs px-1" : "relative"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Global tools & User Profile at bottom */}
      <div className="mt-auto pt-6 border-t border-foreground/10 flex flex-col gap-4 w-full shrink-0">
        {/* Theme Switcher ở trên */}
        <div className={cn(
          "flex w-full items-center",
          isCollapsed ? "justify-center" : "justify-start px-2"
        )}>
          <ThemeSwitcher showLabel={!isCollapsed} />
        </div>

        {/* User Profile ở dưới */}
        <div className={cn(
          "flex items-center gap-3 min-w-0 w-full",
          isCollapsed ? "justify-center px-0" : "justify-start px-2"
        )}>
          <div className="w-9 h-9 rounded-full bg-background-tertiary flex items-center justify-center font-semibold text-foreground-secondary border border-foreground/10 shrink-0 overflow-hidden shadow-md">
            {userData?.avatar ? (
              <img src={userData.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              userData?.name?.charAt(0) || 'U'
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-foreground truncate font-brand leading-none">{userData?.name || 'User'}</span>
              <span className="text-3xs text-foreground-secondary truncate uppercase tracking-widest font-mono mt-1 leading-none">{userData?.role || 'Member'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

