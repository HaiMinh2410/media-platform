'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlatformIcon } from '@/components/ui/inbox-shared';
import { MoreHorizontal, ShieldAlert, ShieldCheck, Trash2, Search, X } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ChatHeaderProps = {
  conversationId: string;
  customerName: string;
  customerAvatar?: string;
  platform: string;
  platformUserName: string;
  tags?: string[];
  onUpdateTags?: (tags: string[]) => void;
};

export function ChatHeader({
  conversationId,
  customerName,
  customerAvatar,
  platform,
  platformUserName,
  tags = [],
  onUpdateTags,
}: ChatHeaderProps) {
  const router = useRouter();
  const triggerRefresh = useInboxStore((state) => state.triggerRefresh);
  const setRightSidebarTab = useInboxStore((state) => state.setRightSidebarTab);
  const setRightPanelVisible = useInboxStore((state) => state.setRightPanelVisible);
  const isRightPanelVisible = useInboxStore((state) => state.isRightPanelVisible);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const metaRes = await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'spam' }),
      });

      const newTags = ['Bị chặn::#ef4444'];
      if (onUpdateTags) {
        onUpdateTags(newTags);
      } else {
        await fetch(`/api/conversations/${conversationId}/tags`, {
          method: 'PUT',
          body: JSON.stringify({ tags: newTags }),
        });
      }

      if (metaRes.ok) {
        toast.success('Hội thoại đã được chuyển vào mục spam và bị chặn');
        triggerRefresh();
        router.push('/dashboard/inbox');
      } else {
        toast.error('Không thể chuyển hội thoại vào mục spam');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  const handleUnblock = async () => {
    setIsDropdownOpen(false);
    try {
      const metaRes = await fetch(`/api/conversations/${conversationId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'open' }),
      });

      const newTags = tags.filter(t => !t.startsWith('Bị chặn::'));
      if (onUpdateTags) {
        onUpdateTags(newTags);
      } else {
        await fetch(`/api/conversations/${conversationId}/tags`, {
          method: 'PUT',
          body: JSON.stringify({ tags: newTags }),
        });
      }

      if (metaRes.ok) {
        toast.success('Đã bỏ chặn hội thoại');
        triggerRefresh();
        router.push('/dashboard/inbox');
      } else {
        toast.error('Không thể bỏ chặn hội thoại');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
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
    <header className="p-[16px_24px] border-b border-foreground/10 bg-background/80 backdrop-blur-xl z-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center font-semibold text-foreground border border-foreground/10 overflow-hidden">
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover" />
          ) : (
            getInitials(customerName)
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-0.5">{customerName}</h2>
          <div className="flex items-center gap-2">
            <PlatformIcon platform={platform as any} size={14} />
            <span className="bg-foreground/10 px-2 py-0.5 rounded-sm text-xs capitalize text-foreground-secondary">{platform}</span>
            <span className="text-13 text-foreground-tertiary">via {platformUserName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className={cn(
              "bg-transparent border border-foreground/10 text-foreground-secondary w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors hover:bg-foreground/5 hover:text-foreground",
              isDropdownOpen && "bg-accent-primary/15 border-accent-primary text-accent-primary"
            )}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="More Options"
          >
            <MoreHorizontal size={20} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl z-[100] py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-foreground-secondary hover:bg-foreground/5 hover:text-foreground transition-colors text-left" onClick={handleToggleSearch}>
                <Search size={16} />
                <span>Search conversation</span>
              </button>
              {tags.some(t => t.startsWith('Bị chặn::')) ? (
                <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-foreground-secondary hover:bg-foreground/5 hover:text-foreground transition-colors text-left" onClick={handleUnblock}>
                  <ShieldCheck size={16} />
                  <span>Unblock</span>
                </button>
              ) : (
                <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-foreground-secondary hover:bg-foreground/5 hover:text-foreground transition-colors text-left" onClick={handleMoveToSpam}>
                  <ShieldAlert size={16} />
                  <span>Move to spam</span>
                </button>
              )}
              <button 
                className="w-full px-4 py-2 flex items-center gap-3 text-sm text-status-error hover:bg-status-error/10 hover:text-status-error transition-colors text-left" 
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
