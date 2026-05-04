import React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarCollapsedProps {
  customerName?: string;
  customerAvatar?: string;
  activeThreads: any[];
  conversationId: string;
  onToggleCollapse: () => void;
  removeActiveThread: (id: string) => void;
}

export function SidebarCollapsed({
  customerName,
  customerAvatar,
  activeThreads,
  conversationId,
  onToggleCollapse,
  removeActiveThread
}: SidebarCollapsedProps) {
  const router = useRouter();
  const otherThreads = activeThreads.filter(t => t.id !== conversationId);
  
  return (
    <aside className="w-full h-full p-3 flex flex-col items-center gap-4 bg-base-200 border-l border-foreground/5">
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Active Conversation Avatar - Toggles Sidebar */}
        <div 
          className={cn(
            "relative w-9 h-9 rounded-full bg-background-tertiary border-2 border-foreground/10 flex items-center justify-center text-sm font-bold text-foreground cursor-pointer transition-all hover:scale-105 hover:border-accent-primary shadow-lg",
            "border-accent-primary bg-accent-primary/10 ring-2 ring-accent-primary/20"
          )}
          onClick={onToggleCollapse}
          title={customerName || 'Active Conversation'}
        >
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover rounded-full" />
          ) : (
            customerName?.charAt(0) || 'U'
          )}
          <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-background border-[1.5px] border-background rounded-full flex items-center justify-center text-instagram shadow-lg z-10">
            <Camera size={10} />
          </div>
        </div>

        {/* Divider */}
        {otherThreads.length > 0 && <div className="w-6 h-px bg-foreground/10 opacity-50 my-2" />}

        {/* Other Active Threads */}
        {otherThreads.length > 0 && (
          <div className="flex flex-col items-center gap-5 w-full">
            {otherThreads.map(t => (
              <div 
                key={t.id} 
                className="group relative w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center bg-foreground/5 cursor-pointer transition-all hover:scale-110 hover:bg-foreground/10 hover:border-foreground-tertiary"
                onClick={() => router.push(`/dashboard/inbox/${t.id}`)}
                title={t.sender_name || 'Switch conversation'}
              >
                {t.customer_avatar ? (
                  <img src={t.customer_avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-xs font-bold text-foreground-secondary">{t.sender_name?.charAt(0) || '?'}</span>
                )}
                
                <button 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-10 border-2 border-background transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeActiveThread(t.id);
                  }}
                  title="Remove from tabs"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
