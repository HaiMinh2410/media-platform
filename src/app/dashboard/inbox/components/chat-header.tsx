'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';
import { PlatformIcon } from '@/components/ui/inbox-shared';
import { PanelRight, MoreHorizontal, ShieldAlert, Trash2, Search, X } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import clsx from 'clsx';

type ChatHeaderProps = {
  conversationId: string;
  customerName: string;
  customerAvatar?: string;
  platform: string;
  platformUserName: string;
};

export function ChatHeader({
  conversationId,
  customerName,
  customerAvatar,
  platform,
  platformUserName,
}: ChatHeaderProps) {
  const router = useRouter();
  const setRightSidebarTab = useInboxStore((state) => state.setRightSidebarTab);
  const setRightPanelVisible = useInboxStore((state) => state.setRightPanelVisible);
  const isRightPanelVisible = useInboxStore((state) => state.isRightPanelVisible);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMoveToSpam = async () => {
    setIsDropdownOpen(false);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'spam' }),
      });
      if (res.ok) {
        toast.success('Conversation moved to spam');
        router.push('/dashboard/inbox');
      } else {
        toast.error('Failed to move conversation to spam');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    }
  };

  const handleDeleteConversation = async () => {
    setIsDropdownOpen(false);
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Conversation deleted successfully');
        router.push('/dashboard/inbox');
      } else {
        toast.error('Failed to delete conversation');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    }
  };

  const handleToggleSearch = () => {
    setIsDropdownOpen(false);
    setRightSidebarTab('search');
    setRightPanelVisible(true);
  };

  const getInitials = (name: string) => {
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className={styles.avatarImg} />
          ) : (
            getInitials(customerName)
          )}
        </div>
        <div>
          <h2 className={styles.userName}>{customerName}</h2>
          <div className={styles.platformDetails}>
            <PlatformIcon platform={platform as any} size={14} />
            <span className={styles.platformBadge}>{platform}</span>
            <span className={styles.status}>via {platformUserName}</span>
          </div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <button 
          className={clsx(styles.actionBtn, isRightPanelVisible && styles.activeActionBtn)}
          onClick={() => setRightPanelVisible(!isRightPanelVisible)}
          title="Toggle Right Panel"
        >
          <PanelRight size={20} />
        </button>
        
        <div className={styles.moreMenuContainer} ref={dropdownRef}>
          <button 
            className={clsx(styles.actionBtn, isDropdownOpen && styles.activeActionBtn)}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="More Options"
          >
            <MoreHorizontal size={20} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button className={styles.dropdownItem} onClick={handleToggleSearch}>
                <Search size={16} />
                <span>Search conversation</span>
              </button>
              <button className={styles.dropdownItem} onClick={handleMoveToSpam}>
                <ShieldAlert size={16} />
                <span>Move to spam</span>
              </button>
              <button 
                className={clsx(styles.dropdownItem, styles.dropdownItemDanger)} 
                onClick={handleDeleteConversation}
              >
                <Trash2 size={16} />
                <span>Delete conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
