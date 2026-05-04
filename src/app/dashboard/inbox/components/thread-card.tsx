'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { cn } from '@/lib/utils';
import { MessageCircle, Flame, Star, Bot, Users } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export function ThreadCard({ conversation, style }: { conversation: ConversationWithLastMessage, style?: React.CSSProperties }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/inbox/${conversation.id}`);

  const formatTime = (dateStr: Date | string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (diff < oneDay && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < oneDay * 2) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isUnread = conversation.unread_count > 0;

  const getPriorityClass = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high': return "bg-error/15 text-error";
      case 'medium': return "bg-warning/15 text-warning";
      case 'low': return "bg-info/15 text-info";
      default: return '';
    }
  };


  const LEAD_STAGE_LABELS: Record<string, string> = {
    'new': 'Tiếp nhận',
    'qualified': 'Đủ tiêu chuẩn',
    'converted': 'Đã chuyển đổi',
    'lost': 'Bị mất đi',
    'unqualified': 'Không đủ tiêu chuẩn'
  };

  return (
    <Link 
      href={`/dashboard/inbox/${conversation.id}`} 
      className={cn(
        "flex gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent no-underline absolute left-3 w-[calc(100%-24px)] box-border hover:bg-foreground/5 group", 
        isActive && "bg-foreground/5 border-foreground/10 shadow-sm", 
        isUnread && "bg-foreground/[0.03]"
      )}
      style={style}
    >
      <div className="w-11 h-11 rounded-full bg-background-tertiary flex items-center justify-center text-base font-semibold text-foreground-secondary shrink-0 relative border border-foreground/10 overflow-visible">
        {conversation.customer_avatar ? (
          <img src={conversation.customer_avatar} alt={conversation.sender_name} className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(conversation.sender_name)
        )}
        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-background flex items-center justify-center p-0.5 shadow-lg border-[1.5px] border-background z-10">
          {conversation.platform === 'instagram' ? (
            <Icon name="instagram" size="100%" className="text-instagram" />
          ) : (
            <Icon name="facebook" size="100%" className="text-facebook" />
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className={cn(
              "font-medium text-foreground text-base whitespace-nowrap overflow-hidden text-ellipsis",
              isUnread && "font-semibold"
            )}>
              {conversation.sender_name || 'Unknown User'}
            </span>
            
            {conversation.is_vip && (
              <span className="text-warning flex items-center" title="VIP">
                <Star size={12} fill="currentColor" />
              </span>
            )}


            {conversation.priority === 'high' && (
              <span className="text-error flex items-center" title="Hot Lead">
                <Flame size={12} fill="currentColor" />
              </span>
            )}
            
            {conversation.ai_replied && (
              <span className="text-primary flex items-center" title="AI Handled">
                <Bot size={12} />
              </span>
            )}
          </div>
          <span className="text-xs text-foreground-tertiary shrink-0 ml-2">{formatTime(conversation.last_message_at)}</span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <span className={cn(
            "text-sm text-foreground-secondary whitespace-nowrap overflow-hidden text-ellipsis",
            isUnread && "font-medium text-foreground"
          )}>
            {conversation.last_message_content || 'No messages'}
          </span>
          {isUnread && (
            <span className="bg-primary text-primary-content min-w-[18px] h-[18px] rounded-full px-1.5 text-xs font-semibold flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {conversation.priority && LEAD_STAGE_LABELS[conversation.priority] && (
            <span className={cn("text-2xs font-bold uppercase px-1.5 py-0.5 rounded-md", getPriorityClass(conversation.priority))}>
              {LEAD_STAGE_LABELS[conversation.priority]}
            </span>
          )}
          {conversation.canonical_conversation_id && (
            <span className="text-foreground-tertiary" title="Linked Identity">
              <Users size={12} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
