import { cn } from "@shared/lib";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import { AccountAvatar } from "@shared/ui";

interface SidebarCollapsedProps {
  customerName?: string;
  customerAvatar?: string;
  platform: string;
  activeThreads: any[];
  conversationId: string;
  onToggleCollapse: () => void;
  removeActiveThread: (id: string) => void;
}

export function SidebarCollapsed({
  customerName,
  customerAvatar,
  platform,
  activeThreads,
  conversationId,
  onToggleCollapse,
  removeActiveThread
}: SidebarCollapsedProps) {
  const router = useRouter();
  const otherThreads = activeThreads.filter(t => t.id !== conversationId);
  
  return (
    <aside className="w-full h-full p-3 flex flex-col items-center gap-4 bg-base-200 border-l border-base-content/5">
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Active Conversation Avatar - Toggles Sidebar */}
        <div 
          onClick={onToggleCollapse}
          title={customerName || 'Active Conversation'}
          className="cursor-pointer"
        >
          <AccountAvatar
            avatarUrl={customerAvatar}
            name={customerName || 'Unknown'}
            platform={platform}
            size={9}
            showPlatformIcon={true}
            className="hover:scale-105"
          />
        </div>

        {/* Divider */}
        {otherThreads.length > 0 && <div className="w-full h-px bg-base-content/10 my-2" />}

        {/* Other Active Threads */}
        {otherThreads.length > 0 && (
          <div className="flex flex-col items-center gap-5 w-full">
            {otherThreads.map(t => (
              <div 
                key={t.id} 
                className="group relative cursor-pointer"
                onClick={() => router.push(`/dashboard/inbox/${t.id}`)}
                title={t.sender_name || 'Switch conversation'}
              >
                <AccountAvatar
                  avatarUrl={t.customer_avatar}
                  name={t.sender_name || 'Unknown'}
                  platform={t.platform || platform}
                  size={9}
                  showPlatformIcon={true}
                  className="transition-all hover:scale-110"
                />
                
                <button 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-10 border-2 border-background transition-all hover:scale-110 cursor-pointer"
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
