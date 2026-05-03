import React, { useState, useEffect } from 'react';
import { Search, X, User, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageWithSender } from '@/domain/types/messaging';

interface SearchTabProps {
  conversationId: string;
  onJumpToMessage?: (id: string) => void;
  onClose: () => void;
}

export function SearchTab({ conversationId, onJumpToMessage, onClose }: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageWithSender[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderFilter, setSenderFilter] = useState<'user' | 'agent' | ''>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | ''>('');

  useEffect(() => {
    if (!searchQuery.trim() && !senderFilter && !dateFilter) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let url = `/api/conversations/${conversationId}/messages?q=${encodeURIComponent(searchQuery)}&limit=100`;
        if (senderFilter) url += `&senderType=${senderFilter}`;
        
        if (dateFilter) {
          const now = new Date();
          let fromDate;
          if (dateFilter === 'today') {
            fromDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          } else if (dateFilter === 'week') {
            fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          }
          if (fromDate) url += `&fromDate=${fromDate}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (json.data) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, conversationId, senderFilter, dateFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-white/5">
        <h3 className="text-[0.875rem] font-bold text-foreground">Search in Conversation</h3>
        <button className="text-foreground-tertiary hover:text-foreground p-1 transition-colors" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-4">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary group-focus-within:text-accent-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search keywords..." 
            className="w-full bg-black/20 border border-white/10 pl-10 pr-10 py-2 rounded-lg text-[0.875rem] text-foreground outline-none focus:border-accent-primary transition-all" 
            autoFocus 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-primary animate-spin" />}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
              senderFilter === 'user' 
                ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
            )}
            onClick={() => setSenderFilter(senderFilter === 'user' ? '' : 'user')}
          >
            <User size={14} />
            <span>{senderFilter === 'user' ? 'Customer only' : 'Customer'}</span>
          </div>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
              senderFilter === 'agent' 
                ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
            )}
            onClick={() => setSenderFilter(senderFilter === 'agent' ? '' : 'agent')}
          >
            <MessageSquare size={14} />
            <span>{senderFilter === 'agent' ? 'Agent only' : 'Agent'}</span>
          </div>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium border transition-all cursor-pointer",
              dateFilter === 'today' 
                ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" 
                : "bg-white/5 border-white/10 text-foreground-tertiary hover:bg-white/10"
            )}
            onClick={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}
          >
            <Calendar size={14} />
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
        {!searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-foreground-tertiary">
              <Search size={32} />
            </div>
            <p className="text-[0.875rem] text-foreground-tertiary leading-relaxed">Enter a keyword to start searching for messages and files in this conversation.</p>
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((msg) => (
            <div 
              key={msg.id} 
              className="p-3 bg-white/[0.03] border border-white/5 rounded-lg cursor-pointer transition-all hover:bg-white/10 hover:border-white/20"
              onClick={() => onJumpToMessage?.(msg.id)}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={cn(
                  "text-[0.7rem] font-bold px-2 py-0.5 rounded uppercase",
                  msg.senderType === 'user' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                )}>
                  {msg.senderType === 'user' ? 'Customer' : 'Agent'}
                </span>
                <span className="text-[0.7rem] text-foreground-tertiary">
                  {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-[0.875rem] text-foreground-secondary line-clamp-2 leading-relaxed">{msg.content}</p>
            </div>
          ))
        ) : !isSearching ? (
          <div className="py-10 text-center text-foreground-tertiary text-[0.875rem]">
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
