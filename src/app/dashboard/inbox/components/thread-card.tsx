'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { cn } from '@/lib/utils';
import { MessageCircle, Flame, Star, Bot, Users } from 'lucide-react';

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
      case 'high': return "bg-status-error/15 text-status-error";
      case 'medium': return "bg-status-warning/15 text-status-warning";
      case 'low': return "bg-status-info/15 text-status-info";
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
        "flex gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent no-underline absolute left-3 w-[calc(100%-24px)] box-border hover:bg-white/5 group", 
        isActive && "bg-white/5 border-white/10 shadow-sm", 
        isUnread && "bg-white/[0.02]"
      )}
      style={style}
    >
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-base font-semibold text-foreground-secondary shrink-0 relative border border-white/10 overflow-visible">
        {conversation.customer_avatar ? (
          <img src={conversation.customer_avatar} alt={conversation.sender_name} className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(conversation.sender_name)
        )}
        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center p-0.5 shadow-lg border-[1.5px] border-[#1a1a1e] z-10">
          {conversation.platform === 'instagram' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#1877F2] w-full h-full">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className={cn(
              "font-medium text-foreground text-[0.9375rem] whitespace-nowrap overflow-hidden text-ellipsis",
              isUnread && "font-semibold text-white"
            )}>
              {conversation.sender_name || 'Unknown User'}
            </span>
            
            {conversation.is_vip && (
              <span className="text-amber-500 flex items-center" title="VIP">
                <Star size={12} fill="currentColor" />
              </span>
            )}


            {conversation.priority === 'high' && (
              <span className="text-red-500 flex items-center" title="Hot Lead">
                <Flame size={12} fill="currentColor" />
              </span>
            )}
            
            {conversation.ai_replied && (
              <span className="text-accent-primary flex items-center" title="AI Handled">
                <Bot size={12} />
              </span>
            )}
          </div>
          <span className="text-[0.7rem] text-foreground-tertiary shrink-0 ml-2">{formatTime(conversation.last_message_at)}</span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <span className={cn(
            "text-[0.8125rem] text-foreground-secondary whitespace-nowrap overflow-hidden text-ellipsis",
            isUnread && "font-medium text-foreground"
          )}>
            {conversation.last_message_content || 'No messages'}
          </span>
          {isUnread && (
            <span className="bg-accent-primary text-white min-w-[18px] h-[18px] rounded-full px-1.5 text-[0.7rem] font-semibold flex items-center justify-center shrink-0 shadow-lg shadow-accent-primary/20">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {conversation.priority && LEAD_STAGE_LABELS[conversation.priority] && (
            <span className={cn("text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-md", getPriorityClass(conversation.priority))}>
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
