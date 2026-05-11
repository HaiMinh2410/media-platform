'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatSimulatorProps {
  accountId: string;
  accountName: string;
  personaDraft: any;
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  debug?: {
    action?: string;
    reasoning?: string;
    confidence?: number;
  };
};

export function ChatSimulator({ accountId, accountName, personaDraft }: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Cho mình xin giá sản phẩm nhé',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Create a simplified history array
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch(`/api/ai-personas/simulator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          persona: personaDraft,
          incomingMessage: newUserMsg.content,
          history
        })
      });

      if (!res.ok) {
        // Fallback for when T168 is not yet implemented or error
        throw new Error(`API Error ${res.status}`);
      }

      const data = await res.json();
      
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Dạ vâng ạ.',
        debug: {
          action: data.action,
          reasoning: data.reasoning,
          confidence: data.confidence,
        }
      };

      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.warn("Simulator API error/fallback:", error);
      // Fallback mock response if API fails/not implemented yet
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `(Mock) Dạ vâng ạ, chào bạn! Mình là ${personaDraft.name || 'Em'}. Đây là giá của sản phẩm ạ: 500k.`,
          debug: {
            action: 'send_price',
            reasoning: 'User asked for price, providing mock data.',
            confidence: 0.95
          }
        };
        setMessages(prev => [...prev, fallbackMsg]);
        setIsTyping(false);
      }, 1500);
      return; // Return here to prevent setIsTyping(false) running twice immediately
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-custom" ref={scrollRef}>
        <div className="text-center text-xs text-foreground-tertiary my-4">
          Bắt đầu phiên giả lập với {personaDraft.name || 'Persona'}
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className="flex items-end gap-2">
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-1">
                  <Icon lucide={Bot} size={12} className="text-primary" />
                </div>
              )}
              
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-foreground/5 text-foreground rounded-bl-sm"
              )}>
                {msg.content}
              </div>
            </div>

            {/* Debug Info for Assistant messages */}
            {msg.role === 'assistant' && msg.debug && (
              <div className="mt-1.5 ml-8 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600/80 dark:text-emerald-400/80 max-w-full overflow-hidden">
                <div className="font-semibold mb-0.5">⚡ Debug Info:</div>
                <div className="truncate">Action: {msg.debug.action}</div>
                {msg.debug.confidence && <div>Confidence: {(msg.debug.confidence * 100).toFixed(1)}%</div>}
                <div className="truncate text-ellipsis" title={msg.debug.reasoning}>Reason: {msg.debug.reasoning}</div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-1">
                <Icon lucide={Bot} size={12} className="text-primary" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-foreground/5 text-foreground flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-foreground/10 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập tin nhắn test giả lập..."
            className="flex-1 bg-foreground/5 border border-foreground/10 rounded-full px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Icon lucide={Send} size={16} className="-ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
